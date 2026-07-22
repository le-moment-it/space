import { describe, expect, it } from 'vitest';
import { migrateSave } from './migrate';
import { createEmptySave } from './schema';
import type { SaveDataV1 } from './types';

const defaults = { unlockedCardIds: ['a', 'b'], unlockedShipSystemIds: ['x'] };

describe('migrateSave', () => {
  it('passes through a valid current-version save unchanged', () => {
    const valid: SaveDataV1 = {
      version: 1,
      meta: {
        unlockedCardIds: ['a', 'b', 'c'],
        unlockedShipSystemIds: ['x', 'y'],
        milestones: { 'win-a-run': true },
        stats: { runsStarted: 3, runsWon: 1, runsLost: 2, elitesDefeated: 4 },
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

  it('falls back to a fresh save when the shape is missing required meta fields', () => {
    const incomplete = { version: 1, meta: { unlockedCardIds: ['a'] }, currentRun: null };
    expect(migrateSave(incomplete, defaults)).toEqual(createEmptySave(defaults));
  });
});
