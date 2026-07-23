import { describe, expect, it } from 'vitest';
import { createRng } from '../rng';
import { endPlayerTurn, initCombat, playCard } from './resolve';
import type { CardDefinition } from '../cards/types';
import type { EnemyDefinition } from './types';
import { DEFAULT_COMBAT_CONFIG } from './types';

const cardDefinitions: Record<string, CardDefinition> = {
  strike: {
    id: 'strike',
    name: 'Strike',
    type: 'weapon',
    cost: 1,
    description: '',
    effect: { kind: 'damage', amount: 6 },
  },
  bigStrike: {
    id: 'bigStrike',
    name: 'Big Strike',
    type: 'weapon',
    cost: 2,
    description: '',
    effect: { kind: 'damage', amount: 20 },
  },
  shield: {
    id: 'shield',
    name: 'Shield',
    type: 'maneuver',
    cost: 1,
    description: '',
    effect: { kind: 'shield', amount: 10 },
  },
  heal: {
    id: 'heal',
    name: 'Heal',
    type: 'maneuver',
    cost: 1,
    description: '',
    effect: { kind: 'heal', amount: 5 },
  },
  overcharge: {
    id: 'overcharge',
    name: 'Overcharge',
    type: 'shipSystem',
    cost: 0,
    description: '',
    effect: { kind: 'power', amount: 2 },
  },
  weaken: {
    id: 'weaken',
    name: 'Weaken',
    type: 'maneuver',
    cost: 1,
    description: '',
    effect: { kind: 'weaken', amount: 3, duration: 2 },
  },
  scan: {
    id: 'scan',
    name: 'Scan',
    type: 'maneuver',
    cost: 0,
    description: '',
    effect: { kind: 'draw', amount: 2 },
  },
};

const passiveEnemy: EnemyDefinition = {
  id: 'target-dummy',
  name: 'Target Dummy',
  maxHull: 30,
  intentPattern: [{ kind: 'defend', amount: 0 }],
};

const attackerEnemy: EnemyDefinition = {
  id: 'attacker',
  name: 'Attacker',
  maxHull: 100,
  intentPattern: [{ kind: 'attack', amount: 10 }],
};

const deckOf = (...cardIds: string[]) => cardIds;

describe('initCombat', () => {
  it('sets up player/enemy state and draws a hand', () => {
    const rng = createRng(1);
    const state = initCombat({
      cardDefinitions,
      startingDeckCardIds: deckOf('strike', 'strike', 'shield', 'shield', 'heal', 'heal'),
      enemy: passiveEnemy,
      rng,
    });

    expect(state.player.hull).toBe(DEFAULT_COMBAT_CONFIG.playerMaxHull);
    expect(state.player.power).toBe(DEFAULT_COMBAT_CONFIG.playerMaxPower);
    expect(state.player.shield).toBe(0);
    expect(state.enemy.hull).toBe(passiveEnemy.maxHull);
    expect(state.enemy.intent).toEqual({ kind: 'defend', amount: 0 });
    expect(state.hand).toHaveLength(DEFAULT_COMBAT_CONFIG.drawAmount);
    expect(state.drawPile.length + state.hand.length).toBe(6);
    expect(state.phase).toBe('playerTurn');
  });

  it('carries over a reduced starting hull (e.g. from earlier in a run)', () => {
    const rng = createRng(11);
    const state = initCombat({
      cardDefinitions,
      startingDeckCardIds: deckOf('strike', 'strike', 'shield', 'shield', 'heal', 'heal'),
      enemy: passiveEnemy,
      rng,
      startingHull: 20,
    });

    expect(state.player.hull).toBe(20);
    expect(state.player.maxHull).toBe(DEFAULT_COMBAT_CONFIG.playerMaxHull);
  });

  it('clamps an out-of-range startingHull to [0, maxHull]', () => {
    const rng = createRng(12);
    const over = initCombat({
      cardDefinitions,
      startingDeckCardIds: deckOf('strike'),
      enemy: passiveEnemy,
      rng,
      startingHull: 9999,
    });
    expect(over.player.hull).toBe(DEFAULT_COMBAT_CONFIG.playerMaxHull);

    const under = initCombat({
      cardDefinitions,
      startingDeckCardIds: deckOf('strike'),
      enemy: passiveEnemy,
      rng,
      startingHull: -5,
    });
    expect(under.player.hull).toBe(0);
  });
});

