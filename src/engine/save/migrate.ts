import { XP_AWARDS } from '../progression/level';
import { createEmptySave, type SaveDefaults } from './schema';
import { CURRENT_SAVE_VERSION, LOADOUT_SIZE, type SaveDataV7 } from './types';

type Migration = (data: Record<string, unknown>, defaults: SaveDefaults) => Record<string, unknown>;
type Validator = (data: Record<string, unknown>) => boolean;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasBaseMetaShape(data: Record<string, unknown>): boolean {
  const meta = data.meta;
  if (!isPlainObject(meta)) return false;
  return (
    Array.isArray(meta.unlockedCardIds) &&
    Array.isArray(meta.unlockedShipSystemIds) &&
    isPlainObject(meta.milestones) &&
    isPlainObject(meta.stats)
  );
}

function statsHave(data: Record<string, unknown>, fields: string[]): boolean {
  const meta = data.meta as Record<string, unknown>;
  const stats = meta.stats as Record<string, unknown>;
  return fields.every((field) => typeof stats[field] === 'number');
}

const V1_STAT_FIELDS = ['runsStarted', 'runsWon', 'runsLost', 'elitesDefeated'];
const V2_STAT_FIELDS = [...V1_STAT_FIELDS, 'bossesDefeated', 'highestActReached'];

function isValidSaveDataV1(data: Record<string, unknown>): boolean {
  return data.version === 1 && hasBaseMetaShape(data) && statsHave(data, V1_STAT_FIELDS);
}

function isValidSaveDataV2(data: Record<string, unknown>): boolean {
  return data.version === 2 && hasBaseMetaShape(data) && statsHave(data, V2_STAT_FIELDS);
}

function isValidSaveDataV3(data: Record<string, unknown>): boolean {
  if (data.version !== 3) return false;
  if (!hasBaseMetaShape(data) || !statsHave(data, V2_STAT_FIELDS)) return false;
  const meta = data.meta as Record<string, unknown>;
  return isPlainObject(meta.crew);
}

function isValidSaveDataV4(data: Record<string, unknown>): boolean {
  if (data.version !== 4) return false;
  if (!hasBaseMetaShape(data) || !statsHave(data, V2_STAT_FIELDS)) return false;
  const meta = data.meta as Record<string, unknown>;
  return isPlainObject(meta.crew) && Array.isArray(meta.endingsUnlocked);
}

function isValidSaveDataV5(data: Record<string, unknown>): boolean {
  if (data.version !== 5) return false;
  if (!hasBaseMetaShape(data) || !statsHave(data, V2_STAT_FIELDS)) return false;
  const meta = data.meta as Record<string, unknown>;
  return (
    isPlainObject(meta.crew) &&
    Array.isArray(meta.endingsUnlocked) &&
    Array.isArray(meta.loadoutCardIds)
  );
}

function isValidSaveDataV6(data: unknown): boolean {
  if (!isPlainObject(data) || data.version !== 6) return false;
  if (!hasBaseMetaShape(data) || !statsHave(data, V2_STAT_FIELDS)) return false;
  const meta = data.meta as Record<string, unknown>;
  return (
    isPlainObject(meta.crew) &&
    Array.isArray(meta.endingsUnlocked) &&
    Array.isArray(meta.loadoutCards)
  );
}

function isValidSaveDataV7(data: unknown): data is SaveDataV7 {
  if (!isPlainObject(data) || data.version !== 7) return false;
  if (!hasBaseMetaShape(data) || !statsHave(data, V2_STAT_FIELDS)) return false;
  const meta = data.meta as Record<string, unknown>;
  return (
    isPlainObject(meta.crew) &&
    Array.isArray(meta.endingsUnlocked) &&
    Array.isArray(meta.loadoutCards) &&
    typeof meta.xp === 'number'
  );
}

