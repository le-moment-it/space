import { EMPTY_STATS, type SaveDataV6 } from './types';

export interface SaveDefaults {
  unlockedCardIds: string[];
  unlockedShipSystemIds: string[];
  loadoutCardIds: string[];
}

export function createEmptySave(defaults: SaveDefaults): SaveDataV6 {
  return {
    version: 6,
    meta: {
      unlockedCardIds: [...defaults.unlockedCardIds],
      unlockedShipSystemIds: [...defaults.unlockedShipSystemIds],
      milestones: {},
      stats: { ...EMPTY_STATS },
      crew: {},
      endingsUnlocked: [],
      loadoutCards: defaults.loadoutCardIds.map((cardId) => ({ cardId, level: 0 as const })),
    },
    currentRun: null,
  };
}
