import { EMPTY_STATS, type SaveDataV2 } from './types';

export interface SaveDefaults {
  unlockedCardIds: string[];
  unlockedShipSystemIds: string[];
}

export function createEmptySave(defaults: SaveDefaults): SaveDataV2 {
  return {
    version: 2,
    meta: {
      unlockedCardIds: [...defaults.unlockedCardIds],
      unlockedShipSystemIds: [...defaults.unlockedShipSystemIds],
      milestones: {},
      stats: { ...EMPTY_STATS },
    },
    currentRun: null,
  };
}
