import { EMPTY_STATS, type SaveDataV1 } from './types';

export interface SaveDefaults {
  unlockedCardIds: string[];
  unlockedShipSystemIds: string[];
}

export function createEmptySave(defaults: SaveDefaults): SaveDataV1 {
  return {
    version: 1,
    meta: {
      unlockedCardIds: [...defaults.unlockedCardIds],
      unlockedShipSystemIds: [...defaults.unlockedShipSystemIds],
      milestones: {},
      stats: { ...EMPTY_STATS },
    },
    currentRun: null,
  };
}
