import type { CombatConfig } from '../combat/types';
import type { CrewDefinition } from './types';

/**
 * Derives the effective combat config for the crew currently aboard.
 *
 * Mirrors `applyShipSystems`, deliberately: same fold, same exhaustive `never`, so
 * adding a `CrewPassive` kind is a compile error until it is handled here.
 *
 * `repairAfterCombat` is a no-op in this fold — it happens between fights rather than
 * inside one, and is applied in engine/run/resolve.ts when a combat is won. The same
 * split ship systems use for `maxHull`.
 */
export function applyCrewPassives(
  baseConfig: CombatConfig,
  crewIds: readonly string[],
  definitions: Record<string, CrewDefinition>,
): CombatConfig {
  return crewIds.reduce((config, id) => {
    const crew = definitions[id];
    if (!crew) return config;
    const passive = crew.passive;
    switch (passive.kind) {
      case 'power':
        return { ...config, playerMaxPower: config.playerMaxPower + passive.amount };
      case 'calibration':
        return {
          ...config,
          startingCalibration: (config.startingCalibration ?? 0) + passive.amount,
        };
      case 'evasion':
        return { ...config, nullifyFirstHit: true };
      case 'retainHand':
        return { ...config, retainHand: true };
      case 'startingShield':
        return { ...config, startingShield: (config.startingShield ?? 0) + passive.amount };
      case 'repairAfterCombat':
        return config;
      default: {
        const exhaustive: never = passive;
        throw new Error(`Unhandled crew passive: ${JSON.stringify(exhaustive)}`);
      }
    }
  }, baseConfig);
}

/** Total hull repaired after a won fight by the crew aboard. */
export function crewRepairAfterCombat(
  crewIds: readonly string[],
  definitions: Record<string, CrewDefinition>,
): number {
  return crewIds.reduce((total, id) => {
    const passive = definitions[id]?.passive;
    return passive?.kind === 'repairAfterCombat' ? total + passive.amount : total;
  }, 0);
}
