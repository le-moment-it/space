import type { DeckCard } from '../cards/types';
import { MAX_UPGRADE_LEVEL, nextLevel, rarityOf } from '../cards/types';
import { RARITY_ODDS, RARITY_PRICE_PREMIUM, type OfferSource } from '../cards/rarityOdds';
import { endPlayerTurn, initCombat, playCard } from '../combat/resolve';
import { DEFAULT_COMBAT_CONFIG, type CombatConfig } from '../combat/types';
import { generateMap } from '../map/generate';
import { DEFAULT_MAP_CONFIG } from '../map/types';
import { applyShipSystems } from '../shipSystems/apply';
import { applyCrewPassives, crewRepairAfterCombat } from '../crew/apply';
import { shuffle, weightedSample, type Rng } from '../rng';
import type { MapGraph } from '../map/types';
import type { RunConfig, RunContent, RunState, ShopOfferItem } from './types';
import { DEFAULT_RUN_CONFIG, TOTAL_ACTS } from './types';

/** Later acts pay out (and reward) more salvage, to match the higher stakes. */
const ACT_REWARD_MULTIPLIER: Record<number, number> = { 1: 1, 2: 1.3, 3: 1.6 };

function rewardMultiplierForAct(act: number): number {
  return ACT_REWARD_MULTIPLIER[act] ?? 1;
}

export function initRun(
  map: MapGraph,
  startingDeck: readonly DeckCard[],
  config: RunConfig = DEFAULT_RUN_CONFIG,
): RunState {
  return {
    act: 1,
    map,
    currentNodeId: null,
    visitedNodeIds: [],
    hull: config.maxHull,
    maxHull: config.maxHull,
    deckCards: [...startingDeck],
    salvage: config.startingSalvage,
    shipSystemIds: [],
    crewIds: [],
    phase: 'map',
    activeCombat: null,
    activeEventId: null,
    activeCrewId: null,
    shopOffer: null,
    pendingReward: null,
    rewardOptions: null,
    cardRewardOptions: null,
    log: ['Departing on a new run. Act 1.'],
  };
}

/**
 * Draws `count` distinct cards from a pool, weighted by rarity for that source.
 * Rarity is what makes a card rare — the pools themselves are no longer curated.
 */
function offerCards(
  pool: readonly string[],
  count: number,
  source: OfferSource,
  content: RunContent,
  rng: Rng,
): string[] {
  return weightedSample(
    pool,
    count,
    (id) => rarityOf(content.cardDefinitions[id] ?? {}),
    RARITY_ODDS[source],
    rng,
  );
}

/**
 * The combat rules this run actually fights under: the base config plus every owned
 * ship system and crew passive.
 *
 * Ship systems and crew fold separately — ship systems are stat bumps, crew are
 * rule-changers, and each union has its own exhaustive switch.
 *
 * Derived on demand rather than stored, so it can never drift from the run's systems.
 * It must be recomputed for *every* turn, not just when combat starts — see
 * endRunCombatTurn, where omitting it silently reverted shields/power/draw to the
 * defaults from turn 2 onward.
 */
function effectiveCombatConfig(runState: RunState, content: RunContent): CombatConfig {
  const baseConfig: CombatConfig = {
    ...(content.combatConfig ?? DEFAULT_COMBAT_CONFIG),
    playerMaxHull: runState.maxHull,
  };
  const withSystems = applyShipSystems(
    baseConfig,
    runState.shipSystemIds,
    content.shipSystemDefinitions,
  );
  return applyCrewPassives(withSystems, runState.crewIds, content.crewDefinitions);
}

/** Node ids the player may currently pick on the star chart. */
export function getAvailableNodeIds(runState: RunState): string[] {
  if (runState.currentNodeId === null) return runState.map.entryNodeIds;
  return runState.map.nodes[runState.currentNodeId]?.next ?? [];
}

function generateShopOffer(
  pool: readonly string[],
  content: RunContent,
  rng: Rng,
): ShopOfferItem[] {
  return offerCards(pool, 3, 'shop', content, rng).map((cardId) => {
    const def = content.cardDefinitions[cardId];
    return {
      cardId,
      // Energy cost sets the base; rarity is what you actually pay for.
      price: 20 + def.cost * 15 + RARITY_PRICE_PREMIUM[rarityOf(def)],
      purchased: false,
    };
  });
}

