/**
 * What a crew member changes about the run while they are aboard.
 *
 * Deliberately NOT `ShipSystemEffect`. Ship systems are stat bumps (+hull, +power);
 * crew are rule-changers, and folding these into that union would force every
 * ship-system switch to handle cases a ship system can never produce.
 */
export type CrewPassive =
  /** +N reactor power every turn. */
  | { kind: 'power'; amount: number }
  /** Every attack deals +N damage, all fight. */
  | { kind: 'calibration'; amount: number }
  /** The first damage taken each fight is nullified. */
  | { kind: 'evasion' }
  /** Cards left in hand carry over instead of being discarded. */
  | { kind: 'retainHand' }
  /** Start each fight with N shields (once per fight, not per turn). */
  | { kind: 'startingShield'; amount: number }
  /** Repair N hull after each fight won. */
  | { kind: 'repairAfterCombat'; amount: number };

/**
 * A recruitable crew member. Recruiting one grants their passive for the rest of the
 * run — that is their entire mechanical contribution; crew add no cards to the deck.
 * `dialogues[n]` is shown the (n+1)th time this crew member is recruited across
 * all runs — that lifetime counter lives in the save (meta.crew), not RunState.
 */
export interface CrewDefinition {
  id: string;
  name: string;
  /** Short role/title shown next to the name, e.g. "Ship's Medic". */
  role: string;
  /** Emoji stand-in for a portrait until real art exists (see docs/GAME_DESIGN.md §9). */
  portrait: string;
  /** Codex biography, revealed once the crew member has been met at least once. */
  bio: string;
  /** Text of the recruitment offer shown at the event node. */
  recruitPrompt: string;
  /** Plain description of `passive`, shown on the offer screen and the crew roster. */
  passiveDescription: string;
  /** Applied to the whole run while this crew member is aboard. */
  passive: CrewPassive;
  /** Lore shown on successive recruitments; clamps to the last entry once exhausted. */
  dialogues: string[];
}

/** Per-crew lifetime progress stored in the save. */
export interface CrewProgress {
  timesRecruited: number;
}
