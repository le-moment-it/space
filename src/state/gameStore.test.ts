import { beforeEach, describe, expect, it } from 'vitest';
import { createEmptySave } from '../engine/save/schema';
import { TOTAL_ACTS } from '../engine/run/types';
import { useGameStore } from './gameStore';

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
        loadoutCardIds: [],
      },
      run: null,
      appPhase: 'hub',
    });
  });

  it('adds an unlocked card and refuses an unlocked-but-unknown or locked one', () => {
    const store = () => useGameStore.getState();
    store().addLoadoutCard('kinetic-cannon');
    expect(store().meta.loadoutCardIds).toEqual(['kinetic-cannon']);

    store().addLoadoutCard('does-not-exist');
    store().addLoadoutCard('plasma-lance'); // real card, but not unlocked here
    expect(store().meta.loadoutCardIds).toEqual(['kinetic-cannon']);
  });

  it('does not add past the loadout size cap', () => {
    useGameStore.setState((s) => ({
      meta: { ...s.meta, loadoutCardIds: Array(10).fill('kinetic-cannon') },
    }));
    useGameStore.getState().addLoadoutCard('flak-burst');
    expect(useGameStore.getState().meta.loadoutCardIds).toHaveLength(10);
  });

  it('removes a card by index and can reset to the default loadout', () => {
    useGameStore.setState((s) => ({
      meta: { ...s.meta, loadoutCardIds: ['kinetic-cannon', 'flak-burst', 'kinetic-cannon'] },
    }));
    useGameStore.getState().removeLoadoutCard(1);
    expect(useGameStore.getState().meta.loadoutCardIds).toEqual([
      'kinetic-cannon',
      'kinetic-cannon',
    ]);

    useGameStore.getState().resetLoadout();
    expect(useGameStore.getState().meta.loadoutCardIds).toHaveLength(10);
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
        loadoutCardIds: Array(10).fill('kinetic-cannon'),
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
    expect(useGameStore.getState().run?.deckCardIds).toContain(reward);
    // ...but the permanent collection is untouched.
    expect(useGameStore.getState().meta.unlockedCardIds).toEqual(unlockedBefore);
    expect(useGameStore.getState().meta.loadoutCardIds).not.toContain(reward);
  });

  it('the next run starts from the saved loadout, without last run’s pickups', () => {
    useGameStore.setState((s) => ({
      meta: {
        ...s.meta,
        unlockedCardIds: ['kinetic-cannon'],
        loadoutCardIds: Array(10).fill('kinetic-cannon'),
      },
    }));
    useGameStore.getState().startNewRun();
    const run = useGameStore.getState().run;
    if (!run) throw new Error('run should exist after startNewRun');

    useGameStore.setState({
      run: { ...run, phase: 'cardReward', cardRewardOptions: ['plasma-lance'] },
    });
    useGameStore.getState().chooseCardReward('plasma-lance');
    expect(useGameStore.getState().run?.deckCardIds).toContain('plasma-lance');

    useGameStore.getState().returnToHub();
    useGameStore.getState().startNewRun();

    expect(useGameStore.getState().run?.deckCardIds).toEqual(Array(10).fill('kinetic-cannon'));
    expect(useGameStore.getState().run?.deckCardIds).not.toContain('plasma-lance');
  });
});