describe('playCard', () => {
  it('deals damage, spends power, and moves the card to discard', () => {
    const rng = createRng(2);
    let state = initCombat({
      cardDefinitions,
      startingDeckCardIds: deckOf('strike', 'strike', 'strike', 'strike', 'strike', 'strike'),
      enemy: passiveEnemy,
      rng,
    });
    const card = state.hand[0];

    state = playCard(state, card.instanceId, cardDefinitions, rng);

    expect(state.enemy.hull).toBe(passiveEnemy.maxHull - 6);
    expect(state.player.power).toBe(DEFAULT_COMBAT_CONFIG.playerMaxPower - 1);
    expect(state.hand.find((c) => c.instanceId === card.instanceId)).toBeUndefined();
    expect(state.discardPile.some((c) => c.instanceId === card.instanceId)).toBe(true);
  });

  it('is a no-op (aside from a log message) when the player cannot afford the card', () => {
    const rng = createRng(3);
    let state = initCombat({
      cardDefinitions,
      startingDeckCardIds: deckOf(
        'bigStrike',
        'bigStrike',
        'bigStrike',
        'bigStrike',
        'bigStrike',
        'bigStrike',
      ),
      enemy: passiveEnemy,
      rng,
    });
    // Spend power down to 1, leaving less than bigStrike's cost of 2.
    state = { ...state, player: { ...state.player, power: 1 } };
    const card = state.hand[0];

    const next = playCard(state, card.instanceId, cardDefinitions, rng);

    expect(next.enemy.hull).toBe(passiveEnemy.maxHull);
    expect(next.hand).toHaveLength(state.hand.length);
    expect(next.log.at(-1)).toMatch(/not enough/i);
  });

  it('damage is absorbed by enemy shields before hull', () => {
    const rng = createRng(4);
    const shieldedEnemy: EnemyDefinition = {
      ...passiveEnemy,
      intentPattern: [{ kind: 'defend', amount: 5 }],
    };
    let state = initCombat({
      cardDefinitions,
      startingDeckCardIds: deckOf('strike', 'strike', 'strike', 'strike', 'strike', 'strike'),
      enemy: shieldedEnemy,
      rng,
    });
    state = { ...state, enemy: { ...state.enemy, shield: 5 } };
    const card = state.hand[0];

    state = playCard(state, card.instanceId, cardDefinitions, rng);

    expect(state.enemy.shield).toBe(0);
    expect(state.enemy.hull).toBe(shieldedEnemy.maxHull - 1); // 6 damage - 5 absorbed
  });

  it('sets phase to won once enemy hull reaches 0', () => {
    const rng = createRng(5);
    const weakEnemy: EnemyDefinition = { ...passiveEnemy, maxHull: 5 };
    let state = initCombat({
      cardDefinitions,
      startingDeckCardIds: deckOf('strike', 'strike', 'strike', 'strike', 'strike', 'strike'),
      enemy: weakEnemy,
      rng,
    });
    const card = state.hand[0];

    state = playCard(state, card.instanceId, cardDefinitions, rng);

    expect(state.enemy.hull).toBe(0);
    expect(state.phase).toBe('won');
  });

  it("weaken reduces the enemy attacker's next attack damage", () => {
    const rng = createRng(6);
    let state = initCombat({
      cardDefinitions,
      startingDeckCardIds: deckOf('weaken', 'weaken', 'weaken', 'weaken', 'weaken', 'weaken'),
      enemy: attackerEnemy,
      rng,
    });
    const card = state.hand[0];
    state = playCard(state, card.instanceId, cardDefinitions, rng);
    state = endPlayerTurn(state, rng);

    expect(state.player.hull).toBe(DEFAULT_COMBAT_CONFIG.playerMaxHull - (10 - 3));
  });

  it('draw effect adds cards to hand without spending the played card as a normal action', () => {
    const rng = createRng(15);
    let state = initCombat({
      cardDefinitions,
      startingDeckCardIds: deckOf(
        'scan',
        'strike',
        'strike',
        'strike',
        'strike',
        'strike',
        'strike',
      ),
      enemy: passiveEnemy,
      rng,
    });
    const card = state.hand.find((c) => c.cardId === 'scan');
    if (!card) throw new Error('scan not in opening hand for this seed');
    const handSizeBefore = state.hand.length;
    const drawPileBefore = state.drawPile.length;

    state = playCard(state, card.instanceId, cardDefinitions, rng);

    // -1 for the played scan card, +2 for its draw effect.
    expect(state.hand.length).toBe(handSizeBefore - 1 + 2);
    expect(state.drawPile.length).toBe(drawPileBefore - 2);
    expect(state.discardPile.some((c) => c.instanceId === card.instanceId)).toBe(true);
  });

  it('draw effect reshuffles the discard pile in when the draw pile runs out', () => {
    const rng = createRng(16);
    let state = initCombat({
      cardDefinitions,
      startingDeckCardIds: deckOf('scan', 'strike', 'strike'),
      enemy: passiveEnemy,
      rng,
    });
    // Force an empty draw pile with cards sitting in discard. The deck (3 cards) is
    // smaller than the draw amount (5), so all of it — including "scan" — is always
    // in the opening hand already.
    state = {
      ...state,
      drawPile: [],
      discardPile: [{ instanceId: 'strike#99', cardId: 'strike' }],
    };
    const scanInHand = state.hand.find((c) => c.cardId === 'scan');
    if (!scanInHand) throw new Error('scan not in opening hand for this seed');
    state = playCard(state, scanInHand.instanceId, cardDefinitions, rng);
    expect(state.log.some((line) => line.includes('reshuffled'))).toBe(true);
  });
});

