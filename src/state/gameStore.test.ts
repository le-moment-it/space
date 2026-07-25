import { beforeEach, describe, expect, it } from 'vitest';
import { createEmptySave } from '../engine/save/schema';
import { makeSave } from '../engine/save/serialize';
import { defaultUnlockedCardIds } from '../data/cards';
import {
  levelFor,
  MAX_LEVEL,
  nextUnlock,
  unlocksUpTo,
  XP_AWARDS,
  xpForLevel,
} from '../engine/progression/level';
import { TOTAL_ACTS, type RunState } from '../engine/run/types';
import { LOADOUT_SIZE } from '../engine/save/types';
import { SAVE_DEFAULTS, useGameStore } from './gameStore';

const emptyMeta = () =>
  createEmptySave({ unlockedCardIds: [], unlockedShipSystemIds: [], loadoutCardIds: [] }).meta;

describe('gameStore — endings', () => {
  beforeEach(() => {
    localStorage.clear();
    useGameStore.setState({ meta: emptyMeta(), run: null, appPhase: 'hub', pendingEndingIds: [] });
  });

  it('unlocks and queues the first-contact ending when the final act boss is cleared', () => {
    useGameStore.getState().startNewRun();
    const run = useGameStore.getState().run;
    if (!run) throw new Error('run should exist after startNewRun');

    // Force the "just cleared the Act 3 boss, at the reward screen" state.
    useGameStore.setState({
      run: {
        ...run,
        act: TOTAL_ACTS,
        currentNodeId: run.map.bossNodeId,
        phase: 'reward',
        rewardOptions: ['reinforced-hull-plating', 'auxiliary-power-core'],
      },
    });

    useGameStore.getState().chooseShipSystem('reinforced-hull-plating');

    const after = useGameStore.getState();
    expect(after.run?.phase).toBe('runWon');
    expect(after.meta.stats.runsWon).toBe(1);
    expect(after.meta.endingsUnlocked).toContain('first-contact');
    expect(after.pendingEndingIds).toContain('first-contact');
  });

  it('does not re-queue an ending that was already unlocked in a past run', () => {
    // Pretend first-contact was earned previously.
    useGameStore.setState({
      meta: {
        ...emptyMeta(),
        endingsUnlocked: ['first-contact'],
        stats: { ...emptyMeta().stats, runsWon: 1 },
      },
    });
    useGameStore.getState().startNewRun();
    const run = useGameStore.getState().run!;
    useGameStore.setState({
      run: {
        ...run,
        act: TOTAL_ACTS,
        currentNodeId: run.map.bossNodeId,
        phase: 'reward',
        rewardOptions: ['reinforced-hull-plating'],
      },
    });

    useGameStore.getState().chooseShipSystem('reinforced-hull-plating');

    expect(useGameStore.getState().pendingEndingIds).not.toContain('first-contact');
  });

  it('dismissEnding advances the queue; viewEnding re-queues one', () => {
    useGameStore.setState({ pendingEndingIds: ['first-contact', 'into-the-silence'] });
    useGameStore.getState().dismissEnding();
    expect(useGameStore.getState().pendingEndingIds).toEqual(['into-the-silence']);

    useGameStore.getState().viewEnding('first-contact');
    expect(useGameStore.getState().pendingEndingIds).toEqual(['into-the-silence', 'first-contact']);
  });
});

describe('gameStore — loadout', () => {
  beforeEach(() => {
    localStorage.clear();
    useGameStore.setState({
      meta: {
        ...emptyMeta(),
        unlockedCardIds: ['flak-burst', 'raise-shields'],
        loadoutCards: [],
      },
      run: null,
      appPhase: 'hub',
    });
  });

  it('adds an unlocked card and refuses an unlocked-but-unknown or locked one', () => {
    const store = () => useGameStore.getState();
    store().addLoadoutCard('flak-burst');
    expect(store().meta.loadoutCards.map((c) => c.cardId)).toEqual(['flak-burst']);

    store().addLoadoutCard('does-not-exist');
    store().addLoadoutCard('siege-cannon'); // real card, but not unlocked here
    expect(store().meta.loadoutCards.map((c) => c.cardId)).toEqual(['flak-burst']);
  });

  it('does not add past the loadout size cap', () => {
    useGameStore.setState((s) => ({
      meta: { ...s.meta, loadoutCards: Array(10).fill({ cardId: 'flak-burst', level: 0 }) },
    }));
    useGameStore.getState().addLoadoutCard('raise-shields');
    expect(useGameStore.getState().meta.loadoutCards).toHaveLength(10);
  });

  it('removes a card by index and can reset to the default loadout', () => {
    useGameStore.setState((s) => ({
      meta: {
        ...s.meta,
        loadoutCards: ['flak-burst', 'raise-shields', 'flak-burst'].map((cardId) => ({
          cardId,
          level: 0 as const,
        })),
      },
    }));
    useGameStore.getState().removeLoadoutCard(1);
    expect(useGameStore.getState().meta.loadoutCards.map((c) => c.cardId)).toEqual([
      'flak-burst',
      'flak-burst',
    ]);

    useGameStore.getState().resetLoadout();
    expect(useGameStore.getState().meta.loadoutCards).toHaveLength(10);
  });
});

