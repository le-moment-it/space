import { beforeEach, describe, expect, it } from 'vitest';
import { loadSave, persistSave } from './serialize';
import { createEmptySave } from './schema';

const defaults = { unlockedCardIds: ['a'], unlockedShipSystemIds: ['x'] };

describe('loadSave / persistSave', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns a fresh save when nothing has been persisted yet', () => {
    expect(loadSave(defaults)).toEqual(createEmptySave(defaults));
  });

  it('round-trips a persisted save', () => {
    const save = createEmptySave(defaults);
    save.meta.stats.runsStarted = 5;
    save.meta.unlockedCardIds.push('b');

    persistSave(save);

    expect(loadSave(defaults)).toEqual(save);
  });

  it('falls back to a fresh save when the stored value is corrupt JSON', () => {
    localStorage.setItem('space-roguelike:save', '{not valid json');
    expect(loadSave(defaults)).toEqual(createEmptySave(defaults));
  });

  it('migrates a real v1 payload found in localStorage (e.g. from before this update)', () => {
    const v1Payload = {
      version: 1,
      meta: {
        unlockedCardIds: ['a', 'b'],
        unlockedShipSystemIds: ['x'],
        milestones: {},
        stats: { runsStarted: 2, runsWon: 0, runsLost: 2, elitesDefeated: 1 },
      },
      currentRun: null,
    };
    localStorage.setItem('space-roguelike:save', JSON.stringify(v1Payload));

    const loaded = loadSave(defaults);

    expect(loaded.version).toBe(2);
    expect(loaded.meta.stats).toEqual({
      runsStarted: 2,
      runsWon: 0,
      runsLost: 2,
      elitesDefeated: 1,
      bossesDefeated: 0,
      highestActReached: 1,
    });
  });
});
