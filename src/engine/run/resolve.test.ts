import { describe, expect, it } from 'vitest';
import type { CardDefinition } from '../cards/types';
import { createRng } from '../rng';
import type { EnemyDefinition } from '../combat/types';
import type { EventDefinition } from '../events/types';
import type { MapGraph } from '../map/types';
import type { ShipSystemDefinition } from '../shipSystems/types';
import {
  acknowledgeCombat,
  buyShopItem,
  chooseShipSystemReward,
  endRunCombatTurn,
  enterNode,
  getAvailableNodeIds,
  initRun,
  leaveNode,
  playRunCombatCard,
  resolveEventChoice,
} from './resolve';
import type { RunContent } from './types';

// A small hand-built linear map exercising every node type once, so tests can target
// a specific node type deterministically instead of relying on random generation.
const testMap: MapGraph = {
  nodes: {
    entryCombat: { id: 'entryCombat', layerIndex: 0, type: 'combat', next: ['midEvent'] },
    midEvent: { id: 'midEvent', layerIndex: 1, type: 'event', next: ['midRest'] },
    midRest: { id: 'midRest', layerIndex: 2, type: 'rest', next: ['midShop'] },
    midShop: { id: 'midShop', layerIndex: 3, type: 'shop', next: ['midTreasure'] },
    midTreasure: { id: 'midTreasure', layerIndex: 4, type: 'treasure', next: ['midElite'] },
    midElite: { id: 'midElite', layerIndex: 5, type: 'elite', next: ['boss'] },
    boss: { id: 'boss', layerIndex: 6, type: 'boss', next: [] },
  },
  layers: [['entryCombat'], ['midEvent'], ['midRest'], ['midShop'], ['midTreasure'], ['midElite']],
  entryNodeIds: ['entryCombat'],
  bossNodeId: 'boss',
};

const cardDefinitions: Record<string, CardDefinition> = {
  strike: {
    id: 'strike',
    name: 'Strike',
    type: 'weapon',
    cost: 1,
    description: '',
    effect: { kind: 'damage', amount: 6 },
  },
  shieldCard: {
    id: 'shieldCard',
    name: 'Shield',
    type: 'maneuver',
    cost: 1,
    description: '',
    effect: { kind: 'shield', amount: 7 },
  },
  eliteReward: {
    id: 'eliteReward',
    name: 'Elite Reward',
    type: 'weapon',
    cost: 2,
    description: '',
    effect: { kind: 'damage', amount: 15 },
  },
};

const weakEnemy: EnemyDefinition = {
  id: 'weak',
  name: 'Weak Ship',
  maxHull: 5,
  intentPattern: [{ kind: 'defend', amount: 0 }],
};

const lethalEnemy: EnemyDefinition = {
  id: 'lethal',
  name: 'Lethal Ship',
  maxHull: 999,
  intentPattern: [{ kind: 'attack', amount: 999 }],
};

const events: EventDefinition[] = [
  {
    id: 'test-event',
    title: 'Test Event',
    prompt: 'A test event.',
    choices: [
      { label: 'Heal a bit', effects: [{ kind: 'hull', amount: 5 }] },
      { label: 'Get salvage', effects: [{ kind: 'salvage', amount: 20 }] },
      { label: 'Take a card', effects: [{ kind: 'addCard', cardId: 'shieldCard' }] },
      { label: 'Fatal choice', effects: [{ kind: 'hull', amount: -9999 }] },
    ],
  },
];

const shipSystemDefinitions: Record<string, ShipSystemDefinition> = {
  hullPlating: {
    id: 'hullPlating',
    name: 'Hull Plating',
    description: '+15 max hull',
    effect: { kind: 'maxHull', amount: 15 },
  },
  powerCore: {
    id: 'powerCore',
    name: 'Power Core',
    description: '+1 max power',
    effect: { kind: 'maxPower', amount: 1 },
  },
  deflector: {
    id: 'deflector',
    name: 'Deflector',
    description: 'baseline shield',
    effect: { kind: 'baselineShield', amount: 5 },
  },
};

function makeContent(overrides: Partial<RunContent> = {}): RunContent {
  return {
    cardDefinitions,
    combatEnemies: [weakEnemy],
    eliteEnemies: [weakEnemy],
    bossEnemy: weakEnemy,
    events,
    eliteRewardCardIds: ['eliteReward'],
    shopCardPool: ['strike', 'shieldCard'],
    treasureCardPool: ['strike'],
    shipSystemDefinitions,
    availableShipSystemIds: ['hullPlating', 'powerCore', 'deflector'],
    ...overrides,
  };
}

const startingDeck = ['strike', 'strike', 'strike', 'strike', 'strike', 'strike'];

describe('initRun', () => {
  it('sets up initial run state', () => {
    const run = initRun(testMap, startingDeck);
    expect(run.hull).toBe(run.maxHull);
    expect(run.deckCardIds).toEqual(startingDeck);
    expect(run.salvage).toBe(0);
    expect(run.phase).toBe('map');
    expect(run.currentNodeId).toBeNull();
  });
});

