import { EMPTY_STATS, type SaveDataV4 } from './types';

export interface SaveDefaults {
  unlockedCardIds: string[];
  unlockedShipSystemIds: string[];
}

export function createEmptySave(defaults: SaveDefaults): SaveDataV4 {
  return {
    version: 4,
    meta: {
      unlockedCardIds: [...defaults.unlockedCardIds],
      unlockedShipSystemIds: [...defaults.unlockedShipSystemIds],
      milestones: {},
      stats: { ...EMPTY_STATS },
      crew: {},
      endingsUnlocked: [],
    },
    currentRun: null,
  };
}
