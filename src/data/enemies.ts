import { scaleEnemy } from '../engine/combat/scaleEnemy';
import type { EnemyDefinition } from '../engine/combat/types';

// --- Combat enemies (10 designs, reused across all 3 acts at increasing scale) ---

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

export const mineLayer: EnemyDefinition = {
  id: 'mine-layer',
  name: 'Mine Layer',
  maxHull: 32,
  intentPattern: [
    { kind: 'defend', amount: 10 },
    { kind: 'attack', amount: 11 },
    { kind: 'attack', amount: 11 },
    { kind: 'attack', amount: 11 },
  ],
};

export const boardingPod: EnemyDefinition = {
  id: 'boarding-pod',
  name: 'Boarding Pod',
  maxHull: 40,
  intentPattern: [
    { kind: 'attack', amount: 7 },
    { kind: 'attack', amount: 7 },
    { kind: 'attack', amount: 7 },
    { kind: 'defend', amount: 6 },
    { kind: 'attack', amount: 16 },
  ],
};

export const sensorDrone: EnemyDefinition = {
  id: 'sensor-drone',
  name: 'Sensor Drone',
  maxHull: 30,
  intentPattern: [{ kind: 'attack', amount: 5 }],
};

export const gunship: EnemyDefinition = {
  id: 'gunship',
  name: 'Gunship',
  maxHull: 55,
  intentPattern: [
    { kind: 'attack', amount: 13 },
    { kind: 'defend', amount: 10 },
    { kind: 'attack', amount: 13 },
  ],
};

export const interceptor: EnemyDefinition = {
  id: 'interceptor',
  name: 'Interceptor',
  maxHull: 28,
  intentPattern: [{ kind: 'attack', amount: 8 }],
};

export const salvageHauler: EnemyDefinition = {
  id: 'salvage-hauler',
  name: 'Salvage Hauler',
  maxHull: 60,
  intentPattern: [
    { kind: 'defend', amount: 12 },
    { kind: 'attack', amount: 9 },
    { kind: 'attack', amount: 9 },
    { kind: 'attack', amount: 9 },
  ],
};

export const plasmaSkiff: EnemyDefinition = {
  id: 'plasma-skiff',
  name: 'Plasma Skiff',
  maxHull: 42,
  intentPattern: [
    { kind: 'attack', amount: 10 },
    { kind: 'attack', amount: 10 },
    { kind: 'defend', amount: 8 },
    { kind: 'attack', amount: 18 },
  ],
};

export const voidDrifter: EnemyDefinition = {
  id: 'void-drifter',
  name: 'Void Drifter',
  maxHull: 36,
  intentPattern: [
    { kind: 'attack', amount: 6 },
    { kind: 'attack', amount: 12 },
    { kind: 'attack', amount: 6 },
    { kind: 'attack', amount: 12 },
  ],
};

const combatEnemyDesigns: EnemyDefinition[] = [
  scavengerDrone,
  raiderSkiff,
  mineLayer,
  boardingPod,
  sensorDrone,
  gunship,
  interceptor,
  salvageHauler,
  plasmaSkiff,
  voidDrifter,
];

// --- Elite designs (3 total; reused across acts, scaled up in later acts) ---

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

export const voidSentinel: EnemyDefinition = {
  id: 'void-sentinel',
  name: 'Void Sentinel',
  maxHull: 85,
  intentPattern: [
    { kind: 'attack', amount: 16 },
    { kind: 'defend', amount: 18 },
    { kind: 'attack', amount: 16 },
    { kind: 'attack', amount: 16 },
    { kind: 'defend', amount: 18 },
  ],
};

export const reaperDrone: EnemyDefinition = {
  id: 'reaper-drone',
  name: 'Reaper Drone',
  maxHull: 65,
  intentPattern: [
    { kind: 'attack', amount: 14 },
    { kind: 'attack', amount: 14 },
    { kind: 'attack', amount: 14 },
    { kind: 'defend', amount: 20 },
    { kind: 'attack', amount: 28 },
  ],
};

const eliteDesigns: EnemyDefinition[] = [corsairCutter, voidSentinel, reaperDrone];

/**
 * Later acts scale both regular and elite enemies up rather than needing all-new
 * designs. Tuned down from an initial 1.35/1.75 and 1.4/1.85 pass after playtesting
 * showed runs consistently dying in Act 2 — see M4 balance notes in ROADMAP.md.
 */
const ACT_ENEMY_SCALE: Record<number, number> = { 1: 1, 2: 1.15, 3: 1.35 };
const ACT_ELITE_SCALE: Record<number, number> = { 1: 1, 2: 1.2, 3: 1.45 };

function scaleForAct(
  designs: EnemyDefinition[],
  act: number,
  scale: Record<number, number>,
): EnemyDefinition[] {
  const multiplier = scale[act] ?? 1;
  if (multiplier === 1) return designs;
  return designs.map((design) =>
    scaleEnemy(design, multiplier, { id: `${design.id}-act${act}`, name: design.name }),
  );
}

export const combatEnemiesByAct: Record<number, EnemyDefinition[]> = {
  1: scaleForAct(combatEnemyDesigns, 1, ACT_ENEMY_SCALE),
  2: scaleForAct(combatEnemyDesigns, 2, ACT_ENEMY_SCALE),
  3: scaleForAct(combatEnemyDesigns, 3, ACT_ENEMY_SCALE),
};

export const eliteEnemiesByAct: Record<number, EnemyDefinition[]> = {
  1: scaleForAct(eliteDesigns, 1, ACT_ELITE_SCALE),
  2: scaleForAct(eliteDesigns, 2, ACT_ELITE_SCALE),
  3: scaleForAct(eliteDesigns, 3, ACT_ELITE_SCALE),
};

// --- Bosses (3 distinct, one per act, not reused/scaled) ---

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

export const dreadnoughtCore: EnemyDefinition = {
  id: 'dreadnought-core',
  name: 'Dreadnought Core',
  maxHull: 190,
  intentPattern: [
    { kind: 'attack', amount: 18 },
    { kind: 'defend', amount: 20 },
    { kind: 'attack', amount: 18 },
    { kind: 'attack', amount: 18 },
    { kind: 'defend', amount: 20 },
    { kind: 'attack', amount: 40 },
  ],
};

export const theHarbinger: EnemyDefinition = {
  id: 'the-harbinger',
  name: 'The Harbinger',
  maxHull: 260,
  intentPattern: [
    { kind: 'attack', amount: 20 },
    { kind: 'attack', amount: 20 },
    { kind: 'defend', amount: 30 },
    { kind: 'attack', amount: 20 },
    { kind: 'attack', amount: 20 },
    { kind: 'attack', amount: 20 },
    { kind: 'defend', amount: 30 },
    { kind: 'attack', amount: 55 },
  ],
};

export const bossEnemyByAct: Record<number, EnemyDefinition> = {
  1: voidReaver,
  2: dreadnoughtCore,
  3: theHarbinger,
};
