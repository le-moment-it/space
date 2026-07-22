import type { CardDefinition } from '../engine/cards/types';

const cardList: CardDefinition[] = [
  {
    id: 'kinetic-cannon',
    name: 'Kinetic Cannon',
    type: 'weapon',
    cost: 1,
    description: 'Deal 6 damage.',
    effect: { kind: 'damage', amount: 6 },
  },
  {
    id: 'flak-burst',
    name: 'Flak Burst',
    type: 'weapon',
    cost: 1,
    description: 'Deal 4 damage.',
    effect: { kind: 'damage', amount: 4 },
  },
  {
    id: 'heavy-railgun',
    name: 'Heavy Railgun',
    type: 'weapon',
    cost: 2,
    description: 'Deal 11 damage.',
    effect: { kind: 'damage', amount: 11 },
  },
  {
    id: 'plasma-lance',
    name: 'Plasma Lance',
    type: 'weapon',
    cost: 2,
    description: 'Deal 14 damage.',
    effect: { kind: 'damage', amount: 14 },
  },
  {
    id: 'raise-shields',
    name: 'Raise Shields',
    type: 'maneuver',
    cost: 1,
    description: 'Gain 7 shields.',
    effect: { kind: 'shield', amount: 7 },
  },
  {
    id: 'emergency-shield-boost',
    name: 'Emergency Shield Boost',
    type: 'maneuver',
    cost: 2,
    description: 'Gain 12 shields.',
    effect: { kind: 'shield', amount: 12 },
  },
  {
    id: 'hull-patch',
    name: 'Hull Patch',
    type: 'maneuver',
    cost: 1,
    description: 'Repair 5 hull.',
    effect: { kind: 'heal', amount: 5 },
  },
  {
    id: 'target-scanners',
    name: 'Target Scanners',
    type: 'maneuver',
    cost: 1,
    description: 'Weaken the enemy: -3 damage on their attacks for 2 turns.',
    effect: { kind: 'weaken', amount: 3, duration: 2 },
  },
  {
    id: 'overcharge-reactor',
    name: 'Overcharge Reactor',
    type: 'shipSystem',
    cost: 0,
    description: 'Gain 2 power this turn.',
    effect: { kind: 'power', amount: 2 },
  },
  {
    id: 'auto-turret',
    name: 'Auto Turret',
    type: 'weapon',
    cost: 1,
    description: 'Deal 5 damage.',
    effect: { kind: 'damage', amount: 5 },
  },
  {
    id: 'ion-torpedo',
    name: 'Ion Torpedo',
    type: 'weapon',
    cost: 2,
    description: 'Deal 9 damage.',
    effect: { kind: 'damage', amount: 9 },
  },
  {
    id: 'brace-for-impact',
    name: 'Brace for Impact',
    type: 'maneuver',
    cost: 0,
    description: 'Gain 4 shields.',
    effect: { kind: 'shield', amount: 4 },
  },
  {
    id: 'nanite-repair',
    name: 'Nanite Repair',
    type: 'maneuver',
    cost: 2,
    description: 'Repair 10 hull.',
    effect: { kind: 'heal', amount: 10 },
  },
  {
    id: 'sensor-jam',
    name: 'Sensor Jam',
    type: 'maneuver',
    cost: 1,
    description: 'Weaken the enemy: -4 damage on their attacks for 3 turns.',
    effect: { kind: 'weaken', amount: 4, duration: 3 },
  },
  {
    id: 'reactor-surge',
    name: 'Reactor Surge',
    type: 'shipSystem',
    cost: 0,
    description: 'Gain 1 power this turn.',
    effect: { kind: 'power', amount: 1 },
  },
];

export const cardDefinitions: Record<string, CardDefinition> = Object.fromEntries(
  cardList.map((card) => [card.id, card]),
);

/** The fixed v1.0 starting deck — basic and weak on purpose (see docs/GAME_DESIGN.md §4). */
export const startingDeckCardIds: string[] = [
  'kinetic-cannon',
  'kinetic-cannon',
  'flak-burst',
  'flak-burst',
  'raise-shields',
  'raise-shields',
  'hull-patch',
  'target-scanners',
  'overcharge-reactor',
  'heavy-railgun',
  'plasma-lance',
];

/** Card ids purchasable at Salvage Trader nodes / offerable at Derelict Cache nodes. */
export const runCardPool: string[] = Object.keys(cardDefinitions);

/** Stronger cards awarded for clearing an Elite Hostile encounter. */
export const eliteRewardCardIds: string[] = [
  'heavy-railgun',
  'plasma-lance',
  'emergency-shield-boost',
  'nanite-repair',
  'ion-torpedo',
];

/**
 * Unlocked from the very first run (the 8 unique cards in the starting deck already
 * unlocked trivially). The remaining cards unlock via milestones — see data/milestones.ts.
 */
export const defaultUnlockedCardIds: string[] = [
  'kinetic-cannon',
  'flak-burst',
  'raise-shields',
  'hull-patch',
  'target-scanners',
  'overcharge-reactor',
  'heavy-railgun',
  'plasma-lance',
];