describe('gameStore — in-run cards stay in the run', () => {
  beforeEach(() => {
    localStorage.clear();
    useGameStore.setState({ meta: emptyMeta(), run: null, appPhase: 'hub', pendingEndingIds: [] });
  });

  /**
   * Cards gained mid-run (combat reward, shop, cache, event, crew) must live only in
   * that run's deck. They must never reach meta.unlockedCardIds, which is what the
   * Deck screen offers when building a loadout — only levelling unlocks cards there.
   */
  it('a card picked as a combat reward does not become permanently unlocked', () => {
    useGameStore.setState((s) => ({
      meta: {
        ...s.meta,
        unlockedCardIds: ['flak-burst'],
        loadoutCards: Array(10).fill({ cardId: 'flak-burst', level: 0 }),
      },
    }));
    useGameStore.getState().startNewRun();
    const run = useGameStore.getState().run;
    if (!run) throw new Error('run should exist after startNewRun');

    const unlockedBefore = [...useGameStore.getState().meta.unlockedCardIds];
    const reward = 'siege-cannon';
    expect(unlockedBefore).not.toContain(reward);

    useGameStore.setState({
      run: { ...run, phase: 'cardReward', cardRewardOptions: [reward] },
    });
    useGameStore.getState().chooseCardReward(reward);

    // It is in the run deck for the rest of this run...
    expect(useGameStore.getState().run?.deckCards.map((c) => c.cardId)).toContain(reward);
    // ...but the permanent collection is untouched.
    expect(useGameStore.getState().meta.unlockedCardIds).toEqual(unlockedBefore);
    expect(useGameStore.getState().meta.loadoutCards.map((c) => c.cardId)).not.toContain(reward);
  });

  it('the next run starts from the saved loadout, without last run’s pickups', () => {
    useGameStore.setState((s) => ({
      meta: {
        ...s.meta,
        unlockedCardIds: ['flak-burst'],
        loadoutCards: Array(10).fill({ cardId: 'flak-burst', level: 0 }),
      },
    }));
    useGameStore.getState().startNewRun();
    const run = useGameStore.getState().run;
    if (!run) throw new Error('run should exist after startNewRun');

    useGameStore.setState({
      run: { ...run, phase: 'cardReward', cardRewardOptions: ['siege-cannon'] },
    });
    useGameStore.getState().chooseCardReward('siege-cannon');
    expect(useGameStore.getState().run?.deckCards.map((c) => c.cardId)).toContain('siege-cannon');

    useGameStore.getState().returnToHub();
    useGameStore.getState().startNewRun();

    expect(useGameStore.getState().run?.deckCards.map((c) => c.cardId)).toEqual(
      Array(10).fill('flak-burst'),
    );
    expect(useGameStore.getState().run?.deckCards.map((c) => c.cardId)).not.toContain(
      'siege-cannon',
    );
  });
});

