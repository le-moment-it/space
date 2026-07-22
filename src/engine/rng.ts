/**
 * Seeded PRNG (mulberry32). Deterministic: the same seed always produces the
 * same sequence, so map generation and combat can be reproduced for tests
 * and debugging (and later, shareable/daily seeds).
 */
export interface Rng {
  /** Returns a float in [0, 1). */
  next(): number;
  /** Returns an integer in [0, max). */
  nextInt(max: number): number;
  /** Returns a random element of a non-empty array. */
  pick<T>(items: readonly T[]): T;
}

export function createRng(seed: number): Rng {
  let state = seed >>> 0;

  const next = (): number => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const nextInt = (max: number): number => Math.floor(next() * max);

  const pick = <T>(items: readonly T[]): T => {
    if (items.length === 0) {
      throw new Error('Rng.pick called with an empty array');
    }
    return items[nextInt(items.length)];
  };

  return { next, nextInt, pick };
}

/** Fisher-Yates shuffle. Returns a new array; does not mutate the input. */
export function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = rng.nextInt(i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** Picks one value from a weighted list (e.g. map node types, loot tables). */
export function weightedPick<T>(entries: readonly { value: T; weight: number }[], rng: Rng): T {
  const total = entries.reduce((sum, entry) => sum + entry.weight, 0);
  if (total <= 0) {
    throw new Error('weightedPick requires at least one entry with positive weight');
  }
  let roll = rng.next() * total;
  for (const entry of entries) {
    if (roll < entry.weight) return entry.value;
    roll -= entry.weight;
  }
  return entries[entries.length - 1].value;
}
