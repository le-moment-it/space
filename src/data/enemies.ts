import type { EnemyDefinition } from '../engine/combat/types';

/** M1's single dummy enemy: a fixed, telegraphed attack pattern to validate combat feel. */
export const scavengerDrone: EnemyDefinition = {
  id: 'scavenger-drone',
  name: 'Scavenger Drone',
  maxHull: 45,
  intentPattern: [
    { kind: 'attack', amount: 6 },
    { kind: 'attack', amount: 6 },
    { kind: 'defend', amount: 8 },
    { kind: 'attack', amount: 14 },
  ],
};
