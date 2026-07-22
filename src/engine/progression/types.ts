import type { RunStats } from '../save/types';

export interface MilestoneDefinition {
  id: string;
  description: string;
  isComplete: (stats: RunStats) => boolean;
  unlocksCardIds: string[];
  unlocksShipSystemIds: string[];
}
