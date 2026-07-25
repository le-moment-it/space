import type { CardDefinition } from '../engine/cards/types';

const cardList: CardDefinition[] = [
  // --- Weapons (damage) ---
  {
    id: 'flak-burst',
    name: 'Flak Burst',
    type: 'weapon',
    cost: 1,
    description: 'Deal 4 damage.',
    effect: { kind: 'damage', amount: 4 },
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
    id: 'siege-cannon',
    name: 'Siege Cannon',
    type: 'weapon',
    cost: 3,
    description: 'Deal 20 damage.',
    effect: { kind: 'damage', amount: 20 },
  },
  {
    id: 'needle-array',
    name: 'Needle Array',
    type: 'weapon',
    cost: 0,
    description: 'Deal 2 damage.',
    effect: { kind: 'damage', amount: 2 },
  },
  {
    id: 'disruptor-cannon',
    name: 'Disruptor Cannon',
    type: 'weapon',
    cost: 2,
    description: 'Deal 9 damage.',
    effect: { kind: 'damage', amount: 9 },
  },

  // --- Maneuvers (shield, heal, weaken, draw) ---
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
    // Free and stronger than Raise Shields, but only once per fight — the trade
    // is burst on the turn you need it against having it every reshuffle.
    id: 'failsafe-screen',
    name: 'Failsafe Screen',
    type: 'maneuver',
    cost: 0,
    description: 'Gain 10 shields. Exhaust.',
    effect: { kind: 'shield', amount: 10 },
    exhaust: true,
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
    id: 'nanite-repair',
    name: 'Nanite Repair',
    type: 'maneuver',
    cost: 2,
    description: 'Repair 10 hull.',
    effect: { kind: 'heal', amount: 10 },
  },
  {
    id: 'shield-capacitor',
    name: 'Shield Capacitor',
    type: 'maneuver',
    cost: 0,
    description: 'Gain 3 shields.',
    effect: { kind: 'shield', amount: 3 },
  },
  {
    id: 'emergency-nanites',
    name: 'Emergency Nanites',
    type: 'maneuver',
    cost: 0,
    description: 'Repair 3 hull.',
    effect: { kind: 'heal', amount: 3 },
  },
  {
    id: 'jamming-pulse',
    name: 'Jamming Pulse',
    type: 'maneuver',
    cost: 2,
    description: 'Weaken the enemy: -6 damage on their attacks for 2 turns.',
    effect: { kind: 'weaken', amount: 6, duration: 2 },
  },
  {
    id: 'disable-targeting',
    name: 'Disable Targeting',
    type: 'maneuver',
    cost: 1,
    description: 'Weaken the enemy: -2 damage on their attacks for 4 turns.',
    effect: { kind: 'weaken', amount: 2, duration: 4 },
  },
  {
    id: 'data-uplink',
    name: 'Data Uplink',
    type: 'maneuver',
    cost: 1,
    description: 'Draw 3 cards.',
    effect: { kind: 'draw', amount: 3 },
  },
  {
    id: 'adrenaline-shot',
    name: 'Adrenaline Shot',
    type: 'maneuver',
    cost: 0,
    description: 'Draw 1 card.',
    effect: { kind: 'draw', amount: 1 },
  },
  {
    id: 'full-repair-kit',
    name: 'Full Repair Kit',
    type: 'maneuver',
    cost: 3,
    description: 'Repair 20 hull.',
    effect: { kind: 'heal', amount: 20 },
  },
  {
    id: 'aegis-shield',
    name: 'Aegis Shield',
    type: 'maneuver',
    cost: 3,
    description: 'Gain 22 shields.',
    effect: { kind: 'shield', amount: 22 },
  },

  // --- Ship systems (in-combat power cards) ---
  {
    id: 'reactor-surge',
    name: 'Reactor Surge',
    type: 'shipSystem',
    cost: 0,
    description: 'Gain 1 power this turn.',
    effect: { kind: 'power', amount: 1 },
  },
  {
    id: 'backup-generator',
    name: 'Backup Generator',
    type: 'shipSystem',
    cost: 0,
    description: 'Gain 1 power this turn.',
    effect: { kind: 'power', amount: 1 },
  },
  {
    id: 'overdrive-coils',
    name: 'Overdrive Coils',
    type: 'shipSystem',
    cost: 1,
    description: 'Gain 2 power this turn.',
    effect: { kind: 'power', amount: 2 },
  },
  {
    id: 'capacitor-bank',
    name: 'Capacitor Bank',
    type: 'shipSystem',
    cost: 2,
    description: 'Gain 4 power this turn.',
    effect: { kind: 'power', amount: 4 },
  },

  // --- Crew cards (enter the deck only when their crew member is recruited; ---
  // --- never appear in shops, treasure, elite rewards, or the unlock pool)  ---
  {
    id: 'crew-overload-shot',
    name: 'Overload Shot',
    type: 'crew',
    cost: 2,
    description: 'Jax: Deal 13 damage.',
    effect: { kind: 'damage', amount: 13 },
  },
  {
    id: 'crew-suppressing-fire',
    name: 'Suppressing Fire',
    type: 'crew',
    cost: 1,
    description: 'Jax: Weaken the enemy: -2 damage for 2 turns.',
    effect: { kind: 'weaken', amount: 2, duration: 2 },
  },
  {
    id: 'crew-triage-protocol',
    name: 'Triage Protocol',
    type: 'crew',
    cost: 1,
    description: 'Dr. Voss: Repair 8 hull.',
    effect: { kind: 'heal', amount: 8 },
  },
  {
    id: 'crew-stimulant-dose',
    name: 'Stimulant Dose',
    type: 'crew',
    cost: 0,
    description: 'Dr. Voss: Draw 1 card.',
    effect: { kind: 'draw', amount: 1 },
  },
  {
    id: 'crew-jury-rig',
    name: 'Jury-Rig',
    type: 'crew',
    cost: 0,
    description: 'Torque: Gain 5 shields.',
    effect: { kind: 'shield', amount: 5 },
  },
  {
    id: 'crew-reroute-power',
    name: 'Reroute Power',
    type: 'crew',
    cost: 0,
    description: 'Torque: Gain 1 power this turn.',
    effect: { kind: 'power', amount: 1 },
  },
  {
    id: 'crew-evasive-pattern',
    name: 'Evasive Pattern',
    type: 'crew',
    cost: 1,
    description: 'Sable: Gain 9 shields.',
    effect: { kind: 'shield', amount: 9 },
  },
  {
    id: 'crew-contraband-cache',
    name: 'Contraband Cache',
    type: 'crew',
    cost: 1,
    description: 'Sable: Draw 2 cards.',
    effect: { kind: 'draw', amount: 2 },
  },
  {
    id: 'crew-ghost-signal',
    name: 'Ghost Signal',
    type: 'crew',
    cost: 1,
    description: 'Whisper: Weaken the enemy: -3 damage for 3 turns.',
    effect: { kind: 'weaken', amount: 3, duration: 3 },
  },
  {
    id: 'crew-deep-scan',
    name: 'Deep Scan',
    type: 'crew',
    cost: 0,
    description: 'Whisper: Draw 2 cards.',
    effect: { kind: 'draw', amount: 2 },
  },
  {
    id: 'crew-stalwart-hymn',
    name: 'Stalwart Hymn',
    type: 'crew',
    cost: 1,
    description: 'Anchor: Gain 8 shields.',
    effect: { kind: 'shield', amount: 8 },
  },
  {
    id: 'crew-penance',
    name: 'Penance',
    type: 'crew',
    cost: 2,
    description: 'Anchor: Deal 15 damage.',
    effect: { kind: 'damage', amount: 15 },
  },
  // --- Status & buff cards (the new mechanic families) ---
  {
    // Corrosion is front-loaded then fades, so it pays off most when applied early.
    id: 'nanite-swarm',
    name: 'Nanite Swarm',
    type: 'weapon',
    cost: 1,
    description: 'Apply 5 Corrosion.',
    effect: { kind: 'corrosion', amount: 5 },
    rarity: 'rare',
  },
  {
    id: 'corrosive-flak',
    name: 'Corrosive Flak',
    type: 'weapon',
    cost: 1,
    description: 'Deal 4 damage. Apply 3 Corrosion.',
    effect: { kind: 'damage', amount: 4 },
    extraEffects: [{ kind: 'corrosion', amount: 3 }],
    rarity: 'epic',
  },
  {
    id: 'hull-cutter',
    name: 'Hull Cutter',
    type: 'weapon',
    cost: 1,
    description: 'Breach for 2 turns.',
    effect: { kind: 'breach', amount: 2 },
    rarity: 'epic',
  },
  {
    id: 'targeting-lock',
    name: 'Targeting Lock',
    type: 'shipSystem',
    cost: 0,
    description: 'Double your next attack.',
    effect: { kind: 'charge', target: 'damage', amount: 1 },
    rarity: 'rare',
  },
  {
    id: 'capacitor-brace',
    name: 'Capacitor Brace',
    type: 'shipSystem',
    cost: 0,
    description: 'Double your next shield gain.',
    effect: { kind: 'charge', target: 'shield', amount: 1 },
    rarity: 'rare',
  },
  {
    id: 'triage-primer',
    name: 'Triage Primer',
    type: 'shipSystem',
    cost: 0,
    description: 'Double your next repair.',
    effect: { kind: 'charge', target: 'heal', amount: 1 },
    rarity: 'rare',
  },
  {
    id: 'gunnery-calibration',
    name: 'Gunnery Calibration',
    type: 'shipSystem',
    cost: 1,
    description: '+2 damage per attack this fight.',
    effect: { kind: 'calibration', amount: 2 },
    rarity: 'epic',
  },
  {
    id: 'deflector-tuning',
    name: 'Deflector Tuning',
    type: 'shipSystem',
    cost: 1,
    description: '+2 to every shield gain this fight.',
    effect: { kind: 'deflector', amount: 2 },
    rarity: 'epic',
  },
  {
    // Multi-hit: weak into armour, but every point of Calibration counts three times.
    id: 'needle-volley',
    name: 'Needle Volley',
    type: 'weapon',
    cost: 1,
    description: 'Deal 3 damage 3 times.',
    effect: { kind: 'damage', amount: 3, times: 3 },
    rarity: 'epic',
  },
  {
    id: 'siphon-beam',
    name: 'Siphon Beam',
    type: 'weapon',
    cost: 1,
    description: 'Deal 6 damage. Repair 4 hull.',
    effect: { kind: 'damage', amount: 6 },
    extraEffects: [{ kind: 'heal', amount: 4 }],
    rarity: 'rare',
  },
  {
    id: 'overwhelming-barrage',
    name: 'Overwhelming Barrage',
    type: 'weapon',
    cost: 2,
    description: 'Deal 5 damage 4 times. Breach for 1 turn.',
    effect: { kind: 'damage', amount: 5, times: 4 },
    extraEffects: [{ kind: 'breach', amount: 1 }],
    rarity: 'legendary',
  },
  {
    id: 'master-gunner',
    name: 'Master Gunner',
    type: 'shipSystem',
    cost: 2,
    description: '+4 damage per attack this fight. Draw 1.',
    effect: { kind: 'calibration', amount: 4 },
    extraEffects: [{ kind: 'draw', amount: 1 }],
    rarity: 'legendary',
  },
];

