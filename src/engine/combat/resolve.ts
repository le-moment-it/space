import type { CardDefinition, CardInstance, DeckCard } from '../cards/types';
import { effectsOf, resolveCard } from '../cards/types';
import { shuffle, type Rng } from '../rng';
import { intentForTurn } from './enemyAI';
import { applyStatus, decayStatuses, statusAmount, tickDamage } from './status';
import type { CombatConfig, CombatLogEntry, CombatState, EnemyDefinition } from './types';
import { DEFAULT_COMBAT_CONFIG } from './types';

function buildDeckInstances(deck: readonly DeckCard[]): CardInstance[] {
  return deck.map((card, index) => ({
    instanceId: `${card.cardId}#${index}`,
    cardId: card.cardId,
    level: card.level,
  }));
}

/** Draws up to `amount` cards from drawPile into hand, reshuffling discardPile in if needed. */
function drawCards(
  hand: CardInstance[],
  drawPile: CardInstance[],
  discardPile: CardInstance[],
  amount: number,
  rng: Rng,
  log: CombatLogEntry[],
): {
  hand: CardInstance[];
  drawPile: CardInstance[];
  discardPile: CardInstance[];
  log: CombatLogEntry[];
} {
  let newHand = [...hand];
  let newDrawPile = [...drawPile];
  let newDiscardPile = [...discardPile];
  const newLog = [...log];

  for (let i = 0; i < amount; i++) {
    if (newDrawPile.length === 0) {
      if (newDiscardPile.length === 0) break;
      newDrawPile = shuffle(newDiscardPile, rng);
      newDiscardPile = [];
      newLog.push({ t: 'reshuffle' });
    }
    const card = newDrawPile.pop();
    if (!card) break;
    newHand = [...newHand, card];
  }

  return { hand: newHand, drawPile: newDrawPile, discardPile: newDiscardPile, log: newLog };
}

function startPlayerTurn(state: CombatState, rng: Rng, config: CombatConfig): CombatState {
  const player = {
    ...state.player,
    shield: config.baselineShield ?? 0,
    power: config.playerMaxPower,
  };
  const { hand, drawPile, discardPile, log } = drawCards(
    state.hand,
    state.drawPile,
    state.discardPile,
    config.drawAmount,
    rng,
    state.log,
  );
  return { ...state, player, hand, drawPile, discardPile, phase: 'playerTurn', log };
}

export function initCombat(opts: {
  cardDefinitions: Record<string, CardDefinition>;
  startingDeck: readonly DeckCard[];
  enemy: EnemyDefinition;
  rng: Rng;
  config?: CombatConfig;
  /** Hull to start this fight with (e.g. carried over from earlier in a run). Defaults to full. */
  startingHull?: number;
}): CombatState {
  const config = opts.config ?? DEFAULT_COMBAT_CONFIG;
  const drawPile = shuffle(buildDeckInstances(opts.startingDeck), opts.rng);
  const startingHull =
    opts.startingHull !== undefined
      ? Math.max(0, Math.min(opts.startingHull, config.playerMaxHull))
      : config.playerMaxHull;

  const initial: CombatState = {
    player: {
      hull: startingHull,
      maxHull: config.playerMaxHull,
      shield: 0,
      power: config.playerMaxPower,
      maxPower: config.playerMaxPower,
      statuses: {},
    },
    enemy: {
      id: opts.enemy.id,
      name: opts.enemy.name,
      hull: opts.enemy.maxHull,
      maxHull: opts.enemy.maxHull,
      shield: 0,
      statuses: {},
      intentPattern: opts.enemy.intentPattern,
      intent: intentForTurn(opts.enemy.intentPattern, 0),
    },
    drawPile,
    hand: [],
    discardPile: [],
    exhaustPile: [],
    turn: 1,
    phase: 'playerTurn',
    log: [{ t: 'contact', enemyId: opts.enemy.id, hull: opts.enemy.maxHull }],
  };

  return startPlayerTurn(initial, opts.rng, config);
}

