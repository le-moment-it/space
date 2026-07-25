import { CURRENT_SAVE_VERSION, EMPTY_STATS, type SaveDataV7 } from './types';

export interface SaveDefaults {
  unlockedCardIds: string[];
  unlockedShipSystemIds: string[];
  loadoutCardIds: string[];
}

export function createEmptySave(defaults: SaveDefaults): SaveDataV7 {
  return {
    version: CURRENT_SAVE_VERSION,
    meta: {
      unlockedCardIds: [...defaults.unlockedCardIds],
      unlockedShipSystemIds: [...defaults.unlockedShipSystemIds],
      milestones: {},
      xp: 0,
      stats: { ...EMPTY_STATS },
      crew: {},
      endingsUnlocked: [],
      loadoutCards: defaults.loadoutCardIds.map((cardId) => ({ cardId, level: 0 as const })),
    },
    currentRun: null,
  };
}
