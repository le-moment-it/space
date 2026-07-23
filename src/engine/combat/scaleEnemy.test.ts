import { describe, expect, it } from 'vitest';
import { scaleEnemy } from './scaleEnemy';
import type { EnemyDefinition } from './types';

const base: EnemyDefinition = {
  id: 'base',
  name: 'Base Ship',
  maxHull: 40,
  intentPattern: [
    { kind: 'attack', amount: 10 },
    { kind: 'defend', amount: 8 },
  ],
};

describe('scaleEnemy', () => {
  it('returns identical numbers at multiplier 1', () => {
    const result = scaleEnemy(base, 1, { id: 'copy', name: 'Copy' });
    expect(result.maxHull).toBe(40);
    expect(result.intentPattern).toEqual(base.intentPattern);
  });

  it('scales hull and every intent amount, rounding to the nearest integer', () => {
    const result = scaleEnemy(base, 1.35, { id: 'scaled', name: 'Scaled Ship' });
    expect(result.maxHull).toBe(54); // 40 * 1.35 = 54
    expect(result.intentPattern).toEqual([
      { kind: 'attack', amount: 14 }, // 10 * 1.35 = 13.5 -> 14
      { kind: 'defend', amount: 11 }, // 8 * 1.35 = 10.8 -> 11
    ]);
  });

  it('applies the given id/name overrides, not the base ones', () => {
    const result = scaleEnemy(base, 1, { id: 'new-id', name: 'New Name' });
    expect(result.id).toBe('new-id');
    expect(result.name).toBe('New Name');
  });

  it('does not mutate the base definition', () => {
    const before = JSON.stringify(base);
    scaleEnemy(base, 2, { id: 'x', name: 'X' });
    expect(JSON.stringify(base)).toBe(before);
  });
});