export const cardDefinitions: Record<string, CardDefinition> = Object.fromEntries(
  cardList.map((card) => [card.id, card]),
);

/**
 * The default 10-card starting loadout — basic and weak on purpose
 * (docs/GAME_DESIGN.md §4). Players can customise this in the Deck screen;
 * every card here is in the default-unlocked set so a fresh save is valid.
 */
export const defaultLoadoutCardIds: string[] = [
  'flak-burst',
  'flak-burst',
  'flak-burst',
  'needle-array',
  'ion-torpedo',
  'raise-shields',
  'raise-shields',
  'hull-patch',
  'target-scanners',
  'reactor-surge',
];

/** Card ids purchasable at Salvage Trader nodes / offerable at Derelict Cache nodes. */
export const runCardPool: string[] = Object.keys(cardDefinitions).filter(
  (id) => cardDefinitions[id].type !== 'crew',
);

/** Stronger cards awarded for clearing an Elite Hostile encounter. */
export const eliteRewardCardIds: string[] = [
  'disruptor-cannon',
  'emergency-shield-boost',
  'nanite-repair',
  'jamming-pulse',
  'data-uplink',
  'siege-cannon',
  'full-repair-kit',
  'aegis-shield',
  'capacitor-bank',
];

/**
 * Unlocked from the very first run (the 8 unique cards in the starting deck already
 * unlocked trivially). The remaining cards unlock via milestones — see data/milestones.ts.
 *
 * Every card here must be Common: a fresh profile builds its first deck from this
 * list, and handing a new player Epics and Legendaries flattens the whole unlock
 * curve. `cards.test.ts` enforces it.
 */
export const defaultUnlockedCardIds: string[] = [
  'flak-burst',
  'needle-array',
  'ion-torpedo',
  'raise-shields',
  'shield-capacitor',
  'hull-patch',
  'emergency-nanites',
  'target-scanners',
  'disable-targeting',
  'adrenaline-shot',
  'reactor-surge',
  'failsafe-screen',
];
