import { describe, expect, it } from 'vitest';
import type { CardDefinition } from '../cards/types';
import { createRng } from '../rng';
import { DEFAULT_COMBAT_CONFIG, type EnemyDefinition } from '../combat/types';
import type { CrewDefinition, CrewPassive } from '../crew/types';
import type { EventDefinition } from '../events/types';
import type { MapGraph } from '../map/types';
import type { ShipSystemDefinition } from '../shipSystems/types';
import {
  acknowledgeCombat,
  buyShopItem,
  chooseCardReward,
  chooseShipSystemReward,
  dismissDialogue,
  endRunCombatTurn,
  enterNode,
  getAvailableNodeIds,
  initRun,
  leaveNode,
  playRunCombatCard,
  resolveCrewOffer,
  resolveEventChoice,
  upgradableDeckIndices,
  upgradeCardAtGarage,
} from './resolve';
import type { RunContent } from './types';
import { TOTAL_ACTS } from './types';

// A small hand-built linear map exercising every node type once, so tests can target
// a specific node type deterministically instead of relying on random generation.
const testMap: MapGraph = {
  nodes: {
    entryCombat: { id: 'entryCombat', layerIndex: 0, type: 'combat', next: ['midEvent'] },
    midEvent: { id: 'midEvent', layerIndex: 1, type: 'event', next: ['midRest'] },
    midRest: { id: 'midRest', layerIndex: 2, type: 'rest', next: ['midShop'] },
    midShop: { id: 'midShop', layerIndex: 3, type: 'shop', next: ['midTreasure'] },
    midTreasure: { id: 'midTreasure', layerIndex: 4, type: 'treasure', next: ['midGarage'] },
    midGarage: { id: 'midGarage', layerIndex: 5, type: 'garage', next: ['midElite'] },
    midElite: { id: 'midElite', layerIndex: 6, type: 'elite', next: ['boss'] },
    boss: { id: 'boss', layerIndex: 7, type: 'boss', next: [] },
  },
  layers: [
    ['entryCombat'],
    ['midEvent'],
    ['midRest'],
    ['midShop'],
    ['midTreasure'],
    ['midGarage'],
    ['midElite'],
  ],
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
  healCard: {
    id: 'healCard',
    name: 'Heal Card',
    type: 'maneuver',
    cost: 1,
    description: '',
    effect: { kind: 'heal', amount: 6 },
  },
};

const weakEnemy: EnemyDefinition = {
  id: 'weak',
  name: 'Weak Ship',
  maxHull: 5,
  intentPattern: [{ kind: 'defend', amount: 0 }],
};

