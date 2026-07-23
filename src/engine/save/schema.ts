import { EMPTY_STATS, type SaveDataV5 } from './types';

export interface SaveDefaults {
  unlockedCardIds: string[];
  unlockedShipSystemIds: string[];
  loadoutCardIds: string[];
}

export function createEmptySave(defaults: SaveDefaults): SaveDataV5 {
  return {
    version: 5,
    meta: {
      unlockedCardIds: [...defaults.unlockedCardIds],
      unlockedShipSystemIds: [...defaults.unlockedShipSystemIds],
      milestones: {},
      stats: { ...EMPTY_STATS },
      crew: {},
      endingsUnlocked: [],
      loadoutCardIds: [...defaults.loadoutCardIds],
    },
    currentRun: null,
  };
}
