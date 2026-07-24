import type { CardInstance } from '../cards/types';

export type Intent = { kind: 'attack'; amount: number } | { kind: 'defend'; amount: number };

/** Static definition of an enemy: identity + its repeating attack pattern. */
export interface EnemyDefinition {
  id: string;
  name: string;
  maxHull: number;
  /** Cycles indefinitely: intent for turn N is intentPattern[N % intentPattern.length]. */
  intentPattern: Intent[];
}

export interface EnemyState {
  id: string;
  name: string;
  hull: number;
  maxHull: number;
  shield: number;
  weakenAmount: number;
  weakenTurnsRemaining: number;
  intentPattern: Intent[];
  intent: Intent;
}

export interface PlayerState {
  hull: number;
  maxHull: number;
  shield: number;
  power: number;
  maxPower: number;
}

export type CombatPhase = 'playerTurn' | 'enemyTurn' | 'won' | 'lost';

/**
 * Structured combat-log events. The engine stays language-agnostic: it records what
 * happened (with card/enemy ids, not display names), and the UI formats + translates
 * each entry at render time. `absorbed` is 0 when no shields soaked the hit.
 */
export type CombatLogEntry =
  | { t: 'contact'; enemyId: string; hull: number }
  | { t: 'notEnoughPower'; cardId: string }
  | { t: 'played'; cardId: string }
  | { t: 'damage'; cardId: string; amount: number; absorbed: number }
  | { t: 'shield'; amount: number }
  | { t: 'heal'; amount: number }
  | { t: 'power'; amount: number }
  | { t: 'weaken'; enemyId: string; amount: number; duration: number }
  | { t: 'draw'; amount: number }
  | { t: 'reshuffle' }
  | { t: 'endTurn' }
  | { t: 'enemyAttack'; enemyId: string; amount: number; absorbed: number }
  | { t: 'enemyShield'; enemyId: string; amount: number }
  | { t: 'enemyDestroyed'; enemyId: string };

export interface CombatState {
  player: PlayerState;
  enemy: EnemyState;
  drawPile: CardInstance[];
  hand: CardInstance[];
  discardPile: CardInstance[];
  turn: number;
  phase: CombatPhase;
  log: CombatLogEntry[];
}

export interface CombatConfig {
  playerMaxHull: number;
  playerMaxPower: number;
  drawAmount: number;
  /** Shield the player resets to at the start of each turn, instead of 0 (a ship system effect). */
  baselineShield?: number;
}

export const DEFAULT_COMBAT_CONFIG: CombatConfig = {
  playerMaxHull: 50,
  playerMaxPower: 3,
  drawAmount: 5,
};
