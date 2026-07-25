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
  nanite: {
    id: 'nanite',
    name: 'Nanite Swarm',
    type: 'weapon',
    cost: 1,
    description: '',
    effect: { kind: 'corrosion', amount: 5 },
  },
  cutter: {
    id: 'cutter',
    name: 'Hull Cutter',
    type: 'weapon',
    cost: 1,
    description: '',
    effect: { kind: 'breach', amount: 2 },
  },
  calibrate: {
    id: 'calibrate',
    name: 'Gunnery Calibration',
    type: 'shipSystem',
    cost: 1,
    description: '',
    effect: { kind: 'calibration', amount: 2 },
  },
  lock: {
    id: 'lock',
    name: 'Targeting Lock',
    type: 'shipSystem',
    cost: 0,
    description: '',
    effect: { kind: 'charge', target: 'damage', amount: 1 },
  },
  siphon: {
    id: 'siphon',
    name: 'Siphon Beam',
    type: 'weapon',
    cost: 1,
    description: '',
    effect: { kind: 'damage', amount: 6 },
    extraEffects: [{ kind: 'heal', amount: 4 }],
  },
  volley: {
    id: 'volley',
    name: 'Needle Volley',
    type: 'weapon',
    cost: 1,
    description: '',
    effect: { kind: 'damage', amount: 3, times: 3 },
  },
  oneShot: {
    id: 'oneShot',
    name: 'One Shot',
    type: 'weapon',
    cost: 0,
    description: '',
    effect: { kind: 'damage', amount: 4 },
    exhaust: true,
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

const deckOf = (...cardIds: string[]) => cardIds.map((cardId) => ({ cardId, level: 0 as const }));

describe('initCombat', () => {
  it('sets up player/enemy state and draws a hand', () => {
    const rng = createRng(1);
    const state = initCombat({
      cardDefinitions,
      startingDeck: deckOf('strike', 'strike', 'shield', 'shield', 'heal', 'heal'),
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
      startingDeck: deckOf('strike', 'strike', 'shield', 'shield', 'heal', 'heal'),
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
      startingDeck: deckOf('strike'),
      enemy: passiveEnemy,
      rng,
      startingHull: 9999,
    });
    expect(over.player.hull).toBe(DEFAULT_COMBAT_CONFIG.playerMaxHull);

    const under = initCombat({
      cardDefinitions,
      startingDeck: deckOf('strike'),
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
      startingDeck: deckOf('strike', 'strike', 'strike', 'strike', 'strike', 'strike'),
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
      startingDeck: deckOf(
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
    expect(next.log.at(-1)?.t).toBe('notEnoughPower');
  });

  it('damage is absorbed by enemy shields before hull', () => {
    const rng = createRng(4);
    const shieldedEnemy: EnemyDefinition = {
      ...passiveEnemy,
      intentPattern: [{ kind: 'defend', amount: 5 }],
    };
    let state = initCombat({
      cardDefinitions,
      startingDeck: deckOf('strike', 'strike', 'strike', 'strike', 'strike', 'strike'),
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
      startingDeck: deckOf('strike', 'strike', 'strike', 'strike', 'strike', 'strike'),
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
      startingDeck: deckOf('weaken', 'weaken', 'weaken', 'weaken', 'weaken', 'weaken'),
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
      startingDeck: deckOf('scan', 'strike', 'strike', 'strike', 'strike', 'strike', 'strike'),
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
      startingDeck: deckOf('scan', 'strike', 'strike'),
      enemy: passiveEnemy,
      rng,
    });
    // Force an empty draw pile with cards sitting in discard. The deck (3 cards) is
    // smaller than the draw amount (5), so all of it — including "scan" — is always
    // in the opening hand already.
    state = {
      ...state,
      drawPile: [],
      discardPile: [{ instanceId: 'strike#99', cardId: 'strike', level: 0 }],
    };
    const scanInHand = state.hand.find((c) => c.cardId === 'scan');
    if (!scanInHand) throw new Error('scan not in opening hand for this seed');
    state = playCard(state, scanInHand.instanceId, cardDefinitions, rng);
    expect(state.log.some((entry) => entry.t === 'reshuffle')).toBe(true);
  });
});

describe('exhaust', () => {
  const startExhaustFight = (rng = createRng(11)) =>
    initCombat({
      cardDefinitions,
      startingDeck: deckOf('oneShot', 'strike', 'strike', 'strike', 'strike'),
      enemy: passiveEnemy,
      rng,
    });

  it('sends an exhausted card out of the fight instead of to the discard pile', () => {
    const rng = createRng(11);
    let state = startExhaustFight(rng);
    const oneShot = state.hand.find((c) => c.cardId === 'oneShot');
    if (!oneShot) throw new Error('oneShot not in opening hand for this seed');

    state = playCard(state, oneShot.instanceId, cardDefinitions, rng);

    expect(state.exhaustPile.map((c) => c.instanceId)).toEqual([oneShot.instanceId]);
    expect(state.discardPile).not.toContainEqual(oneShot);
    expect(state.hand).not.toContainEqual(oneShot);
    // The effect still resolves — exhaust is a cost, not a replacement.
    expect(state.enemy.hull).toBe(passiveEnemy.maxHull - 4);
    expect(state.log.at(-1)).toEqual({ t: 'exhausted', cardId: 'oneShot' });
  });

  it('never returns an exhausted card to the draw pile on reshuffle', () => {
    const rng = createRng(11);
    let state = startExhaustFight(rng);
    const oneShot = state.hand.find((c) => c.cardId === 'oneShot');
    if (!oneShot) throw new Error('oneShot not in opening hand for this seed');
    state = playCard(state, oneShot.instanceId, cardDefinitions, rng);

    // Cycle several turns so the discard pile is reshuffled at least once.
    for (let i = 0; i < 6; i++) state = endPlayerTurn(state, rng);

    expect(state.log.some((entry) => entry.t === 'reshuffle')).toBe(true);
    const everywhere = [...state.hand, ...state.drawPile, ...state.discardPile];
    expect(everywhere.map((c) => c.instanceId)).not.toContain(oneShot.instanceId);
    expect(state.exhaustPile).toHaveLength(1);
  });

  it('starts every fight with an empty exhaust pile, so exhausted cards come back', () => {
    const rng = createRng(11);
    let state = startExhaustFight(rng);
    const oneShot = state.hand.find((c) => c.cardId === 'oneShot');
    if (!oneShot) throw new Error('oneShot not in opening hand for this seed');
    state = playCard(state, oneShot.instanceId, cardDefinitions, rng);
    expect(state.exhaustPile).toHaveLength(1);

    // A fresh combat is built from the run deck, which exhaust never touched.
    const next = startExhaustFight(createRng(11));
    expect(next.exhaustPile).toEqual([]);
    const allCards = [...next.hand, ...next.drawPile, ...next.discardPile];
    expect(allCards.filter((c) => c.cardId === 'oneShot')).toHaveLength(1);
  });

  it('leaves non-exhaust cards discarding normally', () => {
    const rng = createRng(11);
    let state = startExhaustFight(rng);
    const strike = state.hand.find((c) => c.cardId === 'strike');
    if (!strike) throw new Error('strike not in opening hand for this seed');

    state = playCard(state, strike.instanceId, cardDefinitions, rng);

    expect(state.discardPile.map((c) => c.instanceId)).toContain(strike.instanceId);
    expect(state.exhaustPile).toEqual([]);
  });
});

describe('endPlayerTurn', () => {
  it('applies enemy attack damage, reduced by player shield', () => {
    const rng = createRng(7);
    let state = initCombat({
      cardDefinitions,
      startingDeck: deckOf('shield', 'shield', 'shield', 'shield', 'shield', 'shield'),
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
      startingDeck: deckOf('strike', 'strike', 'strike', 'strike', 'strike', 'strike'),
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
      startingDeck: deckOf('heal', 'heal', 'heal', 'heal', 'heal', 'heal'),
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
      startingDeck: deckOf('strike', 'strike', 'strike', 'strike', 'strike', 'strike'),
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

    expect(state.log.some((entry) => entry.t === 'reshuffle')).toBe(true);
  });

  it('a full scripted battle ends in victory when enough damage is dealt', () => {
    const rng = createRng(10);
    let state = initCombat({
      cardDefinitions,
      startingDeck: deckOf(
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
      ),
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

describe('statuses in combat', () => {
  it('weaken now stacks rather than overwriting', () => {
    const rng = createRng(90);
    let state = initCombat({
      cardDefinitions,
      startingDeck: deckOf('weaken', 'weaken', 'weaken', 'weaken', 'weaken', 'weaken'),
      enemy: attackerEnemy,
      rng,
    });
    // Two weakens (3 each) before the enemy acts.
    state = playCard(state, state.hand[0].instanceId, cardDefinitions, rng);
    state = playCard(state, state.hand[0].instanceId, cardDefinitions, rng);
    expect(state.enemy.statuses.weaken?.amount).toBe(6);

    state = endPlayerTurn(state, rng);
    // 10 attack - 6 weaken = 4 through.
    expect(state.player.hull).toBe(DEFAULT_COMBAT_CONFIG.playerMaxHull - 4);
  });

  it('weaken expires after its duration', () => {
    const rng = createRng(91);
    let state = initCombat({
      cardDefinitions,
      startingDeck: deckOf('weaken', 'weaken', 'weaken', 'weaken', 'weaken', 'weaken'),
      enemy: attackerEnemy,
      rng,
    });
    state = playCard(state, state.hand[0].instanceId, cardDefinitions, rng); // 3 for 2 turns
    const full = DEFAULT_COMBAT_CONFIG.playerMaxHull;

    state = endPlayerTurn(state, rng); // reduced: 10 - 3
    expect(state.player.hull).toBe(full - 7);
    state = endPlayerTurn(state, rng); // still reduced (duration 2)
    expect(state.player.hull).toBe(full - 14);
    state = endPlayerTurn(state, rng); // expired: full 10
    expect(state.player.hull).toBe(full - 24);
    expect(state.enemy.statuses.weaken).toBeUndefined();
  });

  it('starts both combatants with an empty status bag', () => {
    const state = initCombat({
      cardDefinitions,
      startingDeck: deckOf('strike'),
      enemy: passiveEnemy,
      rng: createRng(92),
    });
    expect(state.player.statuses).toEqual({});
    expect(state.enemy.statuses).toEqual({});
  });
});

describe('multi-effect and multi-hit cards', () => {
  it('resolves every effect of a card, in order', () => {
    const rng = createRng(95);
    let state = initCombat({
      cardDefinitions,
      startingDeck: deckOf('siphon', 'siphon', 'siphon', 'siphon', 'siphon', 'siphon'),
      enemy: passiveEnemy,
      rng,
      startingHull: 20,
    });

    state = playCard(state, state.hand[0].instanceId, cardDefinitions, rng);

    expect(state.enemy.hull).toBe(passiveEnemy.maxHull - 6);
    expect(state.player.hull).toBe(24); // healed 4
  });

  it('lands a multi-hit as separate hits, each checked against shields', () => {
    const rng = createRng(96);
    let state = initCombat({
      cardDefinitions,
      startingDeck: deckOf('volley', 'volley', 'volley', 'volley', 'volley', 'volley'),
      enemy: passiveEnemy,
      rng,
    });
    // 4 shield vs 3 hits of 3: hit 1 fully absorbed (1 shield left), hit 2 absorbs 1
    // and lands 2, hit 3 lands 3. Total 5 through, versus 5 for a single 9-damage hit.
    state = { ...state, enemy: { ...state.enemy, shield: 4 } };

    state = playCard(state, state.hand[0].instanceId, cardDefinitions, rng);

    expect(state.enemy.shield).toBe(0);
    expect(state.enemy.hull).toBe(passiveEnemy.maxHull - 5);
    expect(state.log.filter((e) => e.t === 'damage')).toHaveLength(3);
  });

  it('stops a multi-hit once the enemy is down', () => {
    const rng = createRng(97);
    const frail = { ...passiveEnemy, maxHull: 4 };
    let state = initCombat({
      cardDefinitions,
      startingDeck: deckOf('volley', 'volley', 'volley', 'volley', 'volley', 'volley'),
      enemy: frail,
      rng,
    });

    state = playCard(state, state.hand[0].instanceId, cardDefinitions, rng);

    expect(state.phase).toBe('won');
    expect(state.log.filter((e) => e.t === 'damage')).toHaveLength(2); // not 3
  });

  it('upgrades only the headline effect, leaving the extras alone', () => {
    const rng = createRng(98);
    let state = initCombat({
      cardDefinitions,
      startingDeck: [{ cardId: 'siphon', level: 1 as const }],
      enemy: passiveEnemy,
      rng,
      startingHull: 20,
    });

    state = playCard(state, state.hand[0].instanceId, cardDefinitions, rng);

    expect(state.enemy.hull).toBe(passiveEnemy.maxHull - 8); // 6 -> 8
    expect(state.player.hull).toBe(24); // heal still 4
  });
});

describe('corrosion', () => {
  it('ticks its amount at end of turn, then erodes by one', () => {
    const rng = createRng(100);
    let state = initCombat({
      cardDefinitions,
      startingDeck: deckOf('nanite', 'nanite', 'nanite', 'nanite', 'nanite', 'nanite'),
      enemy: passiveEnemy,
      rng,
    });
    state = playCard(state, state.hand[0].instanceId, cardDefinitions, rng);
    expect(state.enemy.hull).toBe(passiveEnemy.maxHull); // no damage on application

    state = endPlayerTurn(state, rng);
    expect(state.enemy.hull).toBe(passiveEnemy.maxHull - 5);
    expect(state.enemy.statuses.corrosion?.amount).toBe(4);

    state = endPlayerTurn(state, rng);
    expect(state.enemy.hull).toBe(passiveEnemy.maxHull - 9); // 5 then 4
    expect(state.enemy.statuses.corrosion?.amount).toBe(3);
  });

  it('stacks when applied again', () => {
    const rng = createRng(101);
    let state = initCombat({
      cardDefinitions,
      startingDeck: deckOf('nanite', 'nanite', 'nanite', 'nanite', 'nanite', 'nanite'),
      enemy: passiveEnemy,
      rng,
    });
    state = playCard(state, state.hand[0].instanceId, cardDefinitions, rng);
    state = playCard(state, state.hand[0].instanceId, cardDefinitions, rng);
    expect(state.enemy.statuses.corrosion?.amount).toBe(10);
  });

  it('can finish the fight on your own turn', () => {
    const rng = createRng(102);
    const frail = { ...passiveEnemy, maxHull: 4 };
    let state = initCombat({
      cardDefinitions,
      startingDeck: deckOf('nanite', 'nanite', 'nanite', 'nanite', 'nanite', 'nanite'),
      enemy: frail,
      rng,
    });
    state = playCard(state, state.hand[0].instanceId, cardDefinitions, rng);
    state = endPlayerTurn(state, rng);
    expect(state.phase).toBe('won');
  });
});

describe('breach, calibration and charge', () => {
  const strikeAfter = (setupCard: string, seed: number) => {
    const rng = createRng(seed);
    let state = initCombat({
      cardDefinitions,
      startingDeck: deckOf(setupCard, 'strike', 'strike', 'strike', 'strike', 'strike'),
      enemy: passiveEnemy,
      rng,
    });
    const setup = state.hand.find((c) => c.cardId === setupCard);
    if (!setup) throw new Error(`${setupCard} not in opening hand for seed ${seed}`);
    state = playCard(state, setup.instanceId, cardDefinitions, rng);
    const strike = state.hand.find((c) => c.cardId === 'strike');
    if (!strike) throw new Error('strike not in hand');
    return playCard(state, strike.instanceId, cardDefinitions, rng);
  };

  it('breach multiplies incoming damage', () => {
    const state = strikeAfter('cutter', 103);
    expect(state.enemy.hull).toBe(passiveEnemy.maxHull - 9); // 6 x 1.5
  });

  it('calibration adds to every attack', () => {
    const state = strikeAfter('calibrate', 104);
    expect(state.enemy.hull).toBe(passiveEnemy.maxHull - 8); // 6 + 2
  });

  it('a charge doubles the next attack and is then spent', () => {
    const rng = createRng(105);
    let state = initCombat({
      cardDefinitions,
      startingDeck: deckOf('lock', 'strike', 'strike', 'strike', 'strike', 'strike'),
      enemy: passiveEnemy,
      rng,
    });
    const lock = state.hand.find((c) => c.cardId === 'lock');
    if (!lock) throw new Error('lock not in opening hand for this seed');
    state = playCard(state, lock.instanceId, cardDefinitions, rng);
    expect(state.player.statuses.chargeDamage?.amount).toBe(1);

    let strike = state.hand.find((c) => c.cardId === 'strike');
    state = playCard(state, strike!.instanceId, cardDefinitions, rng);
    expect(state.enemy.hull).toBe(passiveEnemy.maxHull - 12); // doubled
    expect(state.player.statuses.chargeDamage).toBeUndefined();

    strike = state.hand.find((c) => c.cardId === 'strike');
    state = playCard(state, strike!.instanceId, cardDefinitions, rng);
    expect(state.enemy.hull).toBe(passiveEnemy.maxHull - 18); // back to 6
  });

  it('applies flat bonuses before multipliers', () => {
    const rng = createRng(106);
    let state = initCombat({
      cardDefinitions,
      startingDeck: deckOf('calibrate', 'lock', 'strike', 'strike', 'strike', 'strike'),
      enemy: passiveEnemy,
      rng,
    });
    for (const id of ['calibrate', 'lock']) {
      const c = state.hand.find((x) => x.cardId === id);
      if (!c) throw new Error(`${id} not in opening hand for this seed`);
      state = playCard(state, c.instanceId, cardDefinitions, rng);
    }
    const strike = state.hand.find((c) => c.cardId === 'strike');
    state = playCard(state, strike!.instanceId, cardDefinitions, rng);
    // (6 + 2) x 2 = 16, not 6 x 2 + 2 = 14.
    expect(state.enemy.hull).toBe(passiveEnemy.maxHull - 16);
  });
});