describe('gameStore — permanent card upgrades', () => {
  const tenFlak = () =>
    Array.from({ length: 10 }, () => ({ cardId: 'flak-burst', level: 0 as const }));

  const startAtBossReward = () => {
    useGameStore.setState((s) => ({
      meta: { ...s.meta, unlockedCardIds: ['flak-burst'], loadoutCards: tenFlak() },
    }));
    useGameStore.getState().startNewRun();
    const run = useGameStore.getState().run;
    if (!run) throw new Error('run should exist after startNewRun');
    useGameStore.setState({
      run: { ...run, currentNodeId: run.map.bossNodeId, phase: 'reward', rewardOptions: [] },
    });
  };

  beforeEach(() => {
    localStorage.clear();
    useGameStore.setState({ meta: emptyMeta(), run: null, appPhase: 'hub', pendingEndingIds: [] });
  });

  it('writes the upgrade to both the run deck and the loadout slot', () => {
    startAtBossReward();
    expect(useGameStore.getState().run?.deckCards[3].loadoutIndex).toBe(3);

    useGameStore.getState().chooseCardUpgradeReward(3);

    // Permanent: the loadout slot it came from is upgraded forever...
    const loadout = useGameStore.getState().meta.loadoutCards;
    expect(loadout[3].level).toBe(1);
    // ...and only that slot.
    expect(loadout.filter((s) => s.level > 0)).toHaveLength(1);
    // The act advanced, as taking any boss reward does.
    expect(useGameStore.getState().run?.act).toBe(2);
  });

  it('carries the permanent upgrade into the next run', () => {
    startAtBossReward();
    useGameStore.getState().chooseCardUpgradeReward(3);
    useGameStore.getState().returnToHub();

    useGameStore.getState().startNewRun();

    const deck = useGameStore.getState().run?.deckCards ?? [];
    expect(deck[3].level).toBe(1);
    expect(deck.filter((c) => c.level > 0)).toHaveLength(1);
  });

  it('refuses to permanently upgrade a card picked up mid-run', () => {
    startAtBossReward();
    const run = useGameStore.getState().run;
    if (!run) throw new Error('run');
    // A shop/reward pickup: no loadout slot.
    useGameStore.setState({
      run: { ...run, deckCards: [...run.deckCards, { cardId: 'flak-burst', level: 0 }] },
    });

    useGameStore.getState().chooseCardUpgradeReward(10);

    // Rejected outright — still on the reward screen, nothing upgraded.
    expect(useGameStore.getState().run?.phase).toBe('reward');
    expect(useGameStore.getState().meta.loadoutCards.every((s) => s.level === 0)).toBe(true);
  });

  it('a garage upgrade never touches the loadout', () => {
    useGameStore.setState((s) => ({
      meta: { ...s.meta, unlockedCardIds: ['flak-burst'], loadoutCards: tenFlak() },
    }));
    useGameStore.getState().startNewRun();
    const run = useGameStore.getState().run;
    if (!run) throw new Error('run');
    useGameStore.setState({ run: { ...run, phase: 'garage' } });

    useGameStore.getState().upgradeCardAtGarage(2);

    expect(useGameStore.getState().run?.deckCards[2].level).toBe(1);
    // Run-only: the permanent loadout is untouched.
    expect(useGameStore.getState().meta.loadoutCards.every((s) => s.level === 0)).toBe(true);
  });

  it('keeps the run upgrade but skips the permanent write when the slot no longer matches', () => {
    startAtBossReward();
    // The Deck screen is reachable mid-run; swap the slot's card out from under us.
    useGameStore.setState((s) => ({
      meta: {
        ...s.meta,
        unlockedCardIds: ['flak-burst', 'raise-shields'],
        loadoutCards: s.meta.loadoutCards.map((slot, i) =>
          i === 3 ? { cardId: 'raise-shields', level: 0 as const } : slot,
        ),
      },
    }));

    useGameStore.getState().chooseCardUpgradeReward(3);

    // The run copy is upgraded...
    expect(useGameStore.getState().run?.deckCards[3].level).toBe(1);
    // ...but no slot was permanently upgraded, because the id no longer matched.
    expect(useGameStore.getState().meta.loadoutCards.every((s) => s.level === 0)).toBe(true);
  });

  it('ends the run in victory when the upgrade is taken after the final act boss', () => {
    startAtBossReward();
    const run = useGameStore.getState().run;
    if (!run) throw new Error('run');
    useGameStore.setState({ run: { ...run, act: TOTAL_ACTS } });

    useGameStore.getState().chooseCardUpgradeReward(0);

    expect(useGameStore.getState().run?.phase).toBe('runWon');
    expect(useGameStore.getState().meta.stats.runsWon).toBe(1);
    // Still permanent, even though the run ended.
    expect(useGameStore.getState().meta.loadoutCards[0].level).toBe(1);
  });
});

