import { beforeEach, describe, expect, it } from 'vitest';
import { createEmptySave } from '../engine/save/schema';
import { defaultUnlockedCardIds } from '../data/cards';
import { milestoneDefinitions } from '../data/milestones';
import { TOTAL_ACTS } from '../engine/run/types';
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
        unlockedCardIds: ['kinetic-cannon', 'flak-burst'],
        loadoutCards: [],
      },
      run: null,
      appPhase: 'hub',
    });
  });

  it('adds an unlocked card and refuses an unlocked-but-unknown or locked one', () => {
    const store = () => useGameStore.getState();
    store().addLoadoutCard('kinetic-cannon');
    expect(store().meta.loadoutCards.map((c) => c.cardId)).toEqual(['kinetic-cannon']);

    store().addLoadoutCard('does-not-exist');
    store().addLoadoutCard('plasma-lance'); // real card, but not unlocked here
    expect(store().meta.loadoutCards.map((c) => c.cardId)).toEqual(['kinetic-cannon']);
  });

  it('does not add past the loadout size cap', () => {
    useGameStore.setState((s) => ({
      meta: { ...s.meta, loadoutCards: Array(10).fill({ cardId: 'kinetic-cannon', level: 0 }) },
    }));
    useGameStore.getState().addLoadoutCard('flak-burst');
    expect(useGameStore.getState().meta.loadoutCards).toHaveLength(10);
  });

  it('removes a card by index and can reset to the default loadout', () => {
    useGameStore.setState((s) => ({
      meta: {
        ...s.meta,
        loadoutCards: ['kinetic-cannon', 'flak-burst', 'kinetic-cannon'].map((cardId) => ({
          cardId,
          level: 0 as const,
        })),
      },
    }));
    useGameStore.getState().removeLoadoutCard(1);
    expect(useGameStore.getState().meta.loadoutCards.map((c) => c.cardId)).toEqual([
      'kinetic-cannon',
      'kinetic-cannon',
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
   * Deck screen offers when building a loadout — only milestones unlock cards there.
   */
  it('a card picked as a combat reward does not become permanently unlocked', () => {
    useGameStore.setState((s) => ({
      meta: {
        ...s.meta,
        unlockedCardIds: ['kinetic-cannon'],
        loadoutCards: Array(10).fill({ cardId: 'kinetic-cannon', level: 0 }),
      },
    }));
    useGameStore.getState().startNewRun();
    const run = useGameStore.getState().run;
    if (!run) throw new Error('run should exist after startNewRun');

    const unlockedBefore = [...useGameStore.getState().meta.unlockedCardIds];
    const reward = 'plasma-lance';
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
        unlockedCardIds: ['kinetic-cannon'],
        loadoutCards: Array(10).fill({ cardId: 'kinetic-cannon', level: 0 }),
      },
    }));
    useGameStore.getState().startNewRun();
    const run = useGameStore.getState().run;
    if (!run) throw new Error('run should exist after startNewRun');

    useGameStore.setState({
      run: { ...run, phase: 'cardReward', cardRewardOptions: ['plasma-lance'] },
    });
    useGameStore.getState().chooseCardReward('plasma-lance');
    expect(useGameStore.getState().run?.deckCards.map((c) => c.cardId)).toContain('plasma-lance');

    useGameStore.getState().returnToHub();
    useGameStore.getState().startNewRun();

    expect(useGameStore.getState().run?.deckCards.map((c) => c.cardId)).toEqual(
      Array(10).fill('kinetic-cannon'),
    );
    expect(useGameStore.getState().run?.deckCards.map((c) => c.cardId)).not.toContain(
      'plasma-lance',
    );
  });
});

describe('gameStore — permanent card upgrades', () => {
  const tenCannons = () =>
    Array.from({ length: 10 }, () => ({ cardId: 'kinetic-cannon', level: 0 as const }));

  const startAtBossReward = () => {
    useGameStore.setState((s) => ({
      meta: { ...s.meta, unlockedCardIds: ['kinetic-cannon'], loadoutCards: tenCannons() },
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
      run: { ...run, deckCards: [...run.deckCards, { cardId: 'kinetic-cannon', level: 0 }] },
    });

    useGameStore.getState().chooseCardUpgradeReward(10);

    // Rejected outright — still on the reward screen, nothing upgraded.
    expect(useGameStore.getState().run?.phase).toBe('reward');
    expect(useGameStore.getState().meta.loadoutCards.every((s) => s.level === 0)).toBe(true);
  });

  it('a garage upgrade never touches the loadout', () => {
    useGameStore.setState((s) => ({
      meta: { ...s.meta, unlockedCardIds: ['kinetic-cannon'], loadoutCards: tenCannons() },
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
        unlockedCardIds: ['kinetic-cannon', 'flak-burst'],
        loadoutCards: s.meta.loadoutCards.map((slot, i) =>
          i === 3 ? { cardId: 'flak-burst', level: 0 as const } : slot,
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
      version: 6 as const,
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

describe('gameStore — unearned unlocks are revoked on import', () => {
  beforeEach(() => {
    localStorage.clear();
    useGameStore.setState({ meta: emptyMeta(), run: null, appPhase: 'hub', pendingEndingIds: [] });
  });

  const saveWith = (meta: Partial<ReturnType<typeof emptyMeta>>) => {
    const save = createEmptySave(SAVE_DEFAULTS);
    return { ...save, meta: { ...save.meta, ...meta } };
  };

  it('drops a card no default or completed milestone ever granted', () => {
    // 'overwhelming-barrage' is legendary and gated behind the last milestone.
    useGameStore.getState().importSave(
      saveWith({
        unlockedCardIds: [...defaultUnlockedCardIds, 'overwhelming-barrage'],
      }),
    );

    expect(useGameStore.getState().meta.unlockedCardIds).not.toContain('overwhelming-barrage');
    // The legitimate defaults are untouched.
    expect(useGameStore.getState().meta.unlockedCardIds).toEqual(defaultUnlockedCardIds);
  });

  it('keeps a card the player earned, even one above common', () => {
    const milestone = milestoneDefinitions.find((m) =>
      m.unlocksCardIds.includes('overwhelming-barrage'),
    );
    if (!milestone) throw new Error('expected a milestone to grant overwhelming-barrage');

    useGameStore.getState().importSave(
      saveWith({
        unlockedCardIds: [...defaultUnlockedCardIds, 'overwhelming-barrage'],
        milestones: { [milestone.id]: true },
      }),
    );

    expect(useGameStore.getState().meta.unlockedCardIds).toContain('overwhelming-barrage');
  });

  it('keeps a card whose milestone the stats already satisfy but was never flagged', () => {
    useGameStore.getState().importSave(
      saveWith({
        unlockedCardIds: [...defaultUnlockedCardIds, 'nanite-swarm'],
        milestones: {},
        stats: { ...emptyMeta().stats, elitesDefeated: 99, runsStarted: 99, bossesDefeated: 99 },
      }),
    );

    expect(useGameStore.getState().meta.unlockedCardIds).toContain('nanite-swarm');
  });

  it('drops a revoked card from the loadout so the deck stays buildable', () => {
    useGameStore.getState().importSave(
      saveWith({
        unlockedCardIds: [...defaultUnlockedCardIds, 'master-gunner'],
        loadoutCards: [
          { cardId: 'kinetic-cannon', level: 0 },
          { cardId: 'master-gunner', level: 0 },
        ],
      }),
    );

    const loadout = useGameStore.getState().meta.loadoutCards.map((c) => c.cardId);
    expect(loadout).toEqual(['kinetic-cannon']);
  });
});
