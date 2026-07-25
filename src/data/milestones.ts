import type { MilestoneDefinition } from '../engine/progression/types';

/**
 * Roughly ordered by how long each takes to reach. Card rarity tracks that order:
 * Rares appear from the early milestones, Epics from the mid-game ones, and the two
 * Legendaries sit on the last. Nothing above Common is unlocked by default — see
 * `defaultUnlockedCardIds`.
 */
export const milestoneDefinitions: MilestoneDefinition[] = [
  {
    id: 'defeat-a-boss',
    description: 'Defeat a sector boss once.',
    isComplete: (stats) => stats.bossesDefeated >= 1,
    unlocksCardIds: ['backup-generator', 'overdrive-coils'],
    unlocksShipSystemIds: ['deflector-array'],
  },
  {
    id: 'defeat-5-elites',
    description: 'Defeat 5 elite hostiles (across all runs).',
    isComplete: (stats) => stats.elitesDefeated >= 5,
    unlocksCardIds: ['disruptor-cannon', 'nanite-repair', 'nanite-swarm'],
    unlocksShipSystemIds: ['expanded-cargo-bay'],
  },
  {
    id: 'complete-10-runs',
    description: 'Complete 10 runs, win or lose.',
    isComplete: (stats) => stats.runsStarted >= 10,
    unlocksCardIds: ['emergency-shield-boost', 'data-uplink', 'triage-primer'],
    unlocksShipSystemIds: ['redundant-systems'],
  },
  {
    id: 'reach-act-2',
    description: 'Reach Act 2.',
    isComplete: (stats) => stats.highestActReached >= 2,
    unlocksCardIds: ['jamming-pulse', 'capacitor-bank', 'targeting-lock', 'capacitor-brace'],
    unlocksShipSystemIds: ['shield-capacitor-array', 'overcharged-reactor', 'nano-repair-matrix'],
  },
  {
    id: 'reach-act-3',
    description: 'Reach Act 3.',
    isComplete: (stats) => stats.highestActReached >= 3,
    unlocksCardIds: ['siege-cannon', 'full-repair-kit', 'siphon-beam', 'corrosive-flak'],
    unlocksShipSystemIds: ['rapid-deployment-bay', 'ablative-plating', 'secondary-reactor'],
  },
  {
    id: 'defeat-3-bosses',
    description: 'Defeat 3 act bosses (across all runs).',
    isComplete: (stats) => stats.bossesDefeated >= 3,
    unlocksCardIds: ['aegis-shield', 'hull-cutter', 'gunnery-calibration'],
    unlocksShipSystemIds: ['point-defense-grid', 'hardened-bulkheads', 'tertiary-capacitors'],
  },
  {
    id: 'defeat-15-elites',
    description: 'Defeat 15 elite hostiles (across all runs).',
    isComplete: (stats) => stats.elitesDefeated >= 15,
    unlocksCardIds: ['deflector-tuning', 'needle-volley'],
    unlocksShipSystemIds: ['auxiliary-databanks', 'emergency-cutoff', 'quantum-buffer'],
  },
  {
    id: 'complete-25-runs',
    description: 'Complete 25 runs, win or lose.',
    isComplete: (stats) => stats.runsStarted >= 25,
    unlocksCardIds: ['overwhelming-barrage', 'master-gunner'],
    unlocksShipSystemIds: ['overclocked-thrusters'],
  },
];
