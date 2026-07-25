import type { RunState } from '../run/types';
import { createEmptySave, type SaveDefaults } from './schema';
import { tryMigrateSave } from './migrate';
import { CURRENT_SAVE_VERSION, type SaveDataV6, type SaveMetaV6 } from './types';

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

/** The on-disk payload. The one place that decides what a written save looks like. */
export function makeSave(meta: SaveMetaV6, currentRun: RunState | null): SaveDataV6 {
  return { version: CURRENT_SAVE_VERSION, meta, currentRun };
}

/**
 * Parses save JSON from anywhere — localStorage or a file the player picked —
 * returning null if it isn't a save. Migration and default-unlock grants apply
 * either way, so an export taken from an older build still loads.
 */
export function parseSave(raw: string, defaults: SaveDefaults): SaveDataV6 | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  const save = tryMigrateSave(parsed, defaults);
  return save && grantDefaultUnlocks(save, defaults);
}

/**
 * Drops an in-progress run that isn't structurally sound, keeping the rest of the save.
 *
 * Only for imports. Save validation deliberately never inspects `currentRun`, which is
 * fine for data this game wrote, but an imported file can be truncated or hand-edited —
 * and a run missing its map crashes the run screen on the very next render. Losing an
 * unfinished run and landing in the hub is a far better failure than a white page.
 */
export function dropUnusableRun(save: SaveDataV6): SaveDataV6 {
  const run = save.currentRun as Record<string, unknown> | null;
  if (run === null) return save;
  const usable =
    typeof run === 'object' &&
    typeof run.map === 'object' &&
    run.map !== null &&
    Array.isArray(run.deckCards) &&
    typeof run.phase === 'string';
  return usable ? save : { ...save, currentRun: null };
}

export function loadSave(defaults: SaveDefaults): SaveDataV6 {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const save = raw ? parseSave(raw, defaults) : null;
    return save ?? createEmptySave(defaults);
  } catch {
    // localStorage itself threw (private mode, blocked storage).
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

/** Wipes the stored save. The store then writes a fresh one, so this is belt-and-braces. */
export function clearSave(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage unavailable — the in-memory reset still stands.
  }
}
