import { describe, expect, it } from 'vitest';
import { DEFAULT_COMBAT_CONFIG } from '../combat/types';
import { applyShipSystems } from './apply';
import type { ShipSystemDefinition } from './types';

const definitions: Record<string, ShipSystemDefinition> = {
  hull: { id: 'hull', name: 'Hull', description: '', effect: { kind: 'maxHull', amount: 15 } },
  power: { id: 'power', name: 'Power', description: '', effect: { kind: 'maxPower', amount: 1 } },
  shield: {
    id: 'shield',
    name: 'Shield',
    description: '',
    effect: { kind: 'baselineShield', amount: 5 },
  },
  draw: { id: 'draw', name: 'Draw', description: '', effect: { kind: 'drawAmount', amount: 1 } },
};

describe('applyShipSystems', () => {
  it('returns the base config unchanged when no systems are owned', () => {
    expect(applyShipSystems(DEFAULT_COMBAT_CONFIG, [], definitions)).toEqual(DEFAULT_COMBAT_CONFIG);
  });

  it('does not modify playerMaxHull for a maxHull effect (handled upstream on RunState)', () => {
    const result = applyShipSystems(DEFAULT_COMBAT_CONFIG, ['hull'], definitions);
    expect(result.playerMaxHull).toBe(DEFAULT_COMBAT_CONFIG.playerMaxHull);
  });

  it('applies maxPower, baselineShield, and drawAmount additively', () => {
    const result = applyShipSystems(
      DEFAULT_COMBAT_CONFIG,
      ['power', 'shield', 'draw'],
      definitions,
    );
    expect(result.playerMaxPower).toBe(DEFAULT_COMBAT_CONFIG.playerMaxPower + 1);
    expect(result.baselineShield).toBe(5);
    expect(result.drawAmount).toBe(DEFAULT_COMBAT_CONFIG.drawAmount + 1);
  });

  it('stacks multiple copies of the same effect kind', () => {
    const stacked: Record<string, ShipSystemDefinition> = {
      shieldA: {
        id: 'shieldA',
        name: 'A',
        description: '',
        effect: { kind: 'baselineShield', amount: 3 },
      },
      shieldB: {
        id: 'shieldB',
        name: 'B',
        description: '',
        effect: { kind: 'baselineShield', amount: 4 },
      },
    };
    const result = applyShipSystems(DEFAULT_COMBAT_CONFIG, ['shieldA', 'shieldB'], stacked);
    expect(result.baselineShield).toBe(7);
  });

  it('ignores unknown ship system ids', () => {
    const result = applyShipSystems(DEFAULT_COMBAT_CONFIG, ['does-not-exist'], definitions);
    expect(result).toEqual(DEFAULT_COMBAT_CONFIG);
  });
});