/**
 * v1 had no multi-act structure and only 4 lifetime stats. v2 adds bossesDefeated
 * and highestActReached, and RunState gained an `act` field. Unlocks/milestones/
 * runsStarted etc. carry over unchanged; an in-progress currentRun is patched to
 * act 1 (v1 saves predate multi-act, so any in-progress run was necessarily in act 1).
 */
function migrateV1ToV2(data: Record<string, unknown>): Record<string, unknown> {
  const meta = data.meta as Record<string, unknown>;
  const stats = meta.stats as Record<string, unknown>;
  const currentRun = data.currentRun as Record<string, unknown> | null;

  return {
    version: 2,
    meta: {
      ...meta,
      stats: {
        ...stats,
        bossesDefeated: 0,
        highestActReached: (stats.runsStarted as number) > 0 ? 1 : 0,
      },
    },
    currentRun: currentRun ? { ...currentRun, act: 1 } : null,
  };
}

/**
 * v3 adds crew: lifetime per-crew recruit counts in meta, and crewIds/activeCrewId
 * on RunState. An in-progress v2 run predates crew, so it simply has none aboard.
 */
function migrateV2ToV3(data: Record<string, unknown>): Record<string, unknown> {
  const meta = data.meta as Record<string, unknown>;
  const currentRun = data.currentRun as Record<string, unknown> | null;

  return {
    version: 3,
    meta: { ...meta, crew: {} },
    currentRun: currentRun ? { ...currentRun, crewIds: [], activeCrewId: null } : null,
  };
}

/**
 * v4 adds narrative endings: a list of unlocked ending ids in meta. Nothing on
 * RunState changes, so an in-progress run carries over untouched.
 */
function migrateV3ToV4(data: Record<string, unknown>): Record<string, unknown> {
  const meta = data.meta as Record<string, unknown>;
  return {
    version: 4,
    meta: { ...meta, endingsUnlocked: [] },
    currentRun: data.currentRun ?? null,
  };
}

/**
 * v5 adds a customizable starting loadout in meta. Existing saves adopt the
 * default loadout (they were playing the fixed starting deck until now).
 */
function migrateV4ToV5(
  data: Record<string, unknown>,
  defaults: SaveDefaults,
): Record<string, unknown> {
  const meta = data.meta as Record<string, unknown>;
  return {
    version: 5,
    meta: { ...meta, loadoutCardIds: [...defaults.loadoutCardIds] },
    currentRun: data.currentRun ?? null,
  };
}

/**
 * v6 gives every card copy its own upgrade level, so flat id lists become entry
 * objects: the loadout gains levels, and an in-progress run's deck does too.
 *
 * A migrated deck's first LOADOUT_SIZE entries are tagged with their loadout slot:
 * a v5 deck was built from the loadout in order and only ever appended to, so the
 * mapping holds. The store re-checks the card id before writing any permanent
 * upgrade, so a wrong guess degrades to a run-only upgrade rather than corrupting
 * a slot. Combat piles in flight are back-filled to level 0.
 */
function migrateV5ToV6(data: Record<string, unknown>): Record<string, unknown> {
  const meta = data.meta as Record<string, unknown>;
  const loadoutCardIds = (meta.loadoutCardIds as string[] | undefined) ?? [];
  const { loadoutCardIds: _dropped, ...restMeta } = meta;

  const currentRun = data.currentRun as Record<string, unknown> | null;
  let migratedRun = currentRun;
  if (currentRun) {
    const deckCardIds = (currentRun.deckCardIds as string[] | undefined) ?? [];
    const { deckCardIds: _oldDeck, ...restRun } = currentRun;
    const combat = currentRun.activeCombat as Record<string, unknown> | null;
    migratedRun = {
      ...restRun,
      deckCards: deckCardIds.map((cardId, i) => ({
        cardId,
        level: 0,
        ...(i < LOADOUT_SIZE ? { loadoutIndex: i } : {}),
      })),
      activeCombat: combat ? withLeveledPiles(combat) : combat,
    };
  }

  return {
    version: 6,
    meta: { ...restMeta, loadoutCards: loadoutCardIds.map((cardId) => ({ cardId, level: 0 })) },
    currentRun: migratedRun,
  };
}

