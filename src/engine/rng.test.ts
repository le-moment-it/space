import { describe, expect, it } from 'vitest';
import { createRng, shuffle } from './rng';

describe('createRng', () => {
  it('produces the same sequence for the same seed', () => {
    const a = createRng(42);
    const b = createRng(42);
    const seqA = Array.from({ length: 10 }, () => a.next());
    const seqB = Array.from({ length: 10 }, () => b.next());
    expect(seqA).toEqual(seqB);
  });

  it('produces different sequences for different seeds', () => {
    const a = createRng(1);
    const b = createRng(2);
    const seqA = Array.from({ length: 10 }, () => a.next());
    const seqB = Array.from({ length: 10 }, () => b.next());
    expect(seqA).not.toEqual(seqB);
  });

  it('next() stays within [0, 1)', () => {
    const rng = createRng(7);
    for (let i = 0; i < 1000; i++) {
      const value = rng.next();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it('nextInt(max) stays within [0, max)', () => {
    const rng = createRng(123);
    for (let i = 0; i < 1000; i++) {
      const value = rng.nextInt(6);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(6);
      expect(Number.isInteger(value)).toBe(true);
    }
  });

  it('pick() only returns elements from the given array', () => {
    const rng = createRng(9);
    const items = ['a', 'b', 'c'];
    for (let i = 0; i < 50; i++) {
      expect(items).toContain(rng.pick(items));
    }
  });

  it('pick() throws on an empty array', () => {
    const rng = createRng(1);
    expect(() => rng.pick([])).toThrow();
  });
});

describe('shuffle', () => {
  it('returns an array with the same elements', () => {
    const rng = createRng(5);
    const items = [1, 2, 3, 4, 5];
    const shuffled = shuffle(items, rng);
    expect(shuffled).toHaveLength(items.length);
    expect([...shuffled].sort()).toEqual([...items].sort());
  });

  it('does not mutate the input array', () => {
    const rng = createRng(5);
    const items = [1, 2, 3, 4, 5];
    const original = [...items];
    shuffle(items, rng);
    expect(items).toEqual(original);
  });

  it('is deterministic for a given seed', () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8];
    const a = shuffle(items, createRng(99));
    const b = shuffle(items, createRng(99));
    expect(a).toEqual(b);
  });
});
