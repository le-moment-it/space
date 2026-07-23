import type { CardDefinition } from '../cards/types';
import type { CombatConfig, CombatState, EnemyDefinition } from '../combat/types';
import { DEFAULT_COMBAT_CONFIG } from '../combat/types';
import type { EventDefinition } from '../events/types';
import type { MapGraph } from '../map/types';
import type { ShipSystemDefinition } from '../shipSystems/types';

export type RunPhase =
  'map' | 'combat' | 'event' | 'rest' | 'shop' | 'treasure' | 'reward' | 'runWon' | 'runLost';

/** v1.0 targets a fixed 3-act structure (see docs/GAME_DESIGN.md). */
export const TOTAL_ACTS = 3;

export interface ShopOfferItem {
  cardId: string;
  price: number;
  purchased: boolean;
}

export interface PendingReward {
  salvage: number;
  cardId?: string;
}

export interface RunState {
  act: number;
  map: MapGraph;
  currentNodeId: string | null;
  visitedNodeIds: string[];
  hull: number;
  maxHull: number;
  deckCardIds: string[];
  salvage: number;
  /** Ship systems installed this run — accumulate across all acts of a run; reset every new run. */
  shipSystemIds: string[];
  phase: RunPhase;
  activeCombat: CombatState | null;
  activeEventId: string | null;
  shopOffer: ShopOfferItem[] | null;
  pendingReward: PendingReward | null;
  /** The 3 ship systems offered while phase is 'reward'. */
  rewardOptions: string[] | null;
  log: string[];
}

export interface RunConfig {
  maxHull: number;
  startingSalvage: number;
  combatConfig?: CombatConfig;
}

export const DEFAULT_RUN_CONFIG: RunConfig = {
  maxHull: DEFAULT_COMBAT_CONFIG.playerMaxHull,
  startingSalvage: 0,
};

/** All game content the run engine needs, injected so the engine stays data-agnostic. */
export interface RunContent {
  cardDefinitions: Record<string, CardDefinition>;
  /** Keyed by act number (1-based). */
  combatEnemiesByAct: Record<number, EnemyDefinition[]>;
  eliteEnemiesByAct: Record<number, EnemyDefinition[]>;
  bossEnemyByAct: Record<number, EnemyDefinition>;
  events: EventDefinition[];
  /** These pools/ids are expected to already be filtered to the caller's unlocked set. */
  eliteRewardCardIds: string[];
  shopCardPool: string[];
  treasureCardPool: string[];
  shipSystemDefinitions: Record<string, ShipSystemDefinition>;
  availableShipSystemIds: string[];
  combatConfig?: CombatConfig;
}