export function enterNode(
  runState: RunState,
  nodeId: string,
  content: RunContent,
  rng: Rng,
): RunState {
  if (runState.phase !== 'map') return runState;
  if (!getAvailableNodeIds(runState).includes(nodeId)) return runState;
  const node = runState.map.nodes[nodeId];
  if (!node) return runState;

  const base: RunState = {
    ...runState,
    currentNodeId: nodeId,
    visitedNodeIds: [...runState.visitedNodeIds, nodeId],
  };

  switch (node.type) {
    case 'combat':
    case 'elite':
    case 'boss': {
      const enemy =
        node.type === 'combat'
          ? rng.pick(content.combatEnemiesByAct[runState.act] ?? [])
          : node.type === 'elite'
            ? rng.pick(content.eliteEnemiesByAct[runState.act] ?? [])
            : content.bossEnemyByAct[runState.act];
      const combat = initCombat({
        cardDefinitions: content.cardDefinitions,
        startingDeck: runState.deckCards,
        enemy,
        rng,
        config: effectiveCombatConfig(runState, content),
        startingHull: runState.hull,
      });
      return {
        ...base,
        phase: 'combat',
        activeCombat: combat,
        log: [...base.log, `Contact: ${enemy.name}.`],
      };
    }
    case 'event': {
      // Event nodes are where crew are found: if any recruitable crew member isn't
      // aboard yet, there's a chance this event is a recruitment offer instead.
      const unrecruited = content.recruitableCrewIds.filter(
        (id) => !runState.crewIds.includes(id) && content.crewDefinitions[id],
      );
      if (unrecruited.length > 0 && rng.next() < content.crewOfferChance) {
        const crewId = rng.pick(unrecruited);
        const crew = content.crewDefinitions[crewId];
        return {
          ...base,
          phase: 'crewOffer',
          activeCrewId: crewId,
          log: [...base.log, `Encountered a drifting escape pod: ${crew.name}.`],
        };
      }
      const def = rng.pick(content.events);
      return {
        ...base,
        phase: 'event',
        activeEventId: def.id,
        log: [...base.log, `Encountered: ${def.title}.`],
      };
    }
    case 'rest': {
      const healAmount = Math.round(runState.maxHull * 0.35);
      const hull = Math.min(runState.maxHull, runState.hull + healAmount);
      return {
        ...base,
        phase: 'rest',
        hull,
        log: [...base.log, `Repair bay: hull restored by ${hull - runState.hull}.`],
      };
    }
    case 'shop': {
      const shopOffer = generateShopOffer(content.shopCardPool, content, rng);
      return {
        ...base,
        phase: 'shop',
        shopOffer,
        log: [...base.log, 'Docked at a salvage trader.'],
      };
    }
    case 'treasure': {
      const cardId =
        offerCards(content.treasureCardPool, 1, 'cache', content, rng)[0] ??
        rng.pick(content.treasureCardPool);
      const salvageGain = Math.round(15 * rewardMultiplierForAct(runState.act));
      return {
        ...base,
        phase: 'treasure',
        salvage: runState.salvage + salvageGain,
        deckCards: [...runState.deckCards, { cardId, level: 0 }],
        pendingReward: { salvage: salvageGain, cardId },
        log: [
          ...base.log,
          `Derelict cache: +${salvageGain} salvage, recovered ${content.cardDefinitions[cardId].name}.`,
        ],
      };
    }
    case 'garage': {
      return {
        ...base,
        phase: 'garage',
        log: [...base.log, 'Docked at a refit garage.'],
      };
    }
    default: {
      // Exhaustive: a new node type must declare what entering it does, rather
      // than silently consuming the node and leaving the player on the map.
      const exhaustive: never = node.type;
      throw new Error(`Unhandled node type: ${String(exhaustive)}`);
    }
  }
}

/**
 * Deck indices the player may upgrade right now.
 * `permanentOnly` restricts it to copies fielded from a loadout slot — the only
 * ones an act-end reward can upgrade forever. Derived, never stored, so it can
 * never go stale against the deck.
 */
export function upgradableDeckIndices(runState: RunState, permanentOnly: boolean): number[] {
  return runState.deckCards.flatMap((card, i) =>
    card.level < MAX_UPGRADE_LEVEL && (!permanentOnly || card.loadoutIndex !== undefined)
      ? [i]
      : [],
  );
}

/** Raises one deck copy a tier. Shared by the garage and the act-end reward. */
function withUpgradedCopy(runState: RunState, deckIndex: number): DeckCard[] {
  return runState.deckCards.map((card, i) =>
    i === deckIndex ? { ...card, level: nextLevel(card.level) } : card,
  );
}

