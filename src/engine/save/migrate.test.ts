import { describe, expect, it } from 'vitest';
import { migrateSave } from './migrate';
import { createEmptySave } from './schema';
import type { SaveDataV1, SaveDataV2, SaveDataV4, SaveDataV5, SaveDataV6 } from './types';

const defaults = {
  unlockedCardIds: ['a', 'b'],
  unlockedShipSystemIds: ['x'],
  loadoutCardIds: ['a', 'a', 'b'],
};

const fullStats = {
  runsStarted: 5,
  runsWon: 2,
  runsLost: 3,
  elitesDefeated: 7,
  bossesDefeated: 2,
  highestActReached: 3,
};

describe('migrateSave', () => {
  it('passes through a valid current-version (v6) save unchanged', () => {
    const valid: SaveDataV6 = {
      version: 6,
      meta: {
        unlockedCardIds: ['a', 'b', 'c'],
        unlockedShipSystemIds: ['x', 'y'],
        milestones: { 'defeat-a-boss': true },
        stats: fullStats,
        crew: { medic: { timesRecruited: 2 } },
        endingsUnlocked: ['first-contact'],
        loadoutCards: [
          { cardId: 'a', level: 0 },
          { cardId: 'b', level: 1 },
          { cardId: 'c', level: 2 },
        ],
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

  it('falls back to a fresh save when a v5 shape is missing required meta fields', () => {
    const incomplete = { version: 5, meta: { unlockedCardIds: ['a'] }, currentRun: null };
    expect(migrateSave(incomplete, defaults)).toEqual(createEmptySave(defaults));
  });

  describe('v4 -> v6 migration', () => {
    const validV4: SaveDataV4 = {
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

    it('carries everything over and adopts the default loadout', () => {
      const result = migrateSave(validV4, defaults);
      expect(result.version).toBe(6);
      expect(result.meta.unlockedCardIds).toEqual(validV4.meta.unlockedCardIds);
      expect(result.meta.endingsUnlocked).toEqual(validV4.meta.endingsUnlocked);
      expect(result.meta.stats).toEqual(validV4.meta.stats);
      expect(result.meta.loadoutCards).toEqual(
        defaults.loadoutCardIds.map((cardId) => ({ cardId, level: 0 })),
      );
    });

    it('migrates an in-progress currentRun deck into levelled entries', () => {
      const withRun: SaveDataV4 = {
        ...validV4,
        currentRun: {
          act: 2,
          phase: 'map',
          hull: 30,
          crewIds: ['medic'],
        } as unknown as SaveDataV4['currentRun'],
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

  describe('v5 -> v6 migration (card upgrade levels)', () => {
    const validV5: SaveDataV5 = {
      version: 5,
      meta: {
        unlockedCardIds: ['a', 'b'],
        unlockedShipSystemIds: ['x'],
        milestones: {},
        stats: fullStats,
        crew: {},
        endingsUnlocked: [],
        loadoutCardIds: ['a', 'b'],
      },
      currentRun: null,
    };

    it('turns the flat loadout into levelled slots', () => {
      const result = migrateSave(validV5, defaults);
      expect(result.version).toBe(6);
      expect(result.meta.loadoutCards).toEqual([
        { cardId: 'a', level: 0 },
        { cardId: 'b', level: 0 },
      ]);
    });

    it('converts an in-progress deck, tracing the loadout-derived copies to their slots', () => {
      // 11 cards: the first 10 came from the loadout, the 11th was picked up mid-run.
      const deckCardIds = [...Array(10).fill('a'), 'picked-up-mid-run'];
      const withRun = {
        ...validV5,
        currentRun: { phase: 'map', deckCardIds } as unknown as SaveDataV5['currentRun'],
      };

      const deck = migrateSave(withRun, defaults).currentRun?.deckCards ?? [];

      expect(deck).toHaveLength(11);
      expect(deck.every((c) => c.level === 0)).toBe(true);
      // Loadout-derived copies keep their slot, so an act-end upgrade can persist.
      expect(deck.slice(0, 10).map((c) => c.loadoutIndex)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
      // The mid-run pickup has no slot — it is Garage-only by construction.
      expect(deck[10]).toEqual({ cardId: 'picked-up-mid-run', level: 0 });
    });

    it('back-fills levels onto the cards of a fight that was in progress', () => {
      const withCombat = {
        ...validV5,
        currentRun: {
          phase: 'combat',
          deckCardIds: ['a'],
          activeCombat: {
            drawPile: [{ instanceId: 'a#0', cardId: 'a' }],
            hand: [{ instanceId: 'a#1', cardId: 'a' }],
            discardPile: [],
            exhaustPile: [],
          },
        } as unknown as SaveDataV5['currentRun'],
      };

      const combat = migrateSave(withCombat, defaults).currentRun?.activeCombat;

      expect(combat?.drawPile).toEqual([{ instanceId: 'a#0', cardId: 'a', level: 0 }]);
      expect(combat?.hand).toEqual([{ instanceId: 'a#1', cardId: 'a', level: 0 }]);
    });
  });

  describe('full v1 -> v6 migration chain', () => {
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

    it('walks a v1 save through every migration to a valid v6 shape', () => {
      const result = migrateSave(validV1, defaults);
      expect(result.version).toBe(6);
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
      expect(result.meta.loadoutCards).toEqual(
        defaults.loadoutCardIds.map((cardId) => ({ cardId, level: 0 })),
      );
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
    expect(result.version).toBe(6);
    expect(result.meta.crew).toEqual({});
    expect(result.meta.endingsUnlocked).toEqual([]);
    expect(result.meta.loadoutCards).toEqual(
      defaults.loadoutCardIds.map((cardId) => ({ cardId, level: 0 })),
    );
  });
});