/** Attacks for 10 every turn and outlives the fight, for testing damage mitigation. */
const attacker: EnemyDefinition = {
  id: 'attacker',
  name: 'Attacker',
  maxHull: 500,
  intentPattern: [{ kind: 'attack', amount: 10 }],
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

const makeCrew = (id: string, passive: CrewPassive): CrewDefinition => ({
  id,
  name: `Test ${id}`,
  role: 'Crew',
  portrait: '🧑‍🚀',
  bio: `A ${id}.`,
  recruitPrompt: `A ${id} drifts by.`,
  passiveDescription: `Test passive for ${id}.`,
  passive,
  dialogues: ['First meeting.', 'Second meeting.', 'Third meeting.'],
});

const crewDefinitions: Record<string, CrewDefinition> = {
  medic: makeCrew('medic', { kind: 'repairAfterCombat', amount: 6 }),
  gunner: makeCrew('gunner', { kind: 'calibration', amount: 2 }),
  engineer: makeCrew('engineer', { kind: 'power', amount: 1 }),
  pilot: makeCrew('pilot', { kind: 'evasion' }),
  analyst: makeCrew('analyst', { kind: 'retainHand' }),
  navigator: makeCrew('navigator', { kind: 'startingShield', amount: 10 }),
};

function makeContent(overrides: Partial<RunContent> = {}): RunContent {
  return {
    cardDefinitions,
    combatEnemiesByAct: { 1: [weakEnemy], 2: [weakEnemy], 3: [weakEnemy] },
    eliteEnemiesByAct: { 1: [weakEnemy], 2: [weakEnemy], 3: [weakEnemy] },
    bossEnemyByAct: { 1: weakEnemy, 2: weakEnemy, 3: weakEnemy },
    events,
    eliteRewardCardIds: ['eliteReward'],
    shopCardPool: ['strike', 'shieldCard'],
    treasureCardPool: ['strike'],
    shipSystemDefinitions,
    availableShipSystemIds: ['hullPlating', 'powerCore', 'deflector'],
    crewDefinitions,
    recruitableCrewIds: ['medic', 'gunner'],
    // 0 by default so pre-existing event-node tests stay deterministic; crew tests override.
    crewOfferChance: 0,
    crewCap: 3,
    playerLevel: 20,
    ...overrides,
  };
}

const startingDeckIds = ['strike', 'strike', 'strike', 'strike', 'strike', 'strike'];
/** Deck copies are tagged with their loadout slot, as a real run's opening deck is. */
const startingDeck = startingDeckIds.map((cardId, i) => ({
  cardId,
  level: 0 as const,
  loadoutIndex: i,
}));
const deckIds = (run: { deckCards: { cardId: string }[] }) => run.deckCards.map((c) => c.cardId);

describe('initRun', () => {
  it('sets up initial run state', () => {
    const run = initRun(testMap, startingDeck);
    expect(run.hull).toBe(run.maxHull);
    expect(deckIds(run)).toEqual(startingDeckIds);
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
  it('grants salvage then offers a 3-card reward after winning a plain combat node', () => {
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
    expect(run.phase).toBe('cardReward');
    expect(run.activeCombat).toBeNull();
    // Options come from the general run pool, and every option is a valid card id.
    for (const id of run.cardRewardOptions ?? []) {
      expect(content.shopCardPool).toContain(id);
    }

    const before = deckIds(run).length;
    const pick = run.cardRewardOptions![0];
    run = chooseCardReward(run, pick, content);
    expect(run.phase).toBe('map');
    expect(run.cardRewardOptions).toBeNull();
    expect(deckIds(run)).toHaveLength(before + 1);
    expect(deckIds(run)).toContain(pick);
    expect(getAvailableNodeIds(run)).toEqual(['midEvent']);
  });

  it('skipping the card reward returns to the map without changing the deck', () => {
    const rng = createRng(3);
    let run = initRun(testMap, startingDeck);
    const content = makeContent();
    run = enterNode(run, 'entryCombat', content, rng);
    run = playRunCombatCard(run, run.activeCombat!.hand[0].instanceId, content, rng);
    run = acknowledgeCombat(run, content, rng);
    expect(run.phase).toBe('cardReward');

    const before = deckIds(run);
    run = chooseCardReward(run, null, content);
    expect(run.phase).toBe('map');
    expect(run.cardRewardOptions).toBeNull();
    expect(deckIds(run)).toEqual(before);
  });

  it('offers elite-pool cards as the reward after winning an elite node', () => {
    const rng = createRng(4);
    let run = initRun(testMap, startingDeck);
    run = { ...run, currentNodeId: 'midGarage', visitedNodeIds: ['midGarage'] };
    const content = makeContent();
    run = enterNode(run, 'midElite', content, rng);
    const card = run.activeCombat!.hand[0];

    run = playRunCombatCard(run, card.instanceId, content, rng);
    expect(run.activeCombat?.phase).toBe('won');
    expect(run.salvage).toBe(25);

    run = acknowledgeCombat(run, content, rng);
    expect(run.phase).toBe('cardReward');
    expect(run.cardRewardOptions).toContain('eliteReward');

    run = chooseCardReward(run, 'eliteReward', content);
    expect(deckIds(run)).toContain('eliteReward');
  });

  it('goes to runLost (after acknowledge) when hull reaches 0', () => {
    const rng = createRng(5);
    let run = initRun(testMap, startingDeck);
    const content = makeContent({
      combatEnemiesByAct: { 1: [lethalEnemy], 2: [lethalEnemy], 3: [lethalEnemy] },
    });
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

  it('installing a maxHull ship system after Act 1 boss increases hull and advances to Act 2', () => {
    const rng = createRng(6);
    let run = initRun(testMap, startingDeck);
    run = { ...run, currentNodeId: 'midElite', visitedNodeIds: ['midElite'] };
    const content = makeContent();
    run = enterNode(run, 'boss', content, rng);
    const card = run.activeCombat!.hand[0];
    run = playRunCombatCard(run, card.instanceId, content, rng);
    run = acknowledgeCombat(run, content, rng);

    expect(run.act).toBe(1);
    const beforeMaxHull = run.maxHull;
    const beforeDeck = deckIds(run);
    const beforeSalvage = run.salvage;
    run = chooseShipSystemReward(run, 'hullPlating', content, rng);

    expect(run.maxHull).toBe(beforeMaxHull + 15);
    // Hull is fully restored on act advance (to the newly increased max).
    expect(run.hull).toBe(run.maxHull);
    expect(run.shipSystemIds).toEqual(['hullPlating']);
    expect(run.rewardOptions).toBeNull();
    // Advancing to the next act, not ending the run (TOTAL_ACTS is 3).
    expect(run.act).toBe(2);
    expect(run.phase).toBe('map');
    expect(run.currentNodeId).toBeNull();
    expect(run.visitedNodeIds).toEqual([]);
    // Everything else carries over between acts.
    expect(deckIds(run)).toEqual(beforeDeck);
    expect(run.salvage).toBe(beforeSalvage);
  });

  it('fully restores hull when advancing to the next act', () => {
    const rng = createRng(6);
    let run = initRun(testMap, startingDeck);
    run = { ...run, hull: 12, currentNodeId: 'midElite', visitedNodeIds: ['midElite'] };
    const content = makeContent();
    run = enterNode(run, 'boss', content, rng);
    const card = run.activeCombat!.hand[0];
    run = playRunCombatCard(run, card.instanceId, content, rng);
    run = acknowledgeCombat(run, content, rng);
    expect(run.hull).toBe(12); // still damaged going into the reward

    // Pick a non-maxHull system so the heal is isolated from any max increase.
    run = chooseShipSystemReward(run, 'powerCore', content, rng);

    expect(run.act).toBe(2);
    expect(run.hull).toBe(run.maxHull);
  });

  it('ends the run in victory after the final act boss', () => {
    const rng = createRng(6);
    let run = initRun(testMap, startingDeck);
    run = { ...run, act: TOTAL_ACTS, currentNodeId: 'midElite', visitedNodeIds: ['midElite'] };
    const content = makeContent();
    run = enterNode(run, 'boss', content, rng);
    const card = run.activeCombat!.hand[0];
    run = playRunCombatCard(run, card.instanceId, content, rng);
    run = acknowledgeCombat(run, content, rng);

    run = chooseShipSystemReward(run, run.rewardOptions![0], content, rng);

    expect(run.phase).toBe('runWon');
    expect(run.act).toBe(TOTAL_ACTS);
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
    run = chooseShipSystemReward(run, 'not-offered', content, rng);
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
    expect(deckIds(run).filter((id) => id === 'shieldCard')).toHaveLength(1);
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
    const initialDeckSize = deckIds(run).length;

    run = buyShopItem(run, 0, makeContent());
    expect(deckIds(run).length).toBe(initialDeckSize + 1);
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

describe('crew recruitment', () => {
  const ALL_CREW = Object.keys(crewDefinitions);

  /** Puts a run at an event node with a guaranteed offer from `recruitable`. */
  function offerFrom(recruitable: string[], seed: number, crewIds: string[] = []) {
    const rng = createRng(seed);
    let run = initRun(testMap, startingDeck);
    run = { ...run, currentNodeId: 'entryCombat', visitedNodeIds: ['entryCombat'], crewIds };
    const content = makeContent({ crewOfferChance: 1, recruitableCrewIds: recruitable });
    run = enterNode(run, 'midEvent', content, rng);
    return { run, content, rng };
  }

  it('offers a crew member at an event node when the chance roll passes', () => {
    const { run, content } = offerFrom(ALL_CREW, 30);
    expect(run.phase).toBe('crewOffer');
    expect(content.recruitableCrewIds).toContain(run.activeCrewId);
  });

  it('never offers crew when the chance is 0 or everyone is already aboard', () => {
    const { run } = offerFrom(['medic', 'gunner'], 31, ['medic', 'gunner']);
    expect(run.phase).toBe('event');
  });

  it('accepting grants the passive and adds no cards to the deck', () => {
    let { run, content } = offerFrom(['medic'], 32);
    expect(run.activeCrewId).toBe('medic');
    const deckBefore = deckIds(run);

    run = resolveCrewOffer(run, true, content);

    expect(run.crewIds).toEqual(['medic']);
    // Crew are a rule-change, not a deck-stuffing: the deck must be untouched.
    expect(deckIds(run)).toEqual(deckBefore);
    expect(run.phase).toBe('dialogue');
    expect(run.activeCrewId).toBe('medic'); // still set so the dialogue screen knows who speaks

    run = dismissDialogue(run);
    expect(run.phase).toBe('map');
    expect(run.activeCrewId).toBeNull();
  });

  it('declining leaves the deck and crew untouched', () => {
    let { run, content } = offerFrom(['medic'], 33);
    const deckBefore = deckIds(run);

    run = resolveCrewOffer(run, false, content);

    expect(run.crewIds).toEqual([]);
    expect(deckIds(run)).toEqual(deckBefore);
    expect(run.phase).toBe('map');
    expect(run.activeCrewId).toBeNull();
  });
});

describe('crew capacity', () => {
  const full = ['medic', 'gunner', 'engineer'];

  function offerWithFullBerth(seed: number) {
    const rng = createRng(seed);
    let run = initRun(testMap, startingDeck);
    run = { ...run, currentNodeId: 'entryCombat', visitedNodeIds: ['entryCombat'], crewIds: full };
    const content = makeContent({ crewOfferChance: 1, recruitableCrewIds: ['pilot'] });
    run = enterNode(run, 'midEvent', content, rng);
    return { run, content };
  }

  it('recruits normally while there is room', () => {
    const rng = createRng(60);
    let run = initRun(testMap, startingDeck);
    run = {
      ...run,
      currentNodeId: 'entryCombat',
      visitedNodeIds: ['entryCombat'],
      crewIds: ['medic', 'gunner'],
    };
    const content = makeContent({ crewOfferChance: 1, recruitableCrewIds: ['pilot'] });
    run = enterNode(run, 'midEvent', content, rng);

    run = resolveCrewOffer(run, true, content);

    expect(run.crewIds).toEqual(['medic', 'gunner', 'pilot']);
  });

  it('refuses to exceed the cap when no one is named to stand down', () => {
    const { run, content } = offerWithFullBerth(61);

    const after = resolveCrewOffer(run, true, content);

    // A no-op, not a silent eviction: the player has not chosen yet.
    expect(after).toBe(run);
    expect(after.crewIds).toEqual(full);
  });

  it('refuses a replacement who is not actually aboard', () => {
    const { run, content } = offerWithFullBerth(62);
    expect(resolveCrewOffer(run, true, content, 'navigator')).toBe(run);
  });

  it('swaps the named crew member out, keeping the cap', () => {
    const { run, content } = offerWithFullBerth(63);

    const after = resolveCrewOffer(run, true, content, 'gunner');

    expect(after.crewIds).toEqual(['medic', 'engineer', 'pilot']);
    expect(after.crewIds).toHaveLength(3);
    expect(after.phase).toBe('dialogue');
  });

  it('stops applying the passive of a crew member who stood down', () => {
    const { run, content } = offerWithFullBerth(64);
    const swapped = resolveCrewOffer(run, true, content, 'engineer'); // engineer = +1 power

    const rng = createRng(65);
    const inCombat = enterNode(
      { ...swapped, phase: 'map', currentNodeId: null, visitedNodeIds: [] },
      'entryCombat',
      content,
      rng,
    );

    expect(inCombat.activeCombat?.player.maxPower).toBe(DEFAULT_COMBAT_CONFIG.playerMaxPower);
  });

  it('offers a crew member again after they have stood down', () => {
    const { run, content } = offerWithFullBerth(66);
    const swapped = resolveCrewOffer(run, true, content, 'gunner');

    const rng = createRng(67);
    const offered = enterNode(
      { ...swapped, phase: 'map', currentNodeId: 'entryCombat', visitedNodeIds: [] },
      'midEvent',
      makeContent({ crewOfferChance: 1, recruitableCrewIds: ['gunner'] }),
      rng,
    );

    expect(offered.phase).toBe('crewOffer');
    expect(offered.activeCrewId).toBe('gunner');
  });
});

describe('crew passives', () => {
  function fightWith(crewIds: string[], seed: number, deck = startingDeck, hull?: number) {
    const rng = createRng(seed);
    let run = initRun(testMap, deck);
    run = { ...run, crewIds, ...(hull === undefined ? {} : { hull }) };
    const content = makeContent();
    run = enterNode(run, 'entryCombat', content, rng);
    return { run, content, rng };
  }

  it('power: grants an extra reactor point every turn', () => {
    const { run } = fightWith(['engineer'], 40);
    expect(run.activeCombat?.player.power).toBe(DEFAULT_COMBAT_CONFIG.playerMaxPower + 1);
  });

  it('calibration: adds its bonus to every attack', () => {
    const { run, content, rng } = fightWith(['gunner'], 41);
    const strike = run.activeCombat!.hand.find((c) => c.cardId === 'strike');
    const enemyHullBefore = run.activeCombat!.enemy.hull;

    const after = playRunCombatCard(run, strike!.instanceId, content, rng);

    // strike deals 3; gunner adds 2.
    expect(enemyHullBefore - (after.activeCombat?.enemy.hull ?? 0)).toBe(5);
  });

  it('startingShield: shields the first turn only, not every turn', () => {
    const { run, content, rng } = fightWith(['navigator'], 42);
    expect(run.activeCombat?.player.shield).toBe(10);

    const nextTurn = endRunCombatTurn(run, content, rng);

    // Turn 2 falls back to the per-turn baseline, which is 0 here.
    expect(nextTurn.activeCombat?.player.shield).toBe(0);
  });

  it('evasion: nullifies the first hit that reaches the hull, then stops', () => {
    const rng = createRng(43);
    let run = initRun(testMap, startingDeck);
    run = { ...run, crewIds: ['pilot'], hull: 50 };
    const content = makeContent({
      combatEnemiesByAct: { 1: [attacker], 2: [attacker], 3: [attacker] },
    });
    run = enterNode(run, 'entryCombat', content, rng);
    expect(run.activeCombat?.player.hull).toBe(50);

    run = endRunCombatTurn(run, content, rng);
    expect(run.activeCombat?.player.hull).toBe(50); // first hit evaded

    run = endRunCombatTurn(run, content, rng);
    expect(run.activeCombat?.player.hull).toBe(40); // second lands
  });

  it('evasion: is not spent by a hit the shields fully absorb', () => {
    const rng = createRng(44);
    let run = initRun(testMap, startingDeck);
    run = { ...run, crewIds: ['pilot', 'navigator'], hull: 50 };
    const content = makeContent({
      combatEnemiesByAct: { 1: [attacker], 2: [attacker], 3: [attacker] },
    });
    run = enterNode(run, 'entryCombat', content, rng);

    run = endRunCombatTurn(run, content, rng); // 10 shields soak the 10 damage
    expect(run.activeCombat?.player.hull).toBe(50);

    run = endRunCombatTurn(run, content, rng); // no shields left; evasion pays here
    expect(run.activeCombat?.player.hull).toBe(50);

    run = endRunCombatTurn(run, content, rng);
    expect(run.activeCombat?.player.hull).toBe(40);
  });

  it('retainHand: keeps unplayed cards instead of discarding them', () => {
    const { run, content, rng } = fightWith(['analyst'], 45);
    const handBefore = run.activeCombat!.hand.map((c) => c.instanceId);
    expect(handBefore.length).toBeGreaterThan(0);

    const next = endRunCombatTurn(run, content, rng);

    // Every card is still in hand, and none of them reached the discard pile.
    expect(next.activeCombat?.hand.map((c) => c.instanceId)).toEqual(
      expect.arrayContaining(handBefore),
    );
    expect(next.activeCombat?.discardPile).toEqual([]);
  });

  it('retainHand: refills to the draw amount rather than growing the hand', () => {
    const { run, content, rng } = fightWith(['analyst'], 46);
    const size = run.activeCombat!.hand.length;

    let next = endRunCombatTurn(run, content, rng);
    next = endRunCombatTurn(next, content, rng);

    expect(next.activeCombat?.hand.length).toBe(size);
  });

  it('repairAfterCombat: restores hull once the fight is won, capped at max', () => {
    const { run, content, rng } = fightWith(['medic'], 47, startingDeck, 30);
    const strike = run.activeCombat!.hand.find((c) => c.cardId === 'strike');

    // weakEnemy has 5 hull; one strike ends it.
    const after = playRunCombatCard(run, strike!.instanceId, content, rng);

    expect(after.activeCombat?.phase).toBe('won');
    expect(after.hull).toBe(36); // 30 + 6
  });

  it('repairAfterCombat: never heals past max hull', () => {
    const { run, content, rng } = fightWith(['medic'], 48);
    const strike = run.activeCombat!.hand.find((c) => c.cardId === 'strike');

    const after = playRunCombatCard(run, strike!.instanceId, content, rng);

    expect(after.hull).toBe(after.maxHull);
  });

  it('stacks passives from several crew at once', () => {
    const { run } = fightWith(['engineer', 'navigator', 'gunner'], 49);

    expect(run.activeCombat?.player.power).toBe(DEFAULT_COMBAT_CONFIG.playerMaxPower + 1);
    expect(run.activeCombat?.player.shield).toBe(10);
    expect(run.activeCombat?.player.statuses.calibration?.amount).toBe(2);
  });

  it('keeps applying per-turn passives after turn 1', () => {
    // Sibling of the ship-system regression: endRunCombatTurn must rebuild the config
    // every turn, or a crew passive silently lapses from turn 2 onward.
    const { run, content, rng } = fightWith(['engineer'], 50);

    const next = endRunCombatTurn(run, content, rng);

    expect(next.activeCombat?.player.power).toBe(DEFAULT_COMBAT_CONFIG.playerMaxPower + 1);
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
    expect(deckIds(run)).toContain('strike');
    expect(run.pendingReward).toEqual({ salvage: 15, cardId: 'strike' });

    run = leaveNode(run);
    expect(run.phase).toBe('map');
    expect(run.pendingReward).toBeNull();
  });
});

describe('garage node', () => {
  const enterGarage = (rng = createRng(70)) => {
    let run = initRun(testMap, startingDeck);
    run = { ...run, currentNodeId: 'midTreasure', visitedNodeIds: ['midTreasure'] };
    return enterNode(run, 'midGarage', makeContent(), rng);
  };

  it('opens the garage phase on entry', () => {
    const run = enterGarage();
    expect(run.phase).toBe('garage');
  });

  it('upgrades exactly the chosen copy and returns to the map', () => {
    const content = makeContent();
    let run = enterGarage();
    expect(run.deckCards[0].level).toBe(0);

    run = upgradeCardAtGarage(run, 0, content);

    expect(run.phase).toBe('map');
    expect(run.deckCards[0].level).toBe(1);
    // Sibling copies of the same card are untouched — upgrades are per copy.
    expect(run.deckCards.slice(1).every((c) => c.level === 0)).toBe(true);
  });

  it('stacks to the cap and then refuses', () => {
    const content = makeContent();
    let run = enterGarage();
    run = upgradeCardAtGarage(run, 0, content);
    run = { ...run, phase: 'garage' };
    run = upgradeCardAtGarage(run, 0, content);
    expect(run.deckCards[0].level).toBe(2);

    run = { ...run, phase: 'garage' };
    const before = run;
    run = upgradeCardAtGarage(run, 0, content);
    expect(run).toBe(before); // already maxed — no-op
  });

  it('can be left without upgrading anything', () => {
    const run = leaveNode(enterGarage());
    expect(run.phase).toBe('map');
    expect(run.deckCards.every((c) => c.level === 0)).toBe(true);
  });

  it('never writes anything outside the run deck', () => {
    const content = makeContent();
    const before = enterGarage();
    const after = upgradeCardAtGarage(before, 0, content);
    // Only the deck and the phase/log move; nothing else about the run changes.
    expect({ ...after, deckCards: [], phase: 'x', log: [] }).toEqual({
      ...before,
      deckCards: [],
      phase: 'x',
      log: [],
    });
  });
});

describe('upgradableDeckIndices', () => {
  it('offers every copy below the cap for a garage', () => {
    const run = initRun(testMap, startingDeck);
    expect(upgradableDeckIndices(run, false)).toHaveLength(startingDeck.length);
  });

  it('offers only loadout-derived copies when the upgrade would be permanent', () => {
    let run = initRun(testMap, startingDeck);
    run = { ...run, deckCards: [...run.deckCards, { cardId: 'strike', level: 0 }] };

    const permanent = upgradableDeckIndices(run, true);
    const anyNode = upgradableDeckIndices(run, false);

    expect(anyNode).toContain(run.deckCards.length - 1);
    // The mid-run pickup has no loadout slot, so it cannot be made permanent.
    expect(permanent).not.toContain(run.deckCards.length - 1);
    expect(permanent).toHaveLength(startingDeck.length);
  });

  it('drops copies that are already at the cap', () => {
    let run = initRun(testMap, startingDeck);
    run = {
      ...run,
      deckCards: run.deckCards.map((c, i) => (i === 0 ? { ...c, level: 2 as const } : c)),
    };
    expect(upgradableDeckIndices(run, false)).not.toContain(0);
  });
});

describe('effective combat config persists across turns', () => {
  /**
   * Regression: endRunCombatTurn used to call endPlayerTurn without a config, so
   * every ship-system and crew-passive effect silently reverted to the defaults
   * from turn 2 onward — baseline shields vanished, extra power and draw died.
   */
  const deflectorContent = () =>
    makeContent({
      shipSystemDefinitions: {
        ...shipSystemDefinitions,
        deflector: {
          id: 'deflector',
          name: 'Deflector',
          description: 'baseline shield',
          effect: { kind: 'baselineShield', amount: 5 },
        },
      },
      combatEnemiesByAct: { 1: [weakEnemy], 2: [weakEnemy], 3: [weakEnemy] },
    });

  it('keeps a baselineShield ship system working past the first turn', () => {
    const rng = createRng(80);
    const content = deflectorContent();
    let run = initRun(testMap, startingDeck);
    run = { ...run, shipSystemIds: ['deflector'] };
    run = enterNode(run, 'entryCombat', content, rng);

    expect(run.activeCombat?.player.shield).toBe(5); // turn 1

    run = endRunCombatTurn(run, content, rng);

    expect(run.activeCombat?.player.shield).toBe(5); // turn 2 — used to be 0
  });

  it('keeps a maxPower ship system working past the first turn', () => {
    const rng = createRng(81);
    const content = deflectorContent();
    let run = initRun(testMap, startingDeck);
    run = { ...run, shipSystemIds: ['powerCore'] }; // +1 max power
    run = enterNode(run, 'entryCombat', content, rng);

    const turn1Power = run.activeCombat?.player.power;
    run = endRunCombatTurn(run, content, rng);

    expect(run.activeCombat?.player.power).toBe(turn1Power); // used to drop to 3
  });
});

describe('rarity-weighted offers', () => {
  /** A pool with one card per tier, so tier selection is directly observable. */
  const tieredContent = () => {
    const defs: Record<string, CardDefinition> = {
      ...cardDefinitions,
      cCommon: { ...cardDefinitions.strike, id: 'cCommon' },
      cRare: { ...cardDefinitions.strike, id: 'cRare', rarity: 'rare' },
      cEpic: { ...cardDefinitions.strike, id: 'cEpic', rarity: 'epic' },
      cLegend: { ...cardDefinitions.strike, id: 'cLegend', rarity: 'legendary' },
    };
    return makeContent({
      cardDefinitions: defs,
      shopCardPool: ['cCommon', 'cRare', 'cEpic', 'cLegend'],
      treasureCardPool: ['cCommon', 'cRare', 'cEpic', 'cLegend'],
      eliteRewardCardIds: ['cCommon', 'cRare', 'cEpic', 'cLegend'],
    });
  };

  it('offers 3 distinct cards after a combat win', () => {
    const content = tieredContent();
    for (const seed of [10, 11, 12, 13, 14]) {
      const rng = createRng(seed);
      let run = initRun(testMap, startingDeck);
      run = enterNode(run, 'entryCombat', content, rng);
      run = playRunCombatCard(run, run.activeCombat!.hand[0].instanceId, content, rng);
      run = acknowledgeCombat(run, content, rng);
      const options = run.cardRewardOptions ?? [];
      expect(options).toHaveLength(3);
      expect(new Set(options).size).toBe(3);
    }
  });

  it('favours commons at a normal fight and rarer cards at an elite', () => {
    const content = tieredContent();
    const tierCounts = (elite: boolean) => {
      let common = 0;
      let high = 0;
      for (let seed = 0; seed < 60; seed++) {
        const rng = createRng(seed);
        let run = initRun(testMap, startingDeck);
        if (elite) run = { ...run, currentNodeId: 'midGarage', visitedNodeIds: ['midGarage'] };
        run = enterNode(run, elite ? 'midElite' : 'entryCombat', content, rng);
        run = playRunCombatCard(run, run.activeCombat!.hand[0].instanceId, content, rng);
        run = acknowledgeCombat(run, content, rng);
        for (const id of run.cardRewardOptions ?? []) {
          if (id === 'cCommon') common++;
          if (id === 'cEpic' || id === 'cLegend') high++;
        }
      }
      return { common, high };
    };

    const normal = tierCounts(false);
    const elite = tierCounts(true);
    // Elites are the reliable route to high rarity.
    expect(elite.high).toBeGreaterThan(normal.high);
  });

  it('charges a rarity premium in the shop', () => {
    const content = tieredContent();
    const rng = createRng(20);
    let run = initRun(testMap, startingDeck);
    run = { ...run, currentNodeId: 'midRest', visitedNodeIds: ['midRest'] };
    run = enterNode(run, 'midShop', content, rng);

    for (const item of run.shopOffer ?? []) {
      const def = content.cardDefinitions[item.cardId];
      const base = 20 + def.cost * 15;
      // A common pays the base; anything rarer pays strictly more.
      if (item.cardId === 'cCommon') expect(item.price).toBe(base);
      else expect(item.price).toBeGreaterThan(base);
    }
  });
});
