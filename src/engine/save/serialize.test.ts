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
});