/** Back-fills level 0 onto every CardInstance of an in-flight combat. */
function withLeveledPiles(combat: Record<string, unknown>): Record<string, unknown> {
  const piles = ['drawPile', 'hand', 'discardPile', 'exhaustPile'] as const;
  const patched: Record<string, unknown> = { ...combat };
  for (const pile of piles) {
    const cards = combat[pile];
    if (Array.isArray(cards)) {
      patched[pile] = cards.map((c) => ({ ...(c as object), level: 0 }));
    }
  }
  return patched;
}

/**
 * v7 replaces milestones with a commander level driven by lifetime XP.
 *
 * Existing progress is credited rather than reset: a player's recorded elite and boss
 * kills are paid at the new per-encounter rates, and each run started is credited with
 * a run's worth of ordinary fights — which were never counted, so this is the closest
 * honest estimate. Their unlocked cards are untouched, and unlocks are additive from
 * here, so nothing they earned can be taken away.
 */
function migrateV6ToV7(data: Record<string, unknown>): Record<string, unknown> {
  const meta = data.meta as Record<string, unknown>;
  const stats = (meta.stats ?? {}) as Record<string, number>;
  const xp =
    (stats.elitesDefeated ?? 0) * XP_AWARDS.elite +
    (stats.bossesDefeated ?? 0) * XP_AWARDS.boss +
    (stats.runsStarted ?? 0) * 60;

  return {
    version: 7,
    meta: { ...meta, xp },
    currentRun: data.currentRun ?? null,
  };
}

// All keyed by the version being migrated FROM.
const VALIDATORS: Record<number, Validator> = {
  1: isValidSaveDataV1,
  2: isValidSaveDataV2,
  3: isValidSaveDataV3,
  4: isValidSaveDataV4,
  5: isValidSaveDataV5,
  6: isValidSaveDataV6,
};
const MIGRATIONS: Record<number, Migration> = {
  1: migrateV1ToV2,
  2: migrateV2ToV3,
  3: migrateV3ToV4,
  4: migrateV4ToV5,
  5: migrateV5ToV6,
  6: migrateV6ToV7,
};

/**
 * Validates and migrates arbitrary JSON into the current SaveData shape, or returns
 * null if it isn't a save at all — corrupt data, a version from the future, an old
 * version that doesn't match its own expected shape, or one with no migration path.
 *
 * Separate from `migrateSave` because the two callers want opposite things from a
 * rejection. Loading from localStorage wants to shrug and carry on; importing a file
 * the player picked must be able to say "that isn't a save", which it cannot do if a
 * rejection is indistinguishable from successfully importing a brand-new profile.
 */
export function tryMigrateSave(raw: unknown, defaults: SaveDefaults): SaveDataV7 | null {
  if (!isPlainObject(raw) || typeof raw.version !== 'number') return null;

  let data: Record<string, unknown> = raw;
  let version = raw.version;
  while (version < CURRENT_SAVE_VERSION) {
    const validate = VALIDATORS[version];
    const migrate = MIGRATIONS[version];
    if (!validate || !migrate || !validate(data)) return null;
    data = migrate(data, defaults);
    version = (data.version as number | undefined) ?? version + 1;
  }

  return isValidSaveDataV7(data) ? data : null;
}

/**
 * Validates and migrates arbitrary persisted JSON into the current SaveData shape.
 * Falls back to a fresh save for anything unrecognized rather than crashing the app.
 * Losing progress is far better than a broken game.
 */
export function migrateSave(raw: unknown, defaults: SaveDefaults): SaveDataV7 {
  return tryMigrateSave(raw, defaults) ?? createEmptySave(defaults);
}
