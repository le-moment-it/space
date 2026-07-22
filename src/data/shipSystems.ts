import type { ShipSystemDefinition } from '../engine/shipSystems/types';

const list: ShipSystemDefinition[] = [
  {
    id: 'reinforced-hull-plating',
    name: 'Reinforced Hull Plating',
    description: '+15 max hull.',
    effect: { kind: 'maxHull', amount: 15 },
  },
  {
    id: 'auxiliary-power-core',
    name: 'Auxiliary Power Core',
    description: '+1 max reactor power per turn.',
    effect: { kind: 'maxPower', amount: 1 },
  },
  {
    id: 'deflector-array',
    name: 'Deflector Array',
    description: 'Start each turn with 5 shields already up.',
    effect: { kind: 'baselineShield', amount: 5 },
  },
  {
    id: 'expanded-cargo-bay',
    name: 'Expanded Cargo Bay',
    description: 'Draw 1 extra card each turn.',
    effect: { kind: 'drawAmount', amount: 1 },
  },
  {
    id: 'redundant-systems',
    name: 'Redundant Systems',
    description: '+10 max hull.',
    effect: { kind: 'maxHull', amount: 10 },
  },
];

export const shipSystemDefinitions: Record<string, ShipSystemDefinition> = Object.fromEntries(
  list.map((system) => [system.id, system]),
);

/** Unlocked from the very first run; the rest unlock via milestones (see data/milestones.ts). */
export const defaultUnlockedShipSystemIds: string[] = [
  'reinforced-hull-plating',
  'auxiliary-power-core',
];