/**
 * Garage: upgrade one card for the rest of this run. Deliberately ignores
 * loadoutIndex and never touches meta — "this run only" is enforced by the
 * engine having no way to write permanent state, not merely by intent.
 */
export function upgradeCardAtGarage(
  runState: RunState,
  deckIndex: number,
  content: RunContent,
): RunState {
  if (runState.phase !== 'garage') return runState;
  if (!upgradableDeckIndices(runState, false).includes(deckIndex)) return runState;

  const card = runState.deckCards[deckIndex];
  const name = content.cardDefinitions[card.cardId]?.name ?? card.cardId;
  return {
    ...runState,
    deckCards: withUpgradedCopy(runState, deckIndex),
    phase: 'map',
    log: [...runState.log, `Refit ${name} (+${nextLevel(card.level)}) for this run.`],
  };
}

function resolveCombatOutcome(runState: RunState, content: RunContent): RunState {
  const combat = runState.activeCombat;
  if (!combat) return runState;

  if (combat.phase === 'lost') {
    return {
      ...runState,
      hull: combat.player.hull,
      log: [...runState.log, 'Hull integrity reached zero.'],
    };
  }

  if (combat.phase === 'won') {
    // Between-fight crew repair. Not part of the combat config fold: it happens after
    // the fight is over, so it can never be undone by the enemy's last hit.
    const repair = crewRepairAfterCombat(runState.crewIds, content.crewDefinitions);
    const hull = Math.min(runState.maxHull, combat.player.hull + repair);
    const repairLog = repair > 0 ? [`Crew repaired ${hull - combat.player.hull} hull.`] : [];

    const node = runState.map.nodes[runState.currentNodeId ?? ''];
    if (!node || node.type === 'boss') {
      return {
        ...runState,
        hull,
        log: [...runState.log, 'The boss has been defeated.', ...repairLog],
      };
    }
    // Card choice (if any) is offered on acknowledge; here we just bank the salvage.
    const baseSalvage = node.type === 'elite' ? 25 : 12;
    const salvageGain = Math.round(baseSalvage * rewardMultiplierForAct(runState.act));
    return {
      ...runState,
      hull,
      salvage: runState.salvage + salvageGain,
      log: [...runState.log, `Salvaged ${salvageGain} scrap.`, ...repairLog],
    };
  }

  return runState;
}

export function playRunCombatCard(
  runState: RunState,
  instanceId: string,
  content: RunContent,
  rng: Rng,
): RunState {
  if (runState.phase !== 'combat' || !runState.activeCombat) return runState;
  const combat = playCard(runState.activeCombat, instanceId, content.cardDefinitions, rng);
  return resolveCombatOutcome({ ...runState, activeCombat: combat }, content);
}

export function endRunCombatTurn(runState: RunState, content: RunContent, rng: Rng): RunState {
  if (runState.phase !== 'combat' || !runState.activeCombat) return runState;
  const combat = endPlayerTurn(
    runState.activeCombat,
    rng,
    effectiveCombatConfig(runState, content),
  );
  return resolveCombatOutcome({ ...runState, activeCombat: combat }, content);
}

/**
 * Called when the player dismisses a finished (won/lost) battle. A boss win goes to
 * a ship-system reward choice (3 options drawn from the unlocked pool) rather than
 * straight to runWon/next-act — see chooseShipSystemReward for that follow-up.
 */
export function acknowledgeCombat(runState: RunState, content: RunContent, rng: Rng): RunState {
  if (runState.phase !== 'combat' || !runState.activeCombat) return runState;

  if (runState.activeCombat.phase === 'lost') {
    return { ...runState, phase: 'runLost', activeCombat: null };
  }

  if (runState.activeCombat.phase === 'won') {
    const node = runState.map.nodes[runState.currentNodeId ?? ''];
    if (node?.type === 'boss') {
      const notOwned = content.availableShipSystemIds.filter(
        (id) => !runState.shipSystemIds.includes(id),
      );
      const pool = notOwned.length > 0 ? notOwned : content.availableShipSystemIds;
      const rewardOptions = shuffle(pool, rng).slice(0, 3);
      return { ...runState, phase: 'reward', activeCombat: null, rewardOptions };
    }
    // Regular / elite win: offer a card to add to the deck (Slay-the-Spire style).
    const isElite = node?.type === 'elite';
    const cardRewardOptions = offerCards(
      isElite ? content.eliteRewardCardIds : content.shopCardPool,
      3,
      isElite ? 'elite' : 'combat',
      content,
      rng,
    );
    if (cardRewardOptions.length === 0) {
      return { ...runState, phase: 'map', activeCombat: null };
    }
    return { ...runState, phase: 'cardReward', activeCombat: null, cardRewardOptions };
  }

  return runState;
}

