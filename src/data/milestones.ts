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
    unlocksCardIds: ['auto-turret', 'brace-for-impact'],
    unlocksShipSystemIds: ['deflector-array'],
  },
  {
    id: 'defeat-5-elites',
    description: 'Defeat 5 elite hostiles (across all runs).',
    isComplete: (stats) => stats.elitesDefeated >= 5,
    unlocksCardIds: ['ion-torpedo', 'nanite-repair', 'nanite-swarm'],
    unlocksShipSystemIds: ['expanded-cargo-bay'],
  },
  {
    id: 'complete-10-runs',
    description: 'Complete 10 runs, win or lose.',
    isComplete: (stats) => stats.runsStarted >= 10,
    unlocksCardIds: ['sensor-jam', 'reactor-surge', 'emergency-shield-boost', 'triage-primer'],
    unlocksShipSystemIds: ['redundant-systems'],
  },
  {
    id: 'reach-act-2',
    description: 'Reach Act 2.',
    isComplete: (stats) => stats.highestActReached >= 2,
    unlocksCardIds: [
      'pulse-blaster',
      'micro-missiles',
      'twin-autocannons',
      'shield-capacitor',
      'combat-medic',
      'recon-scan',
      'targeting-lock',
      'capacitor-brace',
    ],
    unlocksShipSystemIds: ['shield-capacitor-array', 'overcharged-reactor', 'nano-repair-matrix'],
  },
  {
    id: 'reach-act-3',
    description: 'Reach Act 3.',
    isComplete: (stats) => stats.highestActReached >= 3,
    unlocksCardIds: [
      'railcannon-mk2',
      'graviton-beam',
      'reinforced-plating',
      'emergency-nanites',
      'data-uplink',
      'adrenaline-shot',
      'siphon-beam',
      'corrosive-flak',
    ],
    unlocksShipSystemIds: ['rapid-deployment-bay', 'ablative-plating', 'secondary-reactor'],
  },
  {
    id: 'defeat-3-bosses',
    description: 'Defeat 3 act bosses (across all runs).',
    isComplete: (stats) => stats.bossesDefeated >= 3,
    unlocksCardIds: [
      'siege-cannon',
      'antimatter-charge',
      'field-repair',
      'jamming-pulse',
      'full-repair-kit',
      'aegis-shield',
      'hull-cutter',
      'gunnery-calibration',
    ],
    unlocksShipSystemIds: ['point-defense-grid', 'hardened-bulkheads', 'tertiary-capacitors'],
  },
  {
    id: 'defeat-15-elites',
    description: 'Defeat 15 elite hostiles (across all runs).',
    isComplete: (stats) => stats.elitesDefeated >= 15,
    unlocksCardIds: [
      'shrapnel-volley',
      'needle-array',
      'disable-targeting',
      'last-stand',
      'emp-burst',
      'fusion-core',
      'deflector-tuning',
      'needle-volley',
    ],
    unlocksShipSystemIds: ['auxiliary-databanks', 'emergency-cutoff', 'quantum-buffer'],
  },
  {
    id: 'complete-25-runs',
    description: 'Complete 25 runs, win or lose.',
    isComplete: (stats) => stats.runsStarted >= 25,
    unlocksCardIds: [
      'disruptor-cannon',
      'flechette-spread',
      'boarding-charge',
      'backup-generator',
      'overdrive-coils',
      'capacitor-bank',
      'overwhelming-barrage',
      'master-gunner',
    ],
    unlocksShipSystemIds: ['overclocked-thrusters'],
  },
];