describe('gameStore — reset and import', () => {
  beforeEach(() => {
    localStorage.clear();
    useGameStore.setState({ meta: emptyMeta(), run: null, appPhase: 'hub', pendingEndingIds: [] });
  });

  it('wipes every kind of progress and returns to the hub', () => {
    useGameStore.getState().startNewRun();
    useGameStore.setState((s) => ({
      meta: {
        ...s.meta,
        unlockedCardIds: [...s.meta.unlockedCardIds, 'earned-card'],
        unlockedShipSystemIds: [...s.meta.unlockedShipSystemIds, 'earned-system'],
        milestones: { 'defeat-a-boss': true },
        stats: { ...s.meta.stats, runsWon: 4, bossesDefeated: 2 },
        crew: { medic: { timesRecruited: 3 } },
        endingsUnlocked: ['first-contact'],
      },
      pendingEndingIds: ['first-contact'],
    }));

    useGameStore.getState().resetSave();

    const after = useGameStore.getState();
    expect(after.run).toBeNull();
    expect(after.appPhase).toBe('hub');
    expect(after.pendingEndingIds).toEqual([]);
    expect(after.meta.unlockedCardIds).not.toContain('earned-card');
    expect(after.meta.unlockedShipSystemIds).not.toContain('earned-system');
    expect(after.meta.milestones).toEqual({});
    expect(after.meta.crew).toEqual({});
    expect(after.meta.endingsUnlocked).toEqual([]);
    expect(after.meta.stats.runsWon).toBe(0);
    expect(after.meta.stats.runsStarted).toBe(0);
  });

  it('persists the reset, so it survives a reload', () => {
    useGameStore.getState().startNewRun();

    useGameStore.getState().resetSave();

    const stored = JSON.parse(localStorage.getItem('space-roguelike:save') ?? '{}');
    expect(stored.currentRun).toBeNull();
    expect(stored.meta.stats.runsStarted).toBe(0);
  });

  it('leaves the language alone — a reset is not a preferences reset', () => {
    useGameStore.getState().setLanguage('fr');

    useGameStore.getState().resetSave();

    expect(useGameStore.getState().language).toBe('fr');
    expect(localStorage.getItem('space:lang')).toBe('fr');
  });

  it('imports a save with no run and lands in the hub', () => {
    const imported = createEmptySave(SAVE_DEFAULTS);
    imported.meta.stats.runsWon = 7;

    useGameStore.getState().importSave(imported);

    const after = useGameStore.getState();
    expect(after.meta.stats.runsWon).toBe(7);
    expect(after.meta.unlockedCardIds).toEqual(defaultUnlockedCardIds);
    expect(after.run).toBeNull();
    expect(after.appPhase).toBe('hub');
    expect(
      JSON.parse(localStorage.getItem('space-roguelike:save') ?? '{}').meta.stats.runsWon,
    ).toBe(7);
  });

  it('resumes an imported run in progress', () => {
    useGameStore.getState().startNewRun();
    const exported = {
      version: 7 as const,
      meta: useGameStore.getState().meta,
      currentRun: useGameStore.getState().run,
    };
    useGameStore.getState().resetSave();
    expect(useGameStore.getState().appPhase).toBe('hub');

    useGameStore.getState().importSave(exported);

    expect(useGameStore.getState().appPhase).toBe('run');
    expect(useGameStore.getState().run?.map.nodes).toEqual(exported.currentRun?.map.nodes);
  });

  it('does not replay endings the imported profile already unlocked', () => {
    const imported = createEmptySave({
      unlockedCardIds: [],
      unlockedShipSystemIds: [],
      loadoutCardIds: [],
    });
    imported.meta.endingsUnlocked = ['first-contact'];

    useGameStore.getState().importSave(imported);

    expect(useGameStore.getState().pendingEndingIds).toEqual([]);
  });
});

