import { createEmptySave, type SaveDefaults } from './schema';
import { CURRENT_SAVE_VERSION, type SaveDataV2 } from './types';

type Migration = (data: Record<string, unknown>) => Record<string, unknown>;
type Validator = (data: Record<string, unknown>) => boolean;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isValidSaveDataV1(data: Record<string, unknown>): boolean {
  if (data.version !== 1) return false;
  const meta = data.meta;
  if (!isPlainObject(meta)) return false;
  if (
    !Array.isArray(meta.unlockedCardIds) ||
    !Array.isArray(meta.unlockedShipSystemIds) ||
    !isPlainObject(meta.milestones) ||
    !isPlainObject(meta.stats)
  ) {
    return false;
  }
  const stats = meta.stats;
  return (
    typeof stats.runsStarted === 'number' &&
    typeof stats.runsWon === 'number' &&
    typeof stats.runsLost === 'number' &&
    typeof stats.elitesDefeated === 'number'
  );
}

function isValidSaveDataV2(data: unknown): data is SaveDataV2 {
  if (!isPlainObject(data) || data.version !== 2) return false;
  const meta = data.meta;
  if (!isPlainObject(meta)) return false;
  if (
    !Array.isArray(meta.unlockedCardIds) ||
    !Array.isArray(meta.unlockedShipSystemIds) ||
    !isPlainObject(meta.milestones) ||
    !isPlainObject(meta.stats)
  ) {
    return false;
  }
  const stats = meta.stats;
  return (
    typeof stats.runsStarted === 'number' &&
    typeof stats.runsWon === 'number' &&
    typeof stats.runsLost === 'number' &&
    typeof stats.elitesDefeated === 'number' &&
    typeof stats.bossesDefeated === 'number' &&
    typeof stats.highestActReached === 'number'
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

// Both keyed by the version being migrated FROM.
const VALIDATORS: Record<number, Validator> = { 1: isValidSaveDataV1 };
const MIGRATIONS: Record<number, Migration> = { 1: migrateV1ToV2 };

/**
 * Validates and migrates arbitrary persisted JSON into the current SaveData shape.
 * Falls back to a fresh save for anything unrecognized — corrupt data, a version
 * from the future, an old version that doesn't even match its own expected shape,
 * or an old version with no migration path — rather than crashing the app. Losing
 * progress is far better than a broken game.
 */
export function migrateSave(raw: unknown, defaults: SaveDefaults): SaveDataV2 {
  if (!isPlainObject(raw) || typeof raw.version !== 'number') {
    return createEmptySave(defaults);
  }

  let data: Record<string, unknown> = raw;
  let version = raw.version;
  while (version < CURRENT_SAVE_VERSION) {
    const validate = VALIDATORS[version];
    const migrate = MIGRATIONS[version];
    if (!validate || !migrate || !validate(data)) return createEmptySave(defaults);
    data = migrate(data);
    version = (data.version as number | undefined) ?? version + 1;
  }

  if (!isValidSaveDataV2(data)) {
    return createEmptySave(defaults);
  }
  return data;
}
