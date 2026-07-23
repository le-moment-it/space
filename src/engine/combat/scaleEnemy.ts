import type { EnemyDefinition } from './types';

/**
 * Produces a scaled variant of an enemy design (hull + every intent's amount
 * multiplied and rounded), used to reuse the same elite/combat designs across
 * acts at increasing difficulty instead of hand-authoring every act's numbers.
 */
export function scaleEnemy(
  base: EnemyDefinition,
  multiplier: number,
  overrides: { id: string; name: string },
): EnemyDefinition {
  return {
    id: overrides.id,
    name: overrides.name,
    maxHull: Math.round(base.maxHull * multiplier),
    intentPattern: base.intentPattern.map((intent) => ({
      ...intent,
      amount: Math.round(intent.amount * multiplier),
    })),
  };
}
