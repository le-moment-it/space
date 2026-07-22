import type { MilestoneDefinition } from '../engine/progression/types';

export const milestoneDefinitions: MilestoneDefinition[] = [
  {
    id: 'win-a-run',
    description: 'Defeat the sector boss once.',
    isComplete: (stats) => stats.runsWon >= 1,
    unlocksCardIds: ['auto-turret', 'brace-for-impact'],
    unlocksShipSystemIds: ['deflector-array'],
  },
  {
    id: 'defeat-5-elites',
    description: 'Defeat 5 elite hostiles (across all runs).',
    isComplete: (stats) => stats.elitesDefeated >= 5,
    unlocksCardIds: ['ion-torpedo', 'nanite-repair'],
    unlocksShipSystemIds: ['expanded-cargo-bay'],
  },
  {
    id: 'complete-10-runs',
    description: 'Complete 10 runs, win or lose.',
    isComplete: (stats) => stats.runsStarted >= 10,
    unlocksCardIds: ['sensor-jam', 'reactor-surge', 'emergency-shield-boost'],
    unlocksShipSystemIds: ['redundant-systems'],
  },
];