/**
 * Resolves the post-combat card reward: `cardId` (one of the offered options) adds
 * that card to the deck; `null` skips the reward. Either way, returns to the map.
 */
export function chooseCardReward(
  runState: RunState,
  cardId: string | null,
  content: RunContent,
): RunState {
  if (runState.phase !== 'cardReward') return runState;
  const options = runState.cardRewardOptions ?? [];
  if (cardId !== null && !options.includes(cardId)) return runState;

  const deckCards =
    cardId !== null ? [...runState.deckCards, { cardId, level: 0 as const }] : runState.deckCards;
  const log =
    cardId !== null
      ? [...runState.log, `Added ${content.cardDefinitions[cardId]?.name ?? cardId} to the deck.`]
      : [...runState.log, 'Skipped the card reward.'];
  return { ...runState, deckCards, cardRewardOptions: null, phase: 'map', log };
}

/**
 * Closes out a boss reward: either the next act's freshly generated map (hull, deck,
 * salvage and ship systems all carry over) or, after the final act, victory.
 *
 * Shared by every reward path, so a new one can never accidentally skip the act
 * advance — or, worse, fail to end the run after the Act 3 boss.
 */
function advanceAfterBossReward(runState: RunState, rng: Rng, log: string[]): RunState {
  if (runState.act >= TOTAL_ACTS) {
    return { ...runState, rewardOptions: null, phase: 'runWon', log };
  }

  // Clearing an act boss fully restores the hull for the next act — a breather
  // between acts, so attrition is per-act rather than across the whole run.
  const nextAct = runState.act + 1;
  const map = generateMap(rng, DEFAULT_MAP_CONFIG);
  return {
    ...runState,
    hull: runState.maxHull,
    rewardOptions: null,
    act: nextAct,
    map,
    currentNodeId: null,
    visitedNodeIds: [],
    phase: 'map',
    log: [...log, 'Hull fully restored.', `Entering Act ${nextAct}.`],
  };
}

/** Installs the chosen ship system, then closes out the boss reward. */
export function chooseShipSystemReward(
  runState: RunState,
  shipSystemId: string,
  content: RunContent,
  rng: Rng,
): RunState {
  if (runState.phase !== 'reward' || !runState.rewardOptions?.includes(shipSystemId))
    return runState;
  const def = content.shipSystemDefinitions[shipSystemId];
  if (!def) return runState;

  let hull = runState.hull;
  let maxHull = runState.maxHull;
  if (def.effect.kind === 'maxHull') {
    maxHull += def.effect.amount;
    hull += def.effect.amount;
  }

  const withSystem: RunState = {
    ...runState,
    hull,
    maxHull,
    shipSystemIds: [...runState.shipSystemIds, shipSystemId],
  };
  return advanceAfterBossReward(withSystem, rng, [
    ...runState.log,
    `Installed ship system: ${def.name}.`,
  ]);
}

/**
 * The other half of the boss reward: permanently upgrade one card instead of
 * installing a ship system. Only copies fielded from a loadout slot are eligible,
 * because only those have a slot for the store to make the upgrade permanent in.
 * This raises the run copy too — a permanent upgrade obviously applies right away.
 */
export function chooseCardUpgradeReward(
  runState: RunState,
  deckIndex: number,
  content: RunContent,
  rng: Rng,
): RunState {
  if (runState.phase !== 'reward') return runState;
  if (!upgradableDeckIndices(runState, true).includes(deckIndex)) return runState;

  const card = runState.deckCards[deckIndex];
  const name = content.cardDefinitions[card.cardId]?.name ?? card.cardId;
  const upgraded: RunState = { ...runState, deckCards: withUpgradedCopy(runState, deckIndex) };
  return advanceAfterBossReward(upgraded, rng, [
    ...runState.log,
    `Permanently upgraded ${name} (+${nextLevel(card.level)}).`,
  ]);
}

/**
 * Escape hatch when a boss reward has nothing to offer — no unowned ship systems
 * and no upgradable loadout cards. Without it the reward phase would have no exit.
 */
export function skipBossReward(runState: RunState, rng: Rng): RunState {
  if (runState.phase !== 'reward') return runState;
  return advanceAfterBossReward(runState, rng, [...runState.log, 'Declined the boss reward.']);
}

