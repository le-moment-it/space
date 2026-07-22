import type { RunState } from '../run/types';

export interface RunStats {
  runsStarted: number;
  runsWon: number;
  runsLost: number;
  elitesDefeated: number;
}

export interface SaveMetaV1 {
  unlockedCardIds: string[];
  unlockedShipSystemIds: string[];
  milestones: Record<string, boolean>;
  stats: RunStats;
}

export interface SaveDataV1 {
  version: 1;
  meta: SaveMetaV1;
  currentRun: RunState | null;
}

export const CURRENT_SAVE_VERSION = 1;

export const EMPTY_STATS: RunStats = {
  runsStarted: 0,
  runsWon: 0,
  runsLost: 0,
  elitesDefeated: 0,
};
