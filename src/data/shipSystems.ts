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
  {
    id: 'shield-capacitor-array',
    name: 'Shield Capacitor Array',
    description: 'Start each turn with 8 shields already up.',
    effect: { kind: 'baselineShield', amount: 8 },
  },
  {
    id: 'overcharged-reactor',
    name: 'Overcharged Reactor',
    description: '+2 max reactor power per turn.',
    effect: { kind: 'maxPower', amount: 2 },
  },
  {
    id: 'nano-repair-matrix',
    name: 'Nano Repair Matrix',
    description: '+20 max hull.',
    effect: { kind: 'maxHull', amount: 20 },
  },
  {
    id: 'rapid-deployment-bay',
    name: 'Rapid Deployment Bay',
    description: 'Draw 2 extra cards each turn.',
    effect: { kind: 'drawAmount', amount: 2 },
  },
  {
    id: 'ablative-plating',
    name: 'Ablative Plating',
    description: '+12 max hull.',
    effect: { kind: 'maxHull', amount: 12 },
  },
  {
    id: 'secondary-reactor',
    name: 'Secondary Reactor',
    description: '+1 max reactor power per turn.',
    effect: { kind: 'maxPower', amount: 1 },
  },
  {
    id: 'point-defense-grid',
    name: 'Point Defense Grid',
    description: 'Start each turn with 3 shields already up.',
    effect: { kind: 'baselineShield', amount: 3 },
  },
  {
    id: 'hardened-bulkheads',
    name: 'Hardened Bulkheads',
    description: '+8 max hull.',
    effect: { kind: 'maxHull', amount: 8 },
  },
  {
    id: 'tertiary-capacitors',
    name: 'Tertiary Capacitors',
    description: 'Start each turn with 6 shields already up.',
    effect: { kind: 'baselineShield', amount: 6 },
  },
  {
    id: 'auxiliary-databanks',
    name: 'Auxiliary Databanks',
    description: 'Draw 1 extra card each turn.',
    effect: { kind: 'drawAmount', amount: 1 },
  },
  {
    id: 'emergency-cutoff',
    name: 'Emergency Cutoff',
    description: '+18 max hull.',
    effect: { kind: 'maxHull', amount: 18 },
  },
  {
    id: 'quantum-buffer',
    name: 'Quantum Buffer',
    description: '+2 max reactor power per turn.',
    effect: { kind: 'maxPower', amount: 2 },
  },
  {
    id: 'overclocked-thrusters',
    name: 'Overclocked Thrusters',
    description: 'Draw 1 extra card each turn.',
    effect: { kind: 'drawAmount', amount: 1 },
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
