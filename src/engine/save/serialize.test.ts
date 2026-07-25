import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearSave,
  dropUnusableRun,
  loadSave,
  makeSave,
  parseSave,
  persistSave,
} from './serialize';
import { createEmptySave } from './schema';
import type { RunState } from '../run/types';

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
    expect(loaded.meta.loadoutCards).toEqual(save.meta.loadoutCards);
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

    expect(loaded.version).toBe(7);
    expect(loaded.meta.crew).toEqual({});
    expect(loaded.meta.endingsUnlocked).toEqual([]);
    expect(loaded.meta.loadoutCards).toEqual(
      defaults.loadoutCardIds.map((cardId) => ({ cardId, level: 0 })),
    );
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

describe('clearSave', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('empties the stored save so the next load starts fresh', () => {
    const save = createEmptySave(defaults);
    save.meta.stats.runsWon = 9;
    persistSave(save);

    clearSave();

    expect(localStorage.getItem('space-roguelike:save')).toBeNull();
    expect(loadSave(defaults)).toEqual(createEmptySave(defaults));
  });
});

describe('parseSave', () => {
  it('round-trips what persistSave writes', () => {
    const save = createEmptySave(defaults);
    save.meta.stats.runsWon = 3;
    expect(parseSave(JSON.stringify(save), defaults)).toEqual(save);
  });

  it('migrates an export taken from an older build', () => {
    const v5 = {
      version: 5,
      meta: {
        unlockedCardIds: ['a'],
        unlockedShipSystemIds: ['x'],
        milestones: {},
        stats: {
          runsStarted: 1,
          runsWon: 1,
          runsLost: 0,
          elitesDefeated: 0,
          bossesDefeated: 1,
          highestActReached: 3,
        },
        crew: {},
        endingsUnlocked: [],
        loadoutCardIds: ['a'],
      },
      currentRun: null,
    };

    const parsed = parseSave(JSON.stringify(v5), defaults);

    expect(parsed?.version).toBe(7);
    expect(parsed?.meta.loadoutCards).toEqual([{ cardId: 'a', level: 0 }]);
  });

  it('grants default unlocks the imported file predates', () => {
    const save = createEmptySave(defaults);
    const parsed = parseSave(JSON.stringify(save), {
      ...defaults,
      unlockedCardIds: ['a', 'brand-new'],
    });
    expect(parsed?.meta.unlockedCardIds).toContain('brand-new');
  });

  // The point of parseSave over migrateSave: rejection has to be distinguishable from
  // a successful import, or Import silently becomes a second Reset button.
  it.each([
    ['not JSON at all', '{not valid json'],
    ['JSON that is not an object', '"hello"'],
    ['an object with no version', '{"meta":{}}'],
    ['a version from the future', '{"version":99,"meta":{},"currentRun":null}'],
    [
      'a structurally broken save',
      '{"version":5,"meta":{"unlockedCardIds":["a"]},"currentRun":null}',
    ],
  ])('returns null for %s', (_label, raw) => {
    expect(parseSave(raw, defaults)).toBeNull();
  });
});

describe('dropUnusableRun', () => {
  const withRun = (currentRun: unknown) => ({
    ...createEmptySave(defaults),
    currentRun: currentRun as RunState | null,
  });

  it('keeps a structurally sound run', () => {
    const run = { map: { nodes: [] }, deckCards: [], phase: 'map' };
    expect(dropUnusableRun(withRun(run)).currentRun).toEqual(run);
  });

  it.each([
    ['no map', { deckCards: [], phase: 'map' }],
    ['a null map', { map: null, deckCards: [], phase: 'map' }],
    ['no deck', { map: {}, phase: 'map' }],
    ['no phase', { map: {}, deckCards: [] }],
  ])('drops a run with %s, keeping the rest of the save', (_label, run) => {
    const save = withRun(run);
    save.meta.stats.runsWon = 4;

    const cleaned = dropUnusableRun(save);

    expect(cleaned.currentRun).toBeNull();
    expect(cleaned.meta.stats.runsWon).toBe(4);
  });

  it('leaves a save with no run alone', () => {
    const save = withRun(null);
    expect(dropUnusableRun(save)).toBe(save);
  });
});

describe('makeSave', () => {
  it('stamps the current version', () => {
    const meta = createEmptySave(defaults).meta;
    expect(makeSave(meta, null)).toEqual({ version: 7, meta, currentRun: null });
  });
});