describe('endPlayerTurn', () => {
  it('applies enemy attack damage, reduced by player shield', () => {
    const rng = createRng(7);
    let state = initCombat({
      cardDefinitions,
      startingDeckCardIds: deckOf('shield', 'shield', 'shield', 'shield', 'shield', 'shield'),
      enemy: attackerEnemy,
      rng,
    });
    const card = state.hand[0]; // shield: +10
    state = playCard(state, card.instanceId, cardDefinitions, rng);

    state = endPlayerTurn(state, rng);

    // attacker deals 10, fully absorbed by the 10 shield just played
    expect(state.player.hull).toBe(DEFAULT_COMBAT_CONFIG.playerMaxHull);
    expect(state.player.shield).toBe(0); // shield resets at the start of the next player turn
    expect(state.phase).toBe('playerTurn');
    expect(state.turn).toBe(2);
  });

  it('resets shield to config.baselineShield instead of 0 when set (a ship system effect)', () => {
    const rng = createRng(20);
    let state = initCombat({
      cardDefinitions,
      startingDeckCardIds: deckOf('strike', 'strike', 'strike', 'strike', 'strike', 'strike'),
      enemy: passiveEnemy,
      rng,
      config: { ...DEFAULT_COMBAT_CONFIG, baselineShield: 5 },
    });
    expect(state.player.shield).toBe(5);

    state = endPlayerTurn(state, rng, { ...DEFAULT_COMBAT_CONFIG, baselineShield: 5 });
    expect(state.player.shield).toBe(5);
  });

  it('sets phase to lost when player hull reaches 0', () => {
    const rng = createRng(8);
    const bigAttacker: EnemyDefinition = {
      ...attackerEnemy,
      intentPattern: [{ kind: 'attack', amount: 999 }],
    };
    let state = initCombat({
      cardDefinitions,
      startingDeckCardIds: deckOf('heal', 'heal', 'heal', 'heal', 'heal', 'heal'),
      enemy: bigAttacker,
      rng,
    });

    state = endPlayerTurn(state, rng);

    expect(state.player.hull).toBe(0);
    expect(state.phase).toBe('lost');
  });

  it('reshuffles the discard pile into the draw pile once it runs out', () => {
    const rng = createRng(9);
    let state = initCombat({
      cardDefinitions,
      startingDeckCardIds: deckOf('strike', 'strike', 'strike', 'strike', 'strike', 'strike'),
      enemy: passiveEnemy,
      rng,
    });
    // Play the whole hand, then end turn repeatedly — total deck is only 6 cards but we
    // draw 5/turn, so by turn 3 the draw pile must reshuffle from discard.
    for (let round = 0; round < 3; round++) {
      for (const card of [...state.hand]) {
        state = playCard(state, card.instanceId, cardDefinitions, rng);
      }
      state = endPlayerTurn(state, rng);
    }

    expect(state.log.some((line) => line.includes('reshuffled'))).toBe(true);
  });

  it('a full scripted battle ends in victory when enough damage is dealt', () => {
    const rng = createRng(10);
    let state = initCombat({
      cardDefinitions,
      startingDeckCardIds: [
        'strike',
        'strike',
        'strike',
        'strike',
        'strike',
        'strike',
        'strike',
        'strike',
        'strike',
        'strike',
      ],
      enemy: passiveEnemy, // 30 hull, never attacks
      rng,
    });

    let turns = 0;
    while (state.phase === 'playerTurn' && turns < 20) {
      for (const card of [...state.hand]) {
        if (state.phase !== 'playerTurn') break;
        state = playCard(state, card.instanceId, cardDefinitions, rng);
      }
      if (state.phase === 'playerTurn') {
        state = endPlayerTurn(state, rng);
      }
      turns++;
    }

    expect(state.phase).toBe('won');
    expect(state.enemy.hull).toBe(0);
  });
});
