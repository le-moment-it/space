import type { CardDefinition } from '../cards/types';
import type { CombatConfig, CombatState, EnemyDefinition } from '../combat/types';
import { DEFAULT_COMBAT_CONFIG } from '../combat/types';
import type { EventDefinition } from '../events/types';
import type { MapGraph } from '../map/types';
import type { ShipSystemDefinition } from '../shipSystems/types';

export type RunPhase =
  'map' | 'combat' | 'event' | 'rest' | 'shop' | 'treasure' | 'reward' | 'runWon' | 'runLost';

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
  map: MapGraph;
  currentNodeId: string | null;
  visitedNodeIds: string[];
  hull: number;
  maxHull: number;
  deckCardIds: string[];
  salvage: number;
  /** Ship systems installed this run — reset every run; see docs/GAME_DESIGN.md §5. */
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
  combatEnemies: EnemyDefinition[];
  eliteEnemies: EnemyDefinition[];
  bossEnemy: EnemyDefinition;
  events: EventDefinition[];
  /** These pools/ids are expected to already be filtered to the caller's unlocked set. */
  eliteRewardCardIds: string[];
  shopCardPool: string[];
  treasureCardPool: string[];
  shipSystemDefinitions: Record<string, ShipSystemDefinition>;
  availableShipSystemIds: string[];
  combatConfig?: CombatConfig;
}
