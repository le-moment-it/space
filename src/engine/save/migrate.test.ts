import { describe, expect, it } from 'vitest';
import { migrateSave } from './migrate';
import { createEmptySave } from './schema';
import type { SaveDataV1, SaveDataV2, SaveDataV3, SaveDataV4 } from './types';

const defaults = { unlockedCardIds: ['a', 'b'], unlockedShipSystemIds: ['x'] };

const fullStats = {
  runsStarted: 5,
  runsWon: 2,
  runsLost: 3,
  elitesDefeated: 7,
  bossesDefeated: 2,
  highestActReached: 3,
};

describe('migrateSave', () => {
  it('passes through a valid current-version (v4) save unchanged', () => {
    const valid: SaveDataV4 = {
      version: 4,
      meta: {
        unlockedCardIds: ['a', 'b', 'c'],
        unlockedShipSystemIds: ['x', 'y'],
        milestones: { 'defeat-a-boss': true },
        stats: fullStats,
        crew: { medic: { timesRecruited: 2 } },
        endingsUnlocked: ['first-contact'],
      },
      currentRun: null,
    };
    expect(migrateSave(valid, defaults)).toEqual(valid);
  });

  it('falls back to a fresh save when there is nothing to load (null/undefined)', () => {
    expect(migrateSave(null, defaults)).toEqual(createEmptySave(defaults));
    expect(migrateSave(undefined, defaults)).toEqual(createEmptySave(defaults));
  });

  it('falls back to a fresh save for malformed JSON shapes', () => {
    expect(migrateSave('not an object', defaults)).toEqual(createEmptySave(defaults));
    expect(migrateSave(42, defaults)).toEqual(createEmptySave(defaults));
    expect(migrateSave([], defaults)).toEqual(createEmptySave(defaults));
    expect(migrateSave({ no: 'version field' }, defaults)).toEqual(createEmptySave(defaults));
  });

  it('falls back to a fresh save for a version from the future', () => {
    const fromTheFuture = { version: 99, meta: {}, currentRun: null };
    expect(migrateSave(fromTheFuture, defaults)).toEqual(createEmptySave(defaults));
  });

  it('falls back to a fresh save when a v4 shape is missing required meta fields', () => {
    const incomplete = { version: 4, meta: { unlockedCardIds: ['a'] }, currentRun: null };
    expect(migrateSave(incomplete, defaults)).toEqual(createEmptySave(defaults));
  });

  describe('v3 -> v4 migration', () => {
    const validV3: SaveDataV3 = {
      version: 3,
      meta: {
        unlockedCardIds: ['a', 'b', 'c'],
        unlockedShipSystemIds: ['x', 'y'],
        milestones: { 'defeat-a-boss': true },
        stats: fullStats,
        crew: { medic: { timesRecruited: 2 } },
      },
      currentRun: null,
    };

    it('carries everything over and adds an empty endings list', () => {
      const result = migrateSave(validV3, defaults);
      expect(result.version).toBe(4);
      expect(result.meta.unlockedCardIds).toEqual(validV3.meta.unlockedCardIds);
      expect(result.meta.crew).toEqual(validV3.meta.crew);
      expect(result.meta.stats).toEqual(validV3.meta.stats);
      expect(result.meta.endingsUnlocked).toEqual([]);
    });

    it('leaves an in-progress currentRun untouched (no RunState shape change in v4)', () => {
      const withRun: SaveDataV3 = {
        ...validV3,
        currentRun: {
          act: 2,
          phase: 'map',
          hull: 30,
          crewIds: ['medic'],
        } as unknown as SaveDataV3['currentRun'],
      };
      const result = migrateSave(withRun, defaults);
      expect(result.currentRun).toMatchObject({
        act: 2,
        phase: 'map',
        hull: 30,
        crewIds: ['medic'],
      });
    });
  });

  describe('full v1 -> v4 migration chain', () => {
    const validV1: SaveDataV1 = {
      version: 1,
      meta: {
        unlockedCardIds: ['a', 'b', 'c'],
        unlockedShipSystemIds: ['x', 'y'],
        milestones: { 'win-a-run': true },
        stats: { runsStarted: 5, runsWon: 2, runsLost: 3, elitesDefeated: 7 },
      },
      currentRun: null,
    };

    it('walks a v1 save through every migration to a valid v4 shape', () => {
      const result = migrateSave(validV1, defaults);
      expect(result.version).toBe(4);
      expect(result.meta.unlockedCardIds).toEqual(['a', 'b', 'c']);
      expect(result.meta.milestones).toEqual({ 'win-a-run': true });
      expect(result.meta.stats).toEqual({
        runsStarted: 5,
        runsWon: 2,
        runsLost: 3,
        elitesDefeated: 7,
        bossesDefeated: 0,
        highestActReached: 1,
      });
      expect(result.meta.crew).toEqual({});
      expect(result.meta.endingsUnlocked).toEqual([]);
    });

    it('patches an in-progress v1 currentRun with act and crew fields across the chain', () => {
      const withRun: SaveDataV1 = {
        ...validV1,
        currentRun: { phase: 'map', hull: 30 } as unknown as SaveDataV1['currentRun'],
      };
      const result = migrateSave(withRun, defaults);
      expect(result.currentRun).toMatchObject({
        act: 1,
        phase: 'map',
        hull: 30,
        crewIds: [],
        activeCrewId: null,
      });
    });

    it('falls back to a fresh save when older data along the chain is malformed', () => {
      const malformedV1 = { version: 1, meta: { unlockedCardIds: ['a'] }, currentRun: null };
      const malformedV2 = { version: 2, meta: { unlockedCardIds: ['a'] }, currentRun: null };
      expect(migrateSave(malformedV1, defaults)).toEqual(createEmptySave(defaults));
      expect(migrateSave(malformedV2, defaults)).toEqual(createEmptySave(defaults));
    });
  });

  it('accepts an intermediate v2 save and migrates it forward', () => {
    const validV2: SaveDataV2 = {
      version: 2,
      meta: {
        unlockedCardIds: ['a'],
        unlockedShipSystemIds: ['x'],
        milestones: {},
        stats: fullStats,
      },
      currentRun: null,
    };
    const result = migrateSave(validV2, defaults);
    expect(result.version).toBe(4);
    expect(result.meta.crew).toEqual({});
    expect(result.meta.endingsUnlocked).toEqual([]);
  });
});