export function playCard(
  state: CombatState,
  instanceId: string,
  cardDefinitions: Record<string, CardDefinition>,
  rng: Rng,
): CombatState {
  if (state.phase !== 'playerTurn') return state;

  const cardIndex = state.hand.findIndex((c) => c.instanceId === instanceId);
  if (cardIndex === -1) return state;

  const instance = state.hand[cardIndex];
  const baseDef = cardDefinitions[instance.cardId];
  if (!baseDef) {
    throw new Error(`Unknown card id: ${instance.cardId}`);
  }
  // Resolve the upgrade level once, here: everything below reads cost/effect/exhaust
  // off `def` and so gets the upgraded values without knowing upgrades exist.
  const def = resolveCard(baseDef, instance.level);

  if (state.player.power < def.cost) {
    return { ...state, log: [...state.log, { t: 'notEnoughPower', cardId: def.id }] };
  }

  const player = { ...state.player, power: state.player.power - def.cost };
  const enemy = { ...state.enemy };
  let hand = [...state.hand.slice(0, cardIndex), ...state.hand.slice(cardIndex + 1)];
  let drawPile = state.drawPile;
  // Exhausted cards leave the fight entirely: they skip the discard pile, so the
  // reshuffle can never bring them back. The run deck is untouched.
  const exhausted = def.exhaust === true;
  let discardPile = exhausted ? state.discardPile : [...state.discardPile, instance];
  const exhaustPile = exhausted ? [...state.exhaustPile, instance] : state.exhaustPile;
  let log: CombatLogEntry[] = [...state.log, { t: 'played', cardId: def.id }];

  // Resolve every effect in order. Locals are shared across the loop, so a card can
  // draw and then strike with the cards it drew.
  for (const effect of effectsOf(def)) {
    switch (effect.kind) {
      case 'damage': {
        // Multi-hit lands as separate hits, so shields absorb from each one — worse
        // into armour, better with per-attack bonuses.
        const hits = Math.max(1, effect.times ?? 1);
        for (let i = 0; i < hits; i++) {
          if (enemy.hull <= 0) break;
          const amount = effect.amount;
          const absorbed = Math.min(enemy.shield, amount);
          enemy.shield -= absorbed;
          enemy.hull = Math.max(0, enemy.hull - (amount - absorbed));
          log.push({ t: 'damage', cardId: def.id, amount, absorbed });
        }
        break;
      }
      case 'shield':
        player.shield += effect.amount;
        log.push({ t: 'shield', amount: effect.amount });
        break;
      case 'heal':
        player.hull = Math.min(player.maxHull, player.hull + effect.amount);
        log.push({ t: 'heal', amount: effect.amount });
        break;
      case 'power':
        player.power += effect.amount;
        log.push({ t: 'power', amount: effect.amount });
        break;
      case 'weaken':
        enemy.statuses = applyStatus(enemy.statuses, 'weaken', effect.amount, effect.duration);
        log.push({ t: 'status', target: 'enemy', status: 'weaken', amount: effect.amount });
        break;
      case 'draw': {
        const result = drawCards(hand, drawPile, discardPile, effect.amount, rng, log);
        hand = result.hand;
        drawPile = result.drawPile;
        discardPile = result.discardPile;
        log = result.log;
        log.push({ t: 'draw', amount: effect.amount });
        break;
      }
      default: {
        const exhaustive: never = effect;
        throw new Error(`Unhandled card effect: ${JSON.stringify(exhaustive)}`);
      }
    }
  }

  if (exhausted) log.push({ t: 'exhausted', cardId: def.id });

  const phase = enemy.hull <= 0 ? 'won' : state.phase;
  if (phase === 'won') log.push({ t: 'enemyDestroyed', enemyId: enemy.id });

  return { ...state, player, enemy, hand, drawPile, discardPile, exhaustPile, log, phase };
}

export function endPlayerTurn(
  state: CombatState,
  rng: Rng,
  config: CombatConfig = DEFAULT_COMBAT_CONFIG,
): CombatState {
  if (state.phase !== 'playerTurn') return state;

  const discardPile = [...state.discardPile, ...state.hand];
  const log: CombatLogEntry[] = [...state.log, { t: 'endTurn' }];
  const enemy = { ...state.enemy };
  let player = { ...state.player };

  // Statuses tick before the enemy acts, so Corrosion can finish a fight on your
  // turn rather than after taking one more hit.
  const enemyTick = tickDamage(enemy.statuses);
  if (enemyTick > 0) {
    enemy.hull = Math.max(0, enemy.hull - enemyTick);
    log.push({ t: 'statusTick', target: 'enemy', status: 'corrosion', amount: enemyTick });
  }
  if (enemy.hull <= 0) {
    enemy.statuses = decayStatuses(enemy.statuses);
    log.push({ t: 'enemyDestroyed', enemyId: enemy.id });
    return { ...state, player, enemy, discardPile, hand: [], log, phase: 'won' };
  }

  const intent = enemy.intent;
  if (intent.kind === 'attack') {
    const amount = Math.max(0, intent.amount - statusAmount(enemy.statuses, 'weaken'));
    const absorbed = Math.min(player.shield, amount);
    player = { ...player, shield: player.shield - absorbed };
    const remaining = amount - absorbed;
    player = { ...player, hull: Math.max(0, player.hull - remaining) };
    log.push({ t: 'enemyAttack', enemyId: enemy.id, amount, absorbed });
  } else {
    enemy.shield += intent.amount;
    log.push({ t: 'enemyShield', enemyId: enemy.id, amount: intent.amount });
  }

  enemy.statuses = decayStatuses(enemy.statuses);
  player = { ...player, statuses: decayStatuses(player.statuses) };

  if (player.hull <= 0) {
    return { ...state, player, enemy, discardPile, hand: [], log, phase: 'lost' };
  }

  const nextTurn = state.turn + 1;
  enemy.intent = intentForTurn(enemy.intentPattern, nextTurn - 1);

  const afterEnemyTurn: CombatState = {
    ...state,
    player,
    enemy,
    discardPile,
    hand: [],
    turn: nextTurn,
    log,
    phase: 'playerTurn',
  };

  return startPlayerTurn(afterEnemyTurn, rng, config);
}
