import { createEmptySave, type SaveDefaults } from './schema';
import { migrateSave } from './migrate';
import type { SaveDataV6 } from './types';

const STORAGE_KEY = 'space-roguelike:save';

const union = (owned: string[], defaults: string[]): string[] => [
  ...owned,
  ...defaults.filter((id) => !owned.includes(id)),
];

/**
 * Grants default-unlocked content the save predates.
 *
 * SaveDefaults only seed a *new* save, so a card added to the default-unlocked set
 * later would never reach existing players — their unlock list was frozen at the
 * version they started on. Unioning the defaults in on every load fixes that for
 * every future addition without a save version bump, and is idempotent. Only ever
 * adds: milestone unlocks the player earned are untouched, as is their loadout.
 */
function grantDefaultUnlocks(save: SaveDataV6, defaults: SaveDefaults): SaveDataV6 {
  const unlockedCardIds = union(save.meta.unlockedCardIds, defaults.unlockedCardIds);
  const unlockedShipSystemIds = union(
    save.meta.unlockedShipSystemIds,
    defaults.unlockedShipSystemIds,
  );
  if (
    unlockedCardIds.length === save.meta.unlockedCardIds.length &&
    unlockedShipSystemIds.length === save.meta.unlockedShipSystemIds.length
  ) {
    return save;
  }
  return { ...save, meta: { ...save.meta, unlockedCardIds, unlockedShipSystemIds } };
}

export function loadSave(defaults: SaveDefaults): SaveDataV6 {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const save = raw ? migrateSave(JSON.parse(raw), defaults) : createEmptySave(defaults);
    return grantDefaultUnlocks(save, defaults);
  } catch {
    return createEmptySave(defaults);
  }
}

export function persistSave(save: SaveDataV6): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(save));
  } catch {
    // Storage unavailable or full — keep playing without persistence rather than crash.
  }
}
