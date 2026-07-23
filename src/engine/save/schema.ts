import { EMPTY_STATS, type SaveDataV3 } from './types';

export interface SaveDefaults {
  unlockedCardIds: string[];
  unlockedShipSystemIds: string[];
}

export function createEmptySave(defaults: SaveDefaults): SaveDataV3 {
  return {
    version: 3,
    meta: {
      unlockedCardIds: [...defaults.unlockedCardIds],
      unlockedShipSystemIds: [...defaults.unlockedShipSystemIds],
      milestones: {},
      stats: { ...EMPTY_STATS },
      crew: {},
    },
    currentRun: null,
  };
}
