import { describe, expect, it } from 'vitest';
import { migrateSave } from './migrate';
import { createEmptySave } from './schema';
import type { SaveDataV1, SaveDataV2 } from './types';

const defaults = { unlockedCardIds: ['a', 'b'], unlockedShipSystemIds: ['x'] };

describe('migrateSave', () => {
  it('passes through a valid current-version (v2) save unchanged', () => {
    const valid: SaveDataV2 = {
      version: 2,
      meta: {
        unlockedCardIds: ['a', 'b', 'c'],
        unlockedShipSystemIds: ['x', 'y'],
        milestones: { 'win-a-run': true },
        stats: {
          runsStarted: 3,
          runsWon: 1,
          runsLost: 2,
          elitesDefeated: 4,
          bossesDefeated: 1,
          highestActReached: 2,
        },
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

  it('falls back to a fresh save when a v2 shape is missing required meta fields', () => {
    const incomplete = { version: 2, meta: { unlockedCardIds: ['a'] }, currentRun: null };
    expect(migrateSave(incomplete, defaults)).toEqual(createEmptySave(defaults));
  });

  describe('v1 -> v2 migration', () => {
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

    it('carries over unlocks/milestones/old stats unchanged and adds the new v2 stats', () => {
      const result = migrateSave(validV1, defaults);
      expect(result.version).toBe(2);
      expect(result.meta.unlockedCardIds).toEqual(['a', 'b', 'c']);
      expect(result.meta.unlockedShipSystemIds).toEqual(['x', 'y']);
      expect(result.meta.milestones).toEqual({ 'win-a-run': true });
      expect(result.meta.stats).toEqual({
        runsStarted: 5,
        runsWon: 2,
        runsLost: 3,
        elitesDefeated: 7,
        bossesDefeated: 0,
        highestActReached: 1, // runsStarted > 0, so at least act 1 was reached
      });
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

    it('patches an in-progress currentRun to act 1', () => {
      const withRun: SaveDataV1 = {
        ...validV1,
        currentRun: { phase: 'map', hull: 30 } as unknown as SaveDataV1['currentRun'],
      };
      const result = migrateSave(withRun, defaults);
      expect(result.currentRun).toMatchObject({ act: 1, phase: 'map', hull: 30 });
    });

    it('falls back to a fresh save when the v1 data itself is malformed', () => {
      const malformed = { version: 1, meta: { unlockedCardIds: ['a'] }, currentRun: null };
      expect(migrateSave(malformed, defaults)).toEqual(createEmptySave(defaults));
    });
  });
});
