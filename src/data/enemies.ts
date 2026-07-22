import type { EnemyDefinition } from '../engine/combat/types';

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

export const raiderSkiff: EnemyDefinition = {
  id: 'raider-skiff',
  name: 'Raider Skiff',
  maxHull: 38,
  intentPattern: [
    { kind: 'attack', amount: 9 },
    { kind: 'defend', amount: 5 },
    { kind: 'attack', amount: 9 },
    { kind: 'attack', amount: 9 },
  ],
};

export const combatEnemies: EnemyDefinition[] = [scavengerDrone, raiderSkiff];

export const corsairCutter: EnemyDefinition = {
  id: 'corsair-cutter',
  name: 'Corsair Cutter',
  maxHull: 70,
  intentPattern: [
    { kind: 'attack', amount: 12 },
    { kind: 'attack', amount: 12 },
    { kind: 'defend', amount: 15 },
    { kind: 'attack', amount: 20 },
  ],
};

export const eliteEnemies: EnemyDefinition[] = [corsairCutter];

export const voidReaver: EnemyDefinition = {
  id: 'void-reaver',
  name: 'Void Reaver',
  maxHull: 120,
  intentPattern: [
    { kind: 'attack', amount: 10 },
    { kind: 'attack', amount: 10 },
    { kind: 'defend', amount: 15 },
    { kind: 'attack', amount: 10 },
    { kind: 'attack', amount: 10 },
    { kind: 'attack', amount: 25 },
  ],
};

export const bossEnemy: EnemyDefinition = voidReaver;
