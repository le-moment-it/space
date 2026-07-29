import type { CardDefinition } from '../engine/cards/types';

const cardList: CardDefinition[] = [
  // --- Weapons (damage) ---
  {
    id: 'flak-burst',
    name: 'Flak Burst',
    type: 'weapon',
    cost: 1,
    effect: { kind: 'damage', amount: 4 },
    upgrades: [
      { effect: { kind: 'damage', amount: 6 } },
      { effect: { kind: 'damage', amount: 8 } },
    ],
  },
  {
    id: 'ion-torpedo',
    name: 'Ion Torpedo',
    type: 'weapon',
    cost: 2,
    effect: { kind: 'damage', amount: 9 },
    upgrades: [
      { effect: { kind: 'damage', amount: 11 } },
      { effect: { kind: 'damage', amount: 13 } },
    ],
  },
  {
    id: 'siege-cannon',
    name: 'Siege Cannon',
    type: 'weapon',
    cost: 3,
    effect: { kind: 'damage', amount: 20 },
    upgrades: [
      { effect: { kind: 'damage', amount: 22 } },
      { effect: { kind: 'damage', amount: 24 } },
    ],
  },
  {
    id: 'needle-array',
    name: 'Needle Array',
    type: 'weapon',
    cost: 0,
    effect: { kind: 'damage', amount: 2 },
    upgrades: [
      { effect: { kind: 'damage', amount: 4 } },
      { effect: { kind: 'damage', amount: 6 } },
    ],
  },
  {
    id: 'disruptor-cannon',
    name: 'Disruptor Cannon',
    type: 'weapon',
    cost: 2,
    effect: { kind: 'damage', amount: 9 },
    upgrades: [
      { effect: { kind: 'damage', amount: 11 } },
      { effect: { kind: 'damage', amount: 13 } },
    ],
  },

  // --- Maneuvers (shield, heal, weaken, draw) ---
  {
    id: 'raise-shields',
    name: 'Raise Shields',
    type: 'maneuver',
    cost: 1,
    effect: { kind: 'shield', amount: 7 },
    upgrades: [
      { effect: { kind: 'shield', amount: 9 } },
      { effect: { kind: 'shield', amount: 11 } },
    ],
  },
  {
    id: 'emergency-shield-boost',
    name: 'Emergency Shield Boost',
    type: 'maneuver',
    cost: 2,
    effect: { kind: 'shield', amount: 12 },
    upgrades: [
      { effect: { kind: 'shield', amount: 14 } },
      { effect: { kind: 'shield', amount: 16 } },
    ],
  },
  {
    // Free and stronger than Raise Shields, but only once per fight — the trade
    // is burst on the turn you need it against having it every reshuffle.
    id: 'failsafe-screen',
    name: 'Failsafe Screen',
    type: 'maneuver',
    cost: 0,
    effect: { kind: 'shield', amount: 10 },
    exhaust: true,
    upgrades: [
      { effect: { kind: 'shield', amount: 12 } },
      { effect: { kind: 'shield', amount: 14 } },
    ],
  },
  {
    id: 'hull-patch',
    name: 'Hull Patch',
    type: 'maneuver',
    cost: 1,
    effect: { kind: 'heal', amount: 5 },
    upgrades: [{ effect: { kind: 'heal', amount: 7 } }, { effect: { kind: 'heal', amount: 9 } }],
  },
  {
    id: 'target-scanners',
    name: 'Target Scanners',
    type: 'maneuver',
    cost: 1,
    effect: { kind: 'weaken', amount: 3, duration: 2 },
    upgrades: [
      { effect: { kind: 'weaken', amount: 4, duration: 2 } },
      { effect: { kind: 'weaken', amount: 5, duration: 2 } },
    ],
  },
  {
    id: 'nanite-repair',
    name: 'Nanite Repair',
    type: 'maneuver',
    cost: 2,
    effect: { kind: 'heal', amount: 10 },
    upgrades: [{ effect: { kind: 'heal', amount: 12 } }, { effect: { kind: 'heal', amount: 14 } }],
  },
  {
    id: 'shield-capacitor',
    name: 'Shield Capacitor',
    type: 'maneuver',
    cost: 0,
    effect: { kind: 'shield', amount: 3 },
    upgrades: [
      { effect: { kind: 'shield', amount: 5 } },
      { effect: { kind: 'shield', amount: 7 } },
    ],
  },
  {
    id: 'emergency-nanites',
    name: 'Emergency Nanites',
    type: 'maneuver',
    cost: 0,
    effect: { kind: 'heal', amount: 3 },
    upgrades: [{ effect: { kind: 'heal', amount: 5 } }, { effect: { kind: 'heal', amount: 7 } }],
  },
  {
    id: 'jamming-pulse',
    name: 'Jamming Pulse',
    type: 'maneuver',
    cost: 2,
    effect: { kind: 'weaken', amount: 6, duration: 2 },
    upgrades: [
      { effect: { kind: 'weaken', amount: 7, duration: 2 } },
      { effect: { kind: 'weaken', amount: 8, duration: 2 } },
    ],
  },
  {
    id: 'disable-targeting',
    name: 'Disable Targeting',
    type: 'maneuver',
    cost: 1,
    effect: { kind: 'weaken', amount: 2, duration: 4 },
    upgrades: [
      { effect: { kind: 'weaken', amount: 3, duration: 4 } },
      { effect: { kind: 'weaken', amount: 4, duration: 4 } },
    ],
  },
  {
    id: 'data-uplink',
    name: 'Data Uplink',
    type: 'maneuver',
    cost: 1,
    effect: { kind: 'draw', amount: 3 },
    upgrades: [{ effect: { kind: 'draw', amount: 4 } }, { effect: { kind: 'draw', amount: 5 } }],
  },
  {
    id: 'adrenaline-shot',
    name: 'Adrenaline Shot',
    type: 'maneuver',
    cost: 0,
    effect: { kind: 'draw', amount: 1 },
    upgrades: [{ effect: { kind: 'draw', amount: 2 } }, { effect: { kind: 'draw', amount: 3 } }],
  },
  {
    id: 'full-repair-kit',
    name: 'Full Repair Kit',
    type: 'maneuver',
    cost: 3,
    effect: { kind: 'heal', amount: 20 },
    upgrades: [{ effect: { kind: 'heal', amount: 22 } }, { effect: { kind: 'heal', amount: 24 } }],
  },
  {
    id: 'aegis-shield',
    name: 'Aegis Shield',
    type: 'maneuver',
    cost: 3,
    effect: { kind: 'shield', amount: 22 },
    upgrades: [
      { effect: { kind: 'shield', amount: 24 } },
      { effect: { kind: 'shield', amount: 26 } },
    ],
  },

  // --- Ship systems (in-combat power cards) ---
  {
    id: 'reactor-surge',
    name: 'Reactor Surge',
    type: 'shipSystem',
    cost: 0,
    effect: { kind: 'power', amount: 1 },
    upgrades: [{ effect: { kind: 'power', amount: 2 } }, { effect: { kind: 'power', amount: 3 } }],
  },
  {
    id: 'backup-generator',
    name: 'Backup Generator',
    type: 'shipSystem',
    cost: 0,
    effect: { kind: 'power', amount: 1 },
    upgrades: [{ effect: { kind: 'power', amount: 2 } }, { effect: { kind: 'power', amount: 3 } }],
  },
  {
    id: 'overdrive-coils',
    name: 'Overdrive Coils',
    type: 'shipSystem',
    cost: 1,
    effect: { kind: 'power', amount: 2 },
    upgrades: [{ effect: { kind: 'power', amount: 3 } }, { effect: { kind: 'power', amount: 4 } }],
  },
  {
    id: 'capacitor-bank',
    name: 'Capacitor Bank',
    type: 'shipSystem',
    cost: 2,
    effect: { kind: 'power', amount: 4 },
    upgrades: [{ effect: { kind: 'power', amount: 5 } }, { effect: { kind: 'power', amount: 6 } }],
  },

  // --- Crew cards (enter the deck only when their crew member is recruited; ---
  // --- never appear in shops, treasure, elite rewards, or the unlock pool)  ---
  // --- Status & buff cards (the new mechanic families) ---
  {
    // Corrosion is front-loaded then fades, so it pays off most when applied early.
    id: 'nanite-swarm',
    name: 'Nanite Swarm',
    type: 'weapon',
    cost: 1,
    effect: { kind: 'corrosion', amount: 5 },
    rarity: 'rare',
    upgrades: [
      { effect: { kind: 'corrosion', amount: 7 } },
      { effect: { kind: 'corrosion', amount: 9 } },
    ],
  },
  {
    id: 'corrosive-flak',
    name: 'Corrosive Flak',
    type: 'weapon',
    cost: 1,
    effect: { kind: 'damage', amount: 4 },
    extraEffects: [{ kind: 'corrosion', amount: 3 }],
    rarity: 'epic',
    upgrades: [
      { effect: { kind: 'damage', amount: 6 } },
      { effect: { kind: 'damage', amount: 8 } },
    ],
  },
  {
    id: 'hull-cutter',
    name: 'Hull Cutter',
    type: 'weapon',
    cost: 1,
    effect: { kind: 'breach', amount: 2 },
    rarity: 'epic',
    upgrades: [
      { effect: { kind: 'breach', amount: 3 } },
      { effect: { kind: 'breach', amount: 4 } },
    ],
  },
  {
    id: 'targeting-lock',
    name: 'Targeting Lock',
    type: 'shipSystem',
    cost: 0,
    effect: { kind: 'charge', target: 'damage', amount: 1 },
    rarity: 'rare',
    upgrades: [
      { effect: { kind: 'charge', target: 'damage', amount: 2 } },
      { effect: { kind: 'charge', target: 'damage', amount: 3 } },
    ],
  },
  {
    id: 'capacitor-brace',
    name: 'Capacitor Brace',
    type: 'shipSystem',
    cost: 0,
    effect: { kind: 'charge', target: 'shield', amount: 1 },
    rarity: 'rare',
    upgrades: [
      { effect: { kind: 'charge', target: 'shield', amount: 2 } },
      { effect: { kind: 'charge', target: 'shield', amount: 3 } },
    ],
  },
  {
    id: 'triage-primer',
    name: 'Triage Primer',
    type: 'shipSystem',
    cost: 0,
    effect: { kind: 'charge', target: 'heal', amount: 1 },
    rarity: 'rare',
    upgrades: [
      { effect: { kind: 'charge', target: 'heal', amount: 2 } },
      { effect: { kind: 'charge', target: 'heal', amount: 3 } },
    ],
  },
  {
    id: 'gunnery-calibration',
    name: 'Gunnery Calibration',
    type: 'shipSystem',
    cost: 1,
    effect: { kind: 'calibration', amount: 2 },
    rarity: 'epic',
    upgrades: [
      { effect: { kind: 'calibration', amount: 3 } },
      { effect: { kind: 'calibration', amount: 4 } },
    ],
  },
  {
    id: 'deflector-tuning',
    name: 'Deflector Tuning',
    type: 'shipSystem',
    cost: 1,
    effect: { kind: 'deflector', amount: 2 },
    rarity: 'epic',
    upgrades: [
      { effect: { kind: 'deflector', amount: 3 } },
      { effect: { kind: 'deflector', amount: 4 } },
    ],
  },
  {
    // Multi-hit: weak into armour, but every point of Calibration counts three times.
    id: 'needle-volley',
    name: 'Needle Volley',
    type: 'weapon',
    cost: 1,
    effect: { kind: 'damage', amount: 3, times: 3 },
    rarity: 'epic',
    upgrades: [
      { effect: { kind: 'damage', amount: 5, times: 3 } },
      { effect: { kind: 'damage', amount: 7, times: 3 } },
    ],
  },
  {
    id: 'siphon-beam',
    name: 'Siphon Beam',
    type: 'weapon',
    cost: 1,
    effect: { kind: 'damage', amount: 6 },
    extraEffects: [{ kind: 'heal', amount: 4 }],
    rarity: 'rare',
    upgrades: [
      { effect: { kind: 'damage', amount: 8 } },
      { effect: { kind: 'damage', amount: 10 } },
    ],
  },
  {
    id: 'overwhelming-barrage',
    name: 'Overwhelming Barrage',
    type: 'weapon',
    cost: 2,
    effect: { kind: 'damage', amount: 5, times: 4 },
    extraEffects: [{ kind: 'breach', amount: 1 }],
    rarity: 'legendary',
    upgrades: [
      { effect: { kind: 'damage', amount: 7, times: 4 } },
      { effect: { kind: 'damage', amount: 9, times: 4 } },
    ],
  },
  {
    id: 'master-gunner',
    name: 'Master Gunner',
    type: 'shipSystem',
    cost: 2,
    effect: { kind: 'calibration', amount: 4 },
    extraEffects: [{ kind: 'draw', amount: 1 }],
    rarity: 'legendary',
    upgrades: [
      { effect: { kind: 'calibration', amount: 5 } },
      { effect: { kind: 'calibration', amount: 6 } },
    ],
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
export const runCardPool: string[] = Object.keys(cardDefinitions);

/**
 * Stronger cards awarded for clearing an Elite Hostile encounter.
 *
 * Must contain cards of every rarity the `elite` odds claim to offer. This list was
 * once all Common, which quietly renormalised those odds to 100% Common and made an
 * elite reward *worse* than a normal fight's — a normal win draws from the whole
 * unlocked pool and can roll a Legendary. `rarity.test.ts` now enforces the match.
 */
export const eliteRewardCardIds: string[] = [
  // Common
  'disruptor-cannon',
  'emergency-shield-boost',
  'nanite-repair',
  'jamming-pulse',
  'data-uplink',
  'siege-cannon',
  'full-repair-kit',
  'aegis-shield',
  'capacitor-bank',
  // Rare
  'nanite-swarm',
  'targeting-lock',
  'capacitor-brace',
  'triage-primer',
  'siphon-beam',
  // Epic
  'corrosive-flak',
  'hull-cutter',
  'gunnery-calibration',
  'deflector-tuning',
  'needle-volley',
  // Legendary
  'overwhelming-barrage',
  'master-gunner',
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
