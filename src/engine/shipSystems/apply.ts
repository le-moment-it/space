import type { CombatConfig } from '../combat/types';
import type { ShipSystemDefinition } from './types';

/**
 * Derives the effective combat config for a run's owned ship systems.
 * `maxHull` effects are intentionally a no-op here — they're applied once,
 * directly to RunState.maxHull, when the system is chosen (see engine/run/resolve.ts),
 * and that value is what seeds `baseConfig.playerMaxHull` before this runs.
 */
export function applyShipSystems(
  baseConfig: CombatConfig,
  ownedIds: readonly string[],
  definitions: Record<string, ShipSystemDefinition>,
): CombatConfig {
  return ownedIds.reduce((config, id) => {
    const def = definitions[id];
    if (!def) return config;
    switch (def.effect.kind) {
      case 'maxHull':
        return config;
      case 'maxPower':
        return { ...config, playerMaxPower: config.playerMaxPower + def.effect.amount };
      case 'baselineShield':
        return { ...config, baselineShield: (config.baselineShield ?? 0) + def.effect.amount };
      case 'drawAmount':
        return { ...config, drawAmount: config.drawAmount + def.effect.amount };
      default: {
        const exhaustive: never = def.effect;
        throw new Error(`Unhandled ship system effect: ${JSON.stringify(exhaustive)}`);
      }
    }
  }, baseConfig);
}