describe('gameStore — level unlocks are additive', () => {
  beforeEach(() => {
    localStorage.clear();
    useGameStore.setState({ meta: emptyMeta(), run: null, appPhase: 'hub', pendingEndingIds: [] });
  });

  const saveWith = (meta: Partial<ReturnType<typeof emptyMeta>>) => {
    const save = createEmptySave(SAVE_DEFAULTS);
    return { ...save, meta: { ...save.meta, ...meta } };
  };

  /**
   * The regression that matters most in this rework. Cards used to be revoked unless a
   * milestone justified them; with milestones gone, that logic would have wiped every
   * card every existing player had earned. Unlocks are additive now — prove it.
   */
  it('never revokes a card, even one no level has granted yet', () => {
    useGameStore.getState().importSave(
      saveWith({
        xp: 0,
        unlockedCardIds: [...defaultUnlockedCardIds, 'overwhelming-barrage', 'nanite-swarm'],
      }),
    );

    const unlocked = useGameStore.getState().meta.unlockedCardIds;
    expect(unlocked).toContain('overwhelming-barrage');
    expect(unlocked).toContain('nanite-swarm');
  });

  it('leaves a loadout alone rather than stripping and padding it', () => {
    useGameStore.getState().importSave(
      saveWith({
        xp: 0,
        unlockedCardIds: [...defaultUnlockedCardIds, 'master-gunner'],
        loadoutCards: [
          { cardId: 'flak-burst', level: 0 },
          { cardId: 'master-gunner', level: 0 },
        ],
      }),
    );

    const loadout = useGameStore.getState().meta.loadoutCards.map((c) => c.cardId);
    expect(loadout).toEqual(['flak-burst', 'master-gunner']);
  });

  it('grants everything the level entitles the player to, on load', () => {
    const level = 12;
    useGameStore.getState().importSave(saveWith({ xp: xpForLevel(level) }));

    const unlocked = useGameStore.getState().meta.unlockedCardIds;
    for (const id of unlocksUpTo(level).cardIds) expect(unlocked).toContain(id);
    // ...and nothing from beyond it.
    const beyond = nextUnlock(level);
    if (beyond) expect(unlocked).not.toContain(beyond.cardIds[0]);
  });

  it('grants the ship systems too', () => {
    useGameStore.getState().importSave(saveWith({ xp: xpForLevel(MAX_LEVEL) }));
    const systems = useGameStore.getState().meta.unlockedShipSystemIds;
    for (const id of unlocksUpTo(MAX_LEVEL).shipSystemIds) expect(systems).toContain(id);
  });
});

/** A default-unlocked attack, so a deck built from it guarantees a killing blow. */
const ATTACK = 'flak-burst';

describe('gameStore — XP awards', () => {
  beforeEach(() => {
    localStorage.clear();
    useGameStore.setState({ meta: emptyMeta(), run: null, appPhase: 'hub', pendingEndingIds: [] });
  });

  /**
   * Enters a node of `type` and lands a killing blow, so the store sees the real
   * transition into 'won' rather than a hand-built one.
   *
   * The deck is all attacks on purpose. `startNewRun` seeds its RNG from Date.now(),
   * so the opening hand is genuinely random — with the default deck's 5 attacks in 10,
   * a 5-card hand holds none about once in 252 draws, which CI duly rolled.
   */
  const winFightOn = (type: 'combat' | 'elite' | 'boss') => {
    useGameStore.setState((s) => ({
      meta: {
        ...s.meta,
        unlockedCardIds: [ATTACK],
        loadoutCards: Array.from({ length: LOADOUT_SIZE }, () => ({
          cardId: ATTACK,
          level: 0 as const,
        })),
      },
    }));
    useGameStore.getState().startNewRun();
    const start = useGameStore.getState().run!;

    // Retype an entry node rather than searching the map for one: node types are rolled
    // per layer, so a generated map is not guaranteed to contain an elite at all, and
    // searching made the test depend on the map roll.
    const nodeId = start.map.entryNodeIds[0];
    useGameStore.setState({
      run: {
        ...start,
        map: {
          ...start.map,
          entryNodeIds: [nodeId],
          nodes: { ...start.map.nodes, [nodeId]: { ...start.map.nodes[nodeId], type } },
        },
        currentNodeId: null,
      },
    });
    useGameStore.getState().enterNode(nodeId);

    // One hit from dead, so any attack in hand finishes it.
    const inCombat = useGameStore.getState().run!;
    useGameStore.setState({
      run: {
        ...inCombat,
        activeCombat: {
          ...inCombat.activeCombat!,
          enemy: { ...inCombat.activeCombat!.enemy, hull: 1, shield: 0 },
        },
      },
    });

    const [attack] = useGameStore.getState().run!.activeCombat!.hand;
    useGameStore.getState().playCard(attack.instanceId);
  };

  it.each([
    ['combat', XP_AWARDS.combat],
    ['elite', XP_AWARDS.elite],
    ['boss', XP_AWARDS.boss],
  ] as const)('pays the right XP for winning on a %s node', (type, award) => {
    winFightOn(type);

    expect(useGameStore.getState().run?.activeCombat?.phase).toBe('won');
    expect(useGameStore.getState().meta.xp).toBe(award);
    expect(useGameStore.getState().run?.xpEarned).toBe(award);
  });

  it('pays once, however many actions follow the win', () => {
    winFightOn('combat');
    const afterWin = useGameStore.getState().meta.xp;

    // Re-dispatching against a finished fight must not top it up again.
    useGameStore.getState().endTurn();
    useGameStore.getState().playCard('does-not-exist');

    expect(useGameStore.getState().meta.xp).toBe(afterWin);
    expect(useGameStore.getState().run?.xpEarned).toBe(afterWin);
  });

  it('pays nothing for an action that changes nothing', () => {
    useGameStore.getState().startNewRun();
    useGameStore.getState().playCard('not-a-real-instance');
    expect(useGameStore.getState().meta.xp).toBe(0);
  });

  it('starts a run with no XP banked for it', () => {
    useGameStore.getState().startNewRun();
    expect(useGameStore.getState().run?.xpEarned).toBe(0);
  });

  it('levels up once enough XP is banked', () => {
    useGameStore.setState((s) => ({ meta: { ...s.meta, xp: xpForLevel(2) - XP_AWARDS.boss } }));

    winFightOn('boss');

    expect(levelFor(useGameStore.getState().meta.xp)).toBe(2);
  });
});