describe('getAvailableNodeIds', () => {
  it('returns entry nodes before any node is entered', () => {
    const run = initRun(testMap, startingDeck);
    expect(getAvailableNodeIds(run)).toEqual(['entryCombat']);
  });
});

describe('enterNode: combat carries hull over and rejects unavailable nodes', () => {
  it('starts combat using the run current hull, not a fresh max', () => {
    const rng = createRng(1);
    let run = initRun(testMap, startingDeck);
    run = { ...run, hull: 17 };
    run = enterNode(run, 'entryCombat', makeContent(), rng);

    expect(run.phase).toBe('combat');
    expect(run.activeCombat?.player.hull).toBe(17);
  });

  it('is a no-op when the target node is not currently available', () => {
    const rng = createRng(2);
    const run = initRun(testMap, startingDeck);
    const next = enterNode(run, 'midEvent', makeContent(), rng);
    expect(next).toBe(run);
  });
});

describe('combat within a run', () => {
  it('grants salvage after winning a plain combat node, then returns to map on acknowledge', () => {
    const rng = createRng(3);
    let run = initRun(testMap, startingDeck);
    const content = makeContent();
    run = enterNode(run, 'entryCombat', content, rng);
    const card = run.activeCombat!.hand[0];

    run = playRunCombatCard(run, card.instanceId, content, rng);

    expect(run.activeCombat?.phase).toBe('won');
    expect(run.phase).toBe('combat'); // still showing the battle screen until acknowledged
    expect(run.salvage).toBe(12);

    run = acknowledgeCombat(run, content, rng);
    expect(run.phase).toBe('map');
    expect(run.activeCombat).toBeNull();
    expect(getAvailableNodeIds(run)).toEqual(['midEvent']);
  });

  it('grants a bonus card after winning an elite node', () => {
    const rng = createRng(4);
    let run = initRun(testMap, startingDeck);
    run = { ...run, currentNodeId: 'midTreasure', visitedNodeIds: ['midTreasure'] };
    const content = makeContent();
    run = enterNode(run, 'midElite', content, rng);
    const card = run.activeCombat!.hand[0];

    run = playRunCombatCard(run, card.instanceId, content, rng);

    expect(run.activeCombat?.phase).toBe('won');
    expect(run.salvage).toBe(25);
    expect(run.deckCardIds).toContain('eliteReward');
  });

  it('goes to runLost (after acknowledge) when hull reaches 0', () => {
    const rng = createRng(5);
    let run = initRun(testMap, startingDeck);
    const content = makeContent({ combatEnemies: [lethalEnemy] });
    run = enterNode(run, 'entryCombat', content, rng);

    run = endRunCombatTurn(run, content, rng);

    expect(run.activeCombat?.phase).toBe('lost');
    expect(run.phase).toBe('combat');
    run = acknowledgeCombat(run, content, rng);
    expect(run.phase).toBe('runLost');
    expect(run.activeCombat).toBeNull();
  });

  it('offers a 3-way ship system choice after the boss is defeated', () => {
    const rng = createRng(6);
    let run = initRun(testMap, startingDeck);
    run = { ...run, currentNodeId: 'midElite', visitedNodeIds: ['midElite'] };
    const content = makeContent();
    run = enterNode(run, 'boss', content, rng);
    const card = run.activeCombat!.hand[0];

    run = playRunCombatCard(run, card.instanceId, content, rng);
    expect(run.activeCombat?.phase).toBe('won');

    run = acknowledgeCombat(run, content, rng);
    expect(run.phase).toBe('reward');
    expect(run.activeCombat).toBeNull();
    expect(run.rewardOptions).toHaveLength(3);
    for (const id of run.rewardOptions ?? []) {
      expect(content.availableShipSystemIds).toContain(id);
    }
  });

  it('installing a maxHull ship system increases both maxHull and current hull, then ends the run', () => {
    const rng = createRng(6);
    let run = initRun(testMap, startingDeck);
    run = { ...run, currentNodeId: 'midElite', visitedNodeIds: ['midElite'] };
    const content = makeContent();
    run = enterNode(run, 'boss', content, rng);
    const card = run.activeCombat!.hand[0];
    run = playRunCombatCard(run, card.instanceId, content, rng);
    run = acknowledgeCombat(run, content, rng);

    const beforeMaxHull = run.maxHull;
    const beforeHull = run.hull;
    run = chooseShipSystemReward(run, 'hullPlating', content);

    expect(run.maxHull).toBe(beforeMaxHull + 15);
    expect(run.hull).toBe(beforeHull + 15);
    expect(run.shipSystemIds).toEqual(['hullPlating']);
    expect(run.phase).toBe('runWon');
    expect(run.rewardOptions).toBeNull();
  });

  it('rejects choosing a ship system that was not offered', () => {
    const rng = createRng(6);
    let run = initRun(testMap, startingDeck);
    run = { ...run, currentNodeId: 'midElite', visitedNodeIds: ['midElite'] };
    const content = makeContent();
    run = enterNode(run, 'boss', content, rng);
    const card = run.activeCombat!.hand[0];
    run = playRunCombatCard(run, card.instanceId, content, rng);
    run = acknowledgeCombat(run, content, rng);

    const before = run;
    run = chooseShipSystemReward(run, 'not-offered', content);
    expect(run).toBe(before);
  });

  it('applies owned ship systems to subsequent combats (baseline shield)', () => {
    const rng = createRng(21);
    let run = initRun(testMap, startingDeck);
    run = { ...run, shipSystemIds: ['deflector'] };
    const content = makeContent();
    run = enterNode(run, 'entryCombat', content, rng);
    expect(run.activeCombat?.player.shield).toBe(5);
  });
});

