import { beforeEach, describe, expect, it } from 'vitest';
import { createEmptySave } from '../engine/save/schema';
import { TOTAL_ACTS } from '../engine/run/types';
import { useGameStore } from './gameStore';

const emptyMeta = () => createEmptySave({ unlockedCardIds: [], unlockedShipSystemIds: [] }).meta;

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
