import { beforeEach, describe, expect, it } from 'vitest';
import { loadSave, persistSave } from './serialize';
import { createEmptySave } from './schema';

const defaults = {
  unlockedCardIds: ['a'],
  unlockedShipSystemIds: ['x'],
  loadoutCardIds: ['a'],
};

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

  it('grants default-unlocked content added after the save was written', () => {
    const save = createEmptySave(defaults);
    save.meta.unlockedCardIds.push('earned-from-a-milestone');
    persistSave(save);

    // A later build ships a new card that is unlocked from the start.
    const withNewCard = { ...defaults, unlockedCardIds: ['a', 'brand-new'] };
    const loaded = loadSave(withNewCard);

    expect(loaded.meta.unlockedCardIds).toContain('brand-new');
    // Existing unlocks survive — this only ever adds.
    expect(loaded.meta.unlockedCardIds).toContain('earned-from-a-milestone');
    expect(loaded.meta.unlockedCardIds).toContain('a');
    // The player's chosen loadout is never touched.
    expect(loaded.meta.loadoutCardIds).toEqual(save.meta.loadoutCardIds);
  });

  it('grants newly default-unlocked ship systems too', () => {
    persistSave(createEmptySave(defaults));
    const loaded = loadSave({ ...defaults, unlockedShipSystemIds: ['x', 'new-system'] });
    expect(loaded.meta.unlockedShipSystemIds).toEqual(['x', 'new-system']);
  });

  it('does not duplicate defaults the save already has', () => {
    persistSave(createEmptySave(defaults));
    const loaded = loadSave(defaults);
    expect(loaded.meta.unlockedCardIds).toEqual(['a']);
    expect(loaded.meta.unlockedShipSystemIds).toEqual(['x']);
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

    expect(loaded.version).toBe(5);
    expect(loaded.meta.crew).toEqual({});
    expect(loaded.meta.endingsUnlocked).toEqual([]);
    expect(loaded.meta.loadoutCardIds).toEqual(defaults.loadoutCardIds);
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