export function resolveEventChoice(
  runState: RunState,
  choiceIndex: number,
  content: RunContent,
): RunState {
  if (runState.phase !== 'event' || !runState.activeEventId) return runState;
  const def = content.events.find((e) => e.id === runState.activeEventId);
  if (!def) return runState;
  const choice = def.choices[choiceIndex];
  if (!choice) return runState;

  let hull = runState.hull;
  let salvage = runState.salvage;
  let deckCards = runState.deckCards;
  const log = [...runState.log, `${def.title}: ${choice.label}.`];

  for (const effect of choice.effects) {
    switch (effect.kind) {
      case 'hull':
        hull = Math.max(0, Math.min(runState.maxHull, hull + effect.amount));
        log.push(effect.amount >= 0 ? `Hull +${effect.amount}.` : `Hull ${effect.amount}.`);
        break;
      case 'salvage':
        salvage += effect.amount;
        log.push(`Salvage +${effect.amount}.`);
        break;
      case 'addCard':
        deckCards = [...deckCards, { cardId: effect.cardId, level: 0 }];
        log.push(`Added ${content.cardDefinitions[effect.cardId].name} to the deck.`);
        break;
      case 'nothing':
        break;
      default: {
        const exhaustive: never = effect;
        throw new Error(`Unhandled event effect: ${JSON.stringify(exhaustive)}`);
      }
    }
  }

  if (hull <= 0) {
    return {
      ...runState,
      hull: 0,
      salvage,
      deckCards,
      activeEventId: null,
      phase: 'runLost',
      log: [...log, 'Your ship was destroyed.'],
    };
  }
  return { ...runState, hull, salvage, deckCards, activeEventId: null, phase: 'map', log };
}

export function buyShopItem(runState: RunState, index: number, content: RunContent): RunState {
  if (runState.phase !== 'shop' || !runState.shopOffer) return runState;
  const item = runState.shopOffer[index];
  if (!item || item.purchased || runState.salvage < item.price) return runState;
  const shopOffer = runState.shopOffer.map((it, i) =>
    i === index ? { ...it, purchased: true } : it,
  );
  return {
    ...runState,
    shopOffer,
    salvage: runState.salvage - item.price,
    deckCards: [...runState.deckCards, { cardId: item.cardId, level: 0 }],
    log: [
      ...runState.log,
      `Bought ${content.cardDefinitions[item.cardId].name} for ${item.price} salvage.`,
    ],
  };
}

/** Leaves a rest/shop/treasure/garage node, returning to the map. */
export function leaveNode(runState: RunState): RunState {
  const leavable = ['shop', 'treasure', 'rest', 'garage'];
  if (!leavable.includes(runState.phase)) return runState;
  return { ...runState, phase: 'map', shopOffer: null, pendingReward: null };
}

/**
 * Accept or decline a crew recruitment offer. Accepting grants that crew member's
 * passive for the rest of the run, then moves to the 'dialogue' phase (their lore line
 * for this meeting — which line is the UI's concern, since lifetime meet counts live
 * in the save, not here).
 *
 * With a full berth, `replacingCrewId` names who stands down. It is required rather
 * than defaulted: silently dropping whoever happens to be first would spend a passive
 * the player chose, and a caller that forgets it should visibly do nothing instead.
 */
export function resolveCrewOffer(
  runState: RunState,
  accept: boolean,
  content: RunContent,
  replacingCrewId?: string,
): RunState {
  if (runState.phase !== 'crewOffer' || !runState.activeCrewId) return runState;
  const crew = content.crewDefinitions[runState.activeCrewId];
  if (!crew) return runState;

  if (!accept) {
    return {
      ...runState,
      phase: 'map',
      activeCrewId: null,
      log: [...runState.log, `Left ${crew.name} behind.`],
    };
  }

  const atCapacity = runState.crewIds.length >= content.crewCap;
  if (atCapacity && !runState.crewIds.includes(replacingCrewId ?? '')) return runState;

  const replaced = atCapacity ? content.crewDefinitions[replacingCrewId ?? ''] : undefined;
  const crewIds = atCapacity
    ? [...runState.crewIds.filter((id) => id !== replacingCrewId), crew.id]
    : [...runState.crewIds, crew.id];

  return {
    ...runState,
    crewIds,
    phase: 'dialogue',
    log: [
      ...runState.log,
      replaced
        ? `${crew.name} joined the crew; ${replaced.name} stood down.`
        : `${crew.name} joined the crew.`,
    ],
  };
}

/** Closes the post-recruitment dialogue, returning to the map. */
export function dismissDialogue(runState: RunState): RunState {
  if (runState.phase !== 'dialogue') return runState;
  return { ...runState, phase: 'map', activeCrewId: null };
}
