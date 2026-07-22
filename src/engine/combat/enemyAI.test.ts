import { describe, expect, it } from 'vitest';
import { intentForTurn } from './enemyAI';
import type { Intent } from './types';

describe('intentForTurn', () => {
  const pattern: Intent[] = [
    { kind: 'attack', amount: 6 },
    { kind: 'defend', amount: 8 },
  ];

  it('cycles through the pattern', () => {
    expect(intentForTurn(pattern, 0)).toEqual({ kind: 'attack', amount: 6 });
    expect(intentForTurn(pattern, 1)).toEqual({ kind: 'defend', amount: 8 });
    expect(intentForTurn(pattern, 2)).toEqual({ kind: 'attack', amount: 6 });
    expect(intentForTurn(pattern, 5)).toEqual({ kind: 'defend', amount: 8 });
  });

  it('throws on an empty pattern', () => {
    expect(() => intentForTurn([], 0)).toThrow();
  });
});
