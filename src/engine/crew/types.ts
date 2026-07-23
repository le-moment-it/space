import type { ShipSystemEffect } from '../shipSystems/types';

/**
 * A recruitable crew member. Passives reuse the ship-system effect shape so the
 * combat engine applies them through the same pipeline (see engine/run/resolve.ts).
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
  /** Cards added to the run deck when recruited. Crew cards never appear in shops/treasure. */
  cardIds: string[];
  /** Optional passive applied to every combat while this crew member is aboard. */
  passive: ShipSystemEffect | null;
  /** Lore shown on successive recruitments; clamps to the last entry once exhausted. */
  dialogues: string[];
}

/** Per-crew lifetime progress stored in the save. */
export interface CrewProgress {
  timesRecruited: number;
}
