import { describe, expect, it } from 'vitest';
import { createEmptySave } from './schema';

describe('createEmptySave', () => {
  it('seeds meta with the given defaults and zeroed stats', () => {
    const save = createEmptySave({ unlockedCardIds: ['a', 'b'], unlockedShipSystemIds: ['x'] });
    expect(save.version).toBe(2);
    expect(save.meta.unlockedCardIds).toEqual(['a', 'b']);
    expect(save.meta.unlockedShipSystemIds).toEqual(['x']);
    expect(save.meta.milestones).toEqual({});
    expect(save.meta.stats).toEqual({
      runsStarted: 0,
      runsWon: 0,
      runsLost: 0,
      elitesDefeated: 0,
      bossesDefeated: 0,
      highestActReached: 0,
    });
    expect(save.currentRun).toBeNull();
  });

  it('does not share array references with the defaults passed in', () => {
    const defaults = { unlockedCardIds: ['a'], unlockedShipSystemIds: [] };
    const save = createEmptySave(defaults);
    save.meta.unlockedCardIds.push('b');
    expect(defaults.unlockedCardIds).toEqual(['a']);
  });
});
