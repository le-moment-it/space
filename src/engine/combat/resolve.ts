import type { CardDefinition, CardInstance } from '../cards/types';
import { shuffle, type Rng } from '../rng';
import { intentForTurn } from './enemyAI';
import type { CombatConfig, CombatLogEntry, CombatState, EnemyDefinition } from './types';
import { DEFAULT_COMBAT_CONFIG } from './types';

function buildDeckInstances(cardIds: readonly string[]): CardInstance[] {
  return cardIds.map((cardId, index) => ({ instanceId: `${cardId}#${index}`, cardId }));
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
  startingDeckCardIds: readonly string[];
  enemy: EnemyDefinition;
  rng: Rng;
  config?: CombatConfig;
  /** Hull to start this fight with (e.g. carried over from earlier in a run). Defaults to full. */
  startingHull?: number;
}): CombatState {
  const config = opts.config ?? DEFAULT_COMBAT_CONFIG;
  const drawPile = shuffle(buildDeckInstances(opts.startingDeckCardIds), opts.rng);
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
    },
    enemy: {
      id: opts.enemy.id,
      name: opts.enemy.name,
      hull: opts.enemy.maxHull,
      maxHull: opts.enemy.maxHull,
      shield: 0,
      weakenAmount: 0,
      weakenTurnsRemaining: 0,
      intentPattern: opts.enemy.intentPattern,
      intent: intentForTurn(opts.enemy.intentPattern, 0),
    },
    drawPile,
    hand: [],
    discardPile: [],
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
  const def = cardDefinitions[instance.cardId];
  if (!def) {
    throw new Error(`Unknown card id: ${instance.cardId}`);
  }

  if (state.player.power < def.cost) {
    return { ...state, log: [...state.log, { t: 'notEnoughPower', cardId: def.id }] };
  }

  const player = { ...state.player, power: state.player.power - def.cost };
  const enemy = { ...state.enemy };
  let hand = [...state.hand.slice(0, cardIndex), ...state.hand.slice(cardIndex + 1)];
  let drawPile = state.drawPile;
  let discardPile = [...state.discardPile, instance];
  let log: CombatLogEntry[] = [...state.log, { t: 'played', cardId: def.id }];

  switch (def.effect.kind) {
    case 'damage': {
      const amount = def.effect.amount;
      const absorbed = Math.min(enemy.shield, amount);
      enemy.shield -= absorbed;
      const remaining = amount - absorbed;
      enemy.hull = Math.max(0, enemy.hull - remaining);
      log.push({ t: 'damage', cardId: def.id, amount, absorbed });
      break;
    }
    case 'shield':
      player.shield += def.effect.amount;
      log.push({ t: 'shield', amount: def.effect.amount });
      break;
    case 'heal':
      player.hull = Math.min(player.maxHull, player.hull + def.effect.amount);
      log.push({ t: 'heal', amount: def.effect.amount });
      break;
    case 'power':
      player.power += def.effect.amount;
      log.push({ t: 'power', amount: def.effect.amount });
      break;
    case 'weaken':
      enemy.weakenAmount = def.effect.amount;
      enemy.weakenTurnsRemaining = def.effect.duration;
      log.push({
        t: 'weaken',
        enemyId: enemy.id,
        amount: def.effect.amount,
        duration: def.effect.duration,
      });
      break;
    case 'draw': {
      const result = drawCards(hand, drawPile, discardPile, def.effect.amount, rng, log);
      hand = result.hand;
      drawPile = result.drawPile;
      discardPile = result.discardPile;
      log = result.log;
      log.push({ t: 'draw', amount: def.effect.amount });
      break;
    }
    default: {
      const exhaustive: never = def.effect;
      throw new Error(`Unhandled card effect: ${JSON.stringify(exhaustive)}`);
    }
  }

  const phase = enemy.hull <= 0 ? 'won' : state.phase;
  if (phase === 'won') log.push({ t: 'enemyDestroyed', enemyId: enemy.id });

  return { ...state, player, enemy, hand, drawPile, discardPile, log, phase };
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

  const intent = enemy.intent;
  if (intent.kind === 'attack') {
    const amount = Math.max(
      0,
      intent.amount - (enemy.weakenTurnsRemaining > 0 ? enemy.weakenAmount : 0),
    );
    const absorbed = Math.min(player.shield, amount);
    player = { ...player, shield: player.shield - absorbed };
    const remaining = amount - absorbed;
    player = { ...player, hull: Math.max(0, player.hull - remaining) };
    log.push({ t: 'enemyAttack', enemyId: enemy.id, amount, absorbed });
  } else {
    enemy.shield += intent.amount;
    log.push({ t: 'enemyShield', enemyId: enemy.id, amount: intent.amount });
  }

  if (enemy.weakenTurnsRemaining > 0) {
    enemy.weakenTurnsRemaining -= 1;
    if (enemy.weakenTurnsRemaining === 0) enemy.weakenAmount = 0;
  }

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