describe('event nodes', () => {
  it('applies the chosen effect and returns to map', () => {
    const rng = createRng(7);
    let run = initRun(testMap, startingDeck);
    run = { ...run, currentNodeId: 'entryCombat', visitedNodeIds: ['entryCombat'] };
    run = enterNode(run, 'midEvent', makeContent(), rng);

    expect(run.phase).toBe('event');

    run = resolveEventChoice(run, 1, makeContent()); // "Get salvage": +20
    expect(run.phase).toBe('map');
    expect(run.salvage).toBe(20);
    expect(run.activeEventId).toBeNull();
  });

  it('can add a card to the deck', () => {
    let run = initRun(testMap, startingDeck);
    run = { ...run, phase: 'event', activeEventId: 'test-event', currentNodeId: 'midEvent' };
    run = resolveEventChoice(run, 2, makeContent()); // "Take a card"
    expect(run.deckCardIds.filter((id) => id === 'shieldCard')).toHaveLength(1);
  });

  it('ends the run if the choice drops hull to 0 or below', () => {
    let run = initRun(testMap, startingDeck);
    run = { ...run, phase: 'event', activeEventId: 'test-event', currentNodeId: 'midEvent' };
    run = resolveEventChoice(run, 3, makeContent()); // "Fatal choice"
    expect(run.hull).toBe(0);
    expect(run.phase).toBe('runLost');
  });
});

describe('rest nodes', () => {
  it('heals on entry and returns to map via leaveNode', () => {
    const rng = createRng(9);
    let run = initRun(testMap, startingDeck);
    run = { ...run, hull: 10, currentNodeId: 'midEvent', visitedNodeIds: ['midEvent'] };
    run = enterNode(run, 'midRest', makeContent(), rng);

    expect(run.phase).toBe('rest');
    expect(run.hull).toBeGreaterThan(10);

    run = leaveNode(run);
    expect(run.phase).toBe('map');
  });
});

describe('shop nodes', () => {
  it('offers 3 unique cards and supports buying', () => {
    const rng = createRng(10);
    let run = initRun(testMap, startingDeck);
    run = { ...run, salvage: 100, currentNodeId: 'midRest', visitedNodeIds: ['midRest'] };
    run = enterNode(run, 'midShop', makeContent(), rng);

    expect(run.shopOffer).toHaveLength(2); // pool only has 2 cards in this fixture
    const initialDeckSize = run.deckCardIds.length;

    run = buyShopItem(run, 0, makeContent());
    expect(run.deckCardIds.length).toBe(initialDeckSize + 1);
    expect(run.shopOffer?.[0].purchased).toBe(true);
    expect(run.salvage).toBeLessThan(100);
  });

  it('refuses to buy without enough salvage or twice', () => {
    const rng = createRng(13);
    let run = initRun(testMap, startingDeck);
    run = { ...run, salvage: 0, currentNodeId: 'midRest', visitedNodeIds: ['midRest'] };
    run = enterNode(run, 'midShop', makeContent(), rng);

    const before = run;
    run = buyShopItem(run, 0, makeContent());
    expect(run).toEqual(before); // can't afford anything

    run = { ...run, salvage: 1000 };
    run = buyShopItem(run, 0, makeContent());
    const afterFirstBuy = run;
    run = buyShopItem(run, 0, makeContent());
    expect(run).toEqual(afterFirstBuy); // already purchased
  });
});

describe('treasure nodes', () => {
  it('grants salvage and a card immediately on entry', () => {
    const rng = createRng(14);
    let run = initRun(testMap, startingDeck);
    run = { ...run, currentNodeId: 'midShop', visitedNodeIds: ['midShop'] };
    run = enterNode(run, 'midTreasure', makeContent(), rng);

    expect(run.phase).toBe('treasure');
    expect(run.salvage).toBe(15);
    expect(run.deckCardIds).toContain('strike');
    expect(run.pendingReward).toEqual({ salvage: 15, cardId: 'strike' });

    run = leaveNode(run);
    expect(run.phase).toBe('map');
    expect(run.pendingReward).toBeNull();
  });
});
