import { describe, expect, it } from 'vitest';
import { migrateSave } from './migrate';
import { createEmptySave } from './schema';
import type { SaveDataV1, SaveDataV2, SaveDataV3 } from './types';

const defaults = { unlockedCardIds: ['a', 'b'], unlockedShipSystemIds: ['x'] };

describe('migrateSave', () => {
  it('passes through a valid current-version (v3) save unchanged', () => {
    const valid: SaveDataV3 = {
      version: 3,
      meta: {
        unlockedCardIds: ['a', 'b', 'c'],
        unlockedShipSystemIds: ['x', 'y'],
        milestones: { 'defeat-a-boss': true },
        stats: {
          runsStarted: 3,
          runsWon: 1,
          runsLost: 2,
          elitesDefeated: 4,
          bossesDefeated: 1,
          highestActReached: 2,
        },
        crew: { medic: { timesRecruited: 2 } },
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

  it('falls back to a fresh save when a v3 shape is missing required meta fields', () => {
    const incomplete = { version: 3, meta: { unlockedCardIds: ['a'] }, currentRun: null };
    expect(migrateSave(incomplete, defaults)).toEqual(createEmptySave(defaults));
  });

  describe('v2 -> v3 migration', () => {
    const validV2: SaveDataV2 = {
      version: 2,
      meta: {
        unlockedCardIds: ['a', 'b', 'c'],
        unlockedShipSystemIds: ['x', 'y'],
        milestones: { 'defeat-a-boss': true },
        stats: {
          runsStarted: 5,
          runsWon: 2,
          runsLost: 3,
          elitesDefeated: 7,
          bossesDefeated: 2,
          highestActReached: 3,
        },
      },
      currentRun: null,
    };

    it('carries everything over and adds an empty crew record', () => {
      const result = migrateSave(validV2, defaults);
      expect(result.version).toBe(3);
      expect(result.meta.unlockedCardIds).toEqual(validV2.meta.unlockedCardIds);
      expect(result.meta.unlockedShipSystemIds).toEqual(validV2.meta.unlockedShipSystemIds);
      expect(result.meta.milestones).toEqual(validV2.meta.milestones);
      expect(result.meta.stats).toEqual(validV2.meta.stats);
      expect(result.meta.crew).toEqual({});
    });

    it('patches an in-progress currentRun with empty crew fields', () => {
      const withRun: SaveDataV2 = {
        ...validV2,
        currentRun: { act: 2, phase: 'map', hull: 30 } as unknown as SaveDataV2['currentRun'],
      };
      const result = migrateSave(withRun, defaults);
      expect(result.currentRun).toMatchObject({
        act: 2,
        phase: 'map',
        hull: 30,
        crewIds: [],
        activeCrewId: null,
      });
    });

    it('falls back to a fresh save when the v2 data itself is malformed', () => {
      const malformed = { version: 2, meta: { unlockedCardIds: ['a'] }, currentRun: null };
      expect(migrateSave(malformed, defaults)).toEqual(createEmptySave(defaults));
    });
  });

  describe('v1 -> v2 -> v3 migration chain', () => {
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

    it('walks a v1 save through both migrations to a valid v3 shape', () => {
      const result = migrateSave(validV1, defaults);
      expect(result.version).toBe(3);
      expect(result.meta.unlockedCardIds).toEqual(['a', 'b', 'c']);
      expect(result.meta.milestones).toEqual({ 'win-a-run': true });
      expect(result.meta.stats).toEqual({
        runsStarted: 5,
        runsWon: 2,
        runsLost: 3,
        elitesDefeated: 7,
        bossesDefeated: 0,
        highestActReached: 1, // runsStarted > 0, so at least act 1 was reached
      });
      expect(result.meta.crew).toEqual({});
    });

    it('sets highestActReached to 0 when no runs were ever started', () => {
      const neverPlayed: SaveDataV1 = {
        ...validV1,
        meta: {
          ...validV1.meta,
          stats: { runsStarted: 0, runsWon: 0, runsLost: 0, elitesDefeated: 0 },
        },
      };
      const result = migrateSave(neverPlayed, defaults);
      expect(result.meta.stats.highestActReached).toBe(0);
    });

    it('patches an in-progress v1 currentRun with both act and crew fields', () => {
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

    it('falls back to a fresh save when the v1 data itself is malformed', () => {
      const malformed = { version: 1, meta: { unlockedCardIds: ['a'] }, currentRun: null };
      expect(migrateSave(malformed, defaults)).toEqual(createEmptySave(defaults));
    });
  });
});
