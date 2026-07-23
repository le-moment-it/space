import { createEmptySave, type SaveDefaults } from './schema';
import { CURRENT_SAVE_VERSION, type SaveDataV5 } from './types';

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

function isValidSaveDataV5(data: unknown): data is SaveDataV5 {
  if (!isPlainObject(data) || data.version !== 5) return false;
  if (!hasBaseMetaShape(data) || !statsHave(data, V2_STAT_FIELDS)) return false;
  const meta = data.meta as Record<string, unknown>;
  return (
    isPlainObject(meta.crew) &&
    Array.isArray(meta.endingsUnlocked) &&
    Array.isArray(meta.loadoutCardIds)
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

// All keyed by the version being migrated FROM.
const VALIDATORS: Record<number, Validator> = {
  1: isValidSaveDataV1,
  2: isValidSaveDataV2,
  3: isValidSaveDataV3,
  4: isValidSaveDataV4,
};
const MIGRATIONS: Record<number, Migration> = {
  1: migrateV1ToV2,
  2: migrateV2ToV3,
  3: migrateV3ToV4,
  4: migrateV4ToV5,
};

/**
 * Validates and migrates arbitrary persisted JSON into the current SaveData shape.
 * Falls back to a fresh save for anything unrecognized — corrupt data, a version
 * from the future, an old version that doesn't even match its own expected shape,
 * or an old version with no migration path — rather than crashing the app. Losing
 * progress is far better than a broken game.
 */
export function migrateSave(raw: unknown, defaults: SaveDefaults): SaveDataV5 {
  if (!isPlainObject(raw) || typeof raw.version !== 'number') {
    return createEmptySave(defaults);
  }

  let data: Record<string, unknown> = raw;
  let version = raw.version;
  while (version < CURRENT_SAVE_VERSION) {
    const validate = VALIDATORS[version];
    const migrate = MIGRATIONS[version];
    if (!validate || !migrate || !validate(data)) return createEmptySave(defaults);
    data = migrate(data, defaults);
    version = (data.version as number | undefined) ?? version + 1;
  }

  if (!isValidSaveDataV5(data)) {
    return createEmptySave(defaults);
  }
  return data;
}