describe('gameStore — runs holding cards that no longer exist', () => {
  beforeEach(() => {
    localStorage.clear();
    useGameStore.setState({ meta: emptyMeta(), run: null, appPhase: 'hub', pendingEndingIds: [] });
  });

  /**
   * Crew cards were deleted outright. A run saved by the previous build still names
   * them in its deck and combat piles, where playCard throws `Unknown card id`.
   */
  const withGhostCards = (run: RunState): RunState => ({
    ...run,
    deckCards: [...run.deckCards, { cardId: 'crew-penance', level: 0 }],
    activeCombat: run.activeCombat && {
      ...run.activeCombat,
      hand: [
        ...run.activeCombat.hand,
        { instanceId: 'ghost#1', cardId: 'crew-penance', level: 0 as const },
      ],
      drawPile: [
        ...run.activeCombat.drawPile,
        { instanceId: 'ghost#2', cardId: 'crew-deep-scan', level: 0 as const },
      ],
      discardPile: [
        ...run.activeCombat.discardPile,
        { instanceId: 'ghost#3', cardId: 'crew-jury-rig', level: 0 as const },
      ],
      exhaustPile: [
        ...run.activeCombat.exhaustPile,
        { instanceId: 'ghost#4', cardId: 'crew-overload-shot', level: 0 as const },
      ],
    },
  });

  it('strips deleted cards from the deck and every combat pile on load', () => {
    useGameStore.getState().startNewRun();
    const first = useGameStore.getState().run;
    if (!first) throw new Error('run');
    // Walk into the first node so there is a live combat with real piles to pollute.
    const combatNode = first.map.entryNodeIds.find((id) => first.map.nodes[id]?.type === 'combat');
    if (!combatNode) throw new Error('expected a combat entry node');
    useGameStore.getState().enterNode(combatNode);
    const run = useGameStore.getState().run;
    if (!run) throw new Error('run');
    const inCombat = useGameStore.getState().run;
    if (!inCombat?.activeCombat) throw new Error('expected a combat in progress');
    const polluted = withGhostCards(inCombat);

    useGameStore.getState().importSave(makeSave(useGameStore.getState().meta, polluted));

    const after = useGameStore.getState().run;
    const ids = [
      ...(after?.deckCards ?? []).map((c) => c.cardId),
      ...(after?.activeCombat?.hand ?? []).map((c) => c.cardId),
      ...(after?.activeCombat?.drawPile ?? []).map((c) => c.cardId),
      ...(after?.activeCombat?.discardPile ?? []).map((c) => c.cardId),
      ...(after?.activeCombat?.exhaustPile ?? []).map((c) => c.cardId),
    ];
    expect(ids.filter((id) => id.startsWith('crew-'))).toEqual([]);
    // Real cards survive untouched.
    expect(after?.deckCards.length).toBe(run.deckCards.length);
  });

  it('cleans a run that has no combat in progress', () => {
    useGameStore.getState().startNewRun();
    const run = useGameStore.getState().run;
    if (!run) throw new Error('run');

    useGameStore.getState().importSave(
      makeSave(useGameStore.getState().meta, {
        ...run,
        activeCombat: null,
        deckCards: [...run.deckCards, { cardId: 'crew-penance', level: 0 }],
      }),
    );

    expect(useGameStore.getState().run?.deckCards.map((c) => c.cardId)).not.toContain(
      'crew-penance',
    );
  });
});
