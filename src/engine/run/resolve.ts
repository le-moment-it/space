import type { CardDefinition } from '../cards/types';
import { endPlayerTurn, initCombat, playCard } from '../combat/resolve';
import { DEFAULT_COMBAT_CONFIG } from '../combat/types';
import { applyShipSystems } from '../shipSystems/apply';
import { shuffle, type Rng } from '../rng';
import type { MapGraph } from '../map/types';
import type { RunConfig, RunContent, RunState, ShopOfferItem } from './types';
import { DEFAULT_RUN_CONFIG } from './types';

export function initRun(
  map: MapGraph,
  startingDeckCardIds: readonly string[],
  config: RunConfig = DEFAULT_RUN_CONFIG,
): RunState {
  return {
    map,
    currentNodeId: null,
    visitedNodeIds: [],
    hull: config.maxHull,
    maxHull: config.maxHull,
    deckCardIds: [...startingDeckCardIds],
    salvage: config.startingSalvage,
    shipSystemIds: [],
    phase: 'map',
    activeCombat: null,
    activeEventId: null,
    shopOffer: null,
    pendingReward: null,
    rewardOptions: null,
    log: ['Departing on a new run.'],
  };
}

/** Node ids the player may currently pick on the star chart. */
export function getAvailableNodeIds(runState: RunState): string[] {
  if (runState.currentNodeId === null) return runState.map.entryNodeIds;
  return runState.map.nodes[runState.currentNodeId]?.next ?? [];
}

function generateShopOffer(
  pool: readonly string[],
  cardDefinitions: Record<string, CardDefinition>,
  rng: Rng,
): ShopOfferItem[] {
  return shuffle(pool, rng)
    .slice(0, 3)
    .map((cardId) => ({ cardId, price: 20 + cardDefinitions[cardId].cost * 15, purchased: false }));
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
          ? rng.pick(content.combatEnemies)
          : node.type === 'elite'
            ? rng.pick(content.eliteEnemies)
            : content.bossEnemy;
      const baseConfig = {
        ...(content.combatConfig ?? DEFAULT_COMBAT_CONFIG),
        playerMaxHull: runState.maxHull,
      };
      const effectiveConfig = applyShipSystems(
        baseConfig,
        runState.shipSystemIds,
        content.shipSystemDefinitions,
      );
      const combat = initCombat({
        cardDefinitions: content.cardDefinitions,
        startingDeckCardIds: runState.deckCardIds,
        enemy,
        rng,
        config: effectiveConfig,
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
      const def = rng.pick(content.events);
      return {
        ...base,
        phase: 'event',
        activeEventId: def.id,
        log: [...base.log, `Encountered: ${def.title}.`],
      };
    }
    case 'rest': {
      const healAmount = Math.round(runState.maxHull * 0.3);
      const hull = Math.min(runState.maxHull, runState.hull + healAmount);
      return {
        ...base,
        phase: 'rest',
        hull,
        log: [...base.log, `Repair bay: hull restored by ${hull - runState.hull}.`],
      };
    }
    case 'shop': {
      const shopOffer = generateShopOffer(content.shopCardPool, content.cardDefinitions, rng);
      return {
        ...base,
        phase: 'shop',
        shopOffer,
        log: [...base.log, 'Docked at a salvage trader.'],
      };
    }
    case 'treasure': {
      const cardId = rng.pick(content.treasureCardPool);
      const salvageGain = 15;
      return {
        ...base,
        phase: 'treasure',
        salvage: runState.salvage + salvageGain,
        deckCardIds: [...runState.deckCardIds, cardId],
        pendingReward: { salvage: salvageGain, cardId },
        log: [
          ...base.log,
          `Derelict cache: +${salvageGain} salvage, recovered ${content.cardDefinitions[cardId].name}.`,
        ],
      };
    }
    default:
      return base;
  }
}

function resolveCombatOutcome(runState: RunState, content: RunContent, rng: Rng): RunState {
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
    const node = runState.map.nodes[runState.currentNodeId ?? ''];
    if (!node || node.type === 'boss') {
      return {
        ...runState,
        hull: combat.player.hull,
        log: [...runState.log, 'The boss has been defeated.'],
      };
    }
    const isElite = node.type === 'elite';
    const salvageGain = isElite ? 25 : 12;
    const cardId = isElite ? rng.pick(content.eliteRewardCardIds) : undefined;
    return {
      ...runState,
      hull: combat.player.hull,
      salvage: runState.salvage + salvageGain,
      deckCardIds: cardId ? [...runState.deckCardIds, cardId] : runState.deckCardIds,
      log: [
        ...runState.log,
        `Salvaged ${salvageGain} scrap.${cardId ? ` Recovered a ${content.cardDefinitions[cardId].name} schematic.` : ''}`,
      ],
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
  const combat = playCard(runState.activeCombat, instanceId, content.cardDefinitions);
  return resolveCombatOutcome({ ...runState, activeCombat: combat }, content, rng);
}

export function endRunCombatTurn(runState: RunState, content: RunContent, rng: Rng): RunState {
  if (runState.phase !== 'combat' || !runState.activeCombat) return runState;
  const combat = endPlayerTurn(runState.activeCombat, rng);
  return resolveCombatOutcome({ ...runState, activeCombat: combat }, content, rng);
}

/**
 * Called when the player dismisses a finished (won/lost) battle. A boss win goes to
 * a ship-system reward choice (3 options drawn from the unlocked pool) rather than
 * straight to runWon — see chooseShipSystemReward for the follow-up transition.
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
    return { ...runState, phase: 'map', activeCombat: null };
  }

  return runState;
}

export function chooseShipSystemReward(
  runState: RunState,
  shipSystemId: string,
  content: RunContent,
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

  return {
    ...runState,
    hull,
    maxHull,
    shipSystemIds: [...runState.shipSystemIds, shipSystemId],
    rewardOptions: null,
    phase: 'runWon',
    log: [...runState.log, `Installed ship system: ${def.name}.`],
  };
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
  let deckCardIds = runState.deckCardIds;
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
        deckCardIds = [...deckCardIds, effect.cardId];
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
      deckCardIds,
      activeEventId: null,
      phase: 'runLost',
      log: [...log, 'Your ship was destroyed.'],
    };
  }
  return { ...runState, hull, salvage, deckCardIds, activeEventId: null, phase: 'map', log };
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
    deckCardIds: [...runState.deckCardIds, item.cardId],
    log: [
      ...runState.log,
      `Bought ${content.cardDefinitions[item.cardId].name} for ${item.price} salvage.`,
    ],
  };
}

/** Leaves a rest/shop/treasure node, returning to the map. */
export function leaveNode(runState: RunState): RunState {
  if (runState.phase !== 'shop' && runState.phase !== 'treasure' && runState.phase !== 'rest')
    return runState;
  return { ...runState, phase: 'map', shopOffer: null, pendingReward: null };
}
