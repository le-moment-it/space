import { createEmptySave, type SaveDefaults } from './schema';
import { migrateSave } from './migrate';
import type { SaveDataV3 } from './types';

const STORAGE_KEY = 'space-roguelike:save';

export function loadSave(defaults: SaveDefaults): SaveDataV3 {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createEmptySave(defaults);
    return migrateSave(JSON.parse(raw), defaults);
  } catch {
    return createEmptySave(defaults);
  }
}

export function persistSave(save: SaveDataV3): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(save));
  } catch {
    // Storage unavailable or full — keep playing without persistence rather than crash.
  }
}
