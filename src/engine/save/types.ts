import type { CrewProgress } from '../crew/types';
import type { RunState } from '../run/types';

// --- v1 (historical — frozen shape, used only as the v1->v2 migration input) ---

export interface RunStatsV1 {
  runsStarted: number;
  runsWon: number;
  runsLost: number;
  elitesDefeated: number;
}

export interface SaveMetaV1 {
  unlockedCardIds: string[];
  unlockedShipSystemIds: string[];
  milestones: Record<string, boolean>;
  stats: RunStatsV1;
}

export interface SaveDataV1 {
  version: 1;
  meta: SaveMetaV1;
  currentRun: RunState | null;
}

// --- v2 (historical — frozen shape, used only as the v2->v3 migration input) ---

export interface RunStats extends RunStatsV1 {
  bossesDefeated: number;
  highestActReached: number;
}

export interface SaveMetaV2 {
  unlockedCardIds: string[];
  unlockedShipSystemIds: string[];
  milestones: Record<string, boolean>;
  stats: RunStats;
}

export interface SaveDataV2 {
  version: 2;
  meta: SaveMetaV2;
  currentRun: RunState | null;
}

// --- v3 (historical — frozen shape, used only as the v3->v4 migration input) ---

export interface SaveMetaV3 extends SaveMetaV2 {
  /** Lifetime per-crew progress (recruit counts drive dialogue/codex progression). */
  crew: Record<string, CrewProgress>;
}

export interface SaveDataV3 {
  version: 3;
  meta: SaveMetaV3;
  currentRun: RunState | null;
}

// --- v4 (historical — frozen shape, used only as the v4->v5 migration input) ---

export interface SaveMetaV4 extends SaveMetaV3 {
  /** Ids of narrative endings the player has unlocked (see engine/progression/endings). */
  endingsUnlocked: string[];
}

export interface SaveDataV4 {
  version: 4;
  meta: SaveMetaV4;
  currentRun: RunState | null;
}

// --- v5 (current) ---

export interface SaveMetaV5 extends SaveMetaV4 {
  /** The player's chosen starting deck for the next run (exactly LOADOUT_SIZE card ids). */
  loadoutCardIds: string[];
}

export interface SaveDataV5 {
  version: 5;
  meta: SaveMetaV5;
  currentRun: RunState | null;
}

export const CURRENT_SAVE_VERSION = 5;

/** Number of cards in a starting loadout. */
export const LOADOUT_SIZE = 10;

export const EMPTY_STATS: RunStats = {
  runsStarted: 0,
  runsWon: 0,
  runsLost: 0,
  elitesDefeated: 0,
  bossesDefeated: 0,
  highestActReached: 0,
};
