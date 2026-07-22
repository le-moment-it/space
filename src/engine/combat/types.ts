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

export interface CombatState {
  player: PlayerState;
  enemy: EnemyState;
  drawPile: CardInstance[];
  hand: CardInstance[];
  discardPile: CardInstance[];
  turn: number;
  phase: CombatPhase;
  log: string[];
}

export interface CombatConfig {
  playerMaxHull: number;
  playerMaxPower: number;
  drawAmount: number;
}

export const DEFAULT_COMBAT_CONFIG: CombatConfig = {
  playerMaxHull: 50,
  playerMaxPower: 3,
  drawAmount: 5,
};
