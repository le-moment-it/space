import { createEmptySave, type SaveDefaults } from './schema';
import { CURRENT_SAVE_VERSION, type SaveDataV1 } from './types';

type Migration = (data: Record<string, unknown>) => Record<string, unknown>;

// Add entries as new save versions ship, e.g. `1: migrateV1ToV2`. Empty for now — v1 is current.
const MIGRATIONS: Record<number, Migration> = {};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isValidSaveDataV1(data: unknown): data is SaveDataV1 {
  if (!isPlainObject(data) || data.version !== 1) return false;
  const meta = data.meta;
  if (!isPlainObject(meta)) return false;
  return (
    Array.isArray(meta.unlockedCardIds) &&
    Array.isArray(meta.unlockedShipSystemIds) &&
    isPlainObject(meta.milestones) &&
    isPlainObject(meta.stats)
  );
}

/**
 * Validates and migrates arbitrary persisted JSON into the current SaveData shape.
 * Falls back to a fresh save for anything unrecognized — corrupt data, a version
 * from the future, or an old version with no migration path — rather than
 * crashing the app. Losing progress is far better than a broken game.
 */
export function migrateSave(raw: unknown, defaults: SaveDefaults): SaveDataV1 {
  if (!isPlainObject(raw) || typeof raw.version !== 'number') {
    return createEmptySave(defaults);
  }

  let data = raw;
  let version = raw.version;
  while (version < CURRENT_SAVE_VERSION) {
    const migrate = MIGRATIONS[version];
    if (!migrate) return createEmptySave(defaults);
    data = migrate(data);
    version += 1;
  }

  if (version !== CURRENT_SAVE_VERSION || !isValidSaveDataV1(data)) {
    return createEmptySave(defaults);
  }
  return data;
}
