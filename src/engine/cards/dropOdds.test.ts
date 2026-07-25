import { describe, expect, it } from 'vitest';
import { createRng, weightedSample } from '../rng';
import { effectiveRarityOdds } from './dropOdds';
import { RARITY_ODDS } from './rarityOdds';
import { rarityOf, type CardDefinition, type CardRarity } from './types';

/** A pool with `counts[rarity]` cards of each rarity. */
function makePool(counts: Partial<Record<CardRarity, number>>) {
  const cardDefinitions: Record<string, CardDefinition> = {};
  const pool: string[] = [];
  for (const [rarity, n] of Object.entries(counts) as [CardRarity, number][]) {
    for (let i = 0; i < n; i++) {
      const id = `${rarity}-${i}`;
      cardDefinitions[id] = {
        id,
        name: id,
        type: 'weapon',
        cost: 1,
        description: '',
        effect: { kind: 'damage', amount: 1 },
        ...(rarity === 'common' ? {} : { rarity }),
      };
      pool.push(id);
    }
  }
  return { pool, cardDefinitions };
}

const percentOf = (rows: ReturnType<typeof effectiveRarityOdds>, rarity: CardRarity) =>
  rows.find((r) => r.rarity === rarity)!.percent;

describe('effectiveRarityOdds', () => {
  it('reproduces the declared weights when every tier is stocked', () => {
    const { pool, cardDefinitions } = makePool({ common: 9, rare: 9, epic: 9, legendary: 9 });

    const rows = effectiveRarityOdds(pool, 'combat', cardDefinitions);

    // combat weights sum to 100, so the percentages are the weights themselves.
    expect(percentOf(rows, 'common')).toBeCloseTo(70);
    expect(percentOf(rows, 'rare')).toBeCloseTo(22);
    expect(percentOf(rows, 'epic')).toBeCloseTo(7);
    expect(percentOf(rows, 'legendary')).toBeCloseTo(1);
  });

  it('redistributes a missing tier across the tiers that remain', () => {
    const { pool, cardDefinitions } = makePool({ common: 5, rare: 5, legendary: 5 });

    const rows = effectiveRarityOdds(pool, 'combat', cardDefinitions);

    // Epic's 7 is gone, so the rest renormalise over 93 rather than 100.
    expect(percentOf(rows, 'epic')).toBe(0);
    expect(percentOf(rows, 'common')).toBeCloseTo((70 / 93) * 100);
    expect(percentOf(rows, 'rare')).toBeCloseTo((22 / 93) * 100);
    expect(percentOf(rows, 'legendary')).toBeCloseTo((1 / 93) * 100);
  });

  it('reads 100% common on a common-only pool, as a fresh profile does', () => {
    const { pool, cardDefinitions } = makePool({ common: 12 });

    const rows = effectiveRarityOdds(pool, 'elite', cardDefinitions);

    expect(percentOf(rows, 'common')).toBe(100);
    expect(percentOf(rows, 'rare')).toBe(0);
    expect(percentOf(rows, 'epic')).toBe(0);
    expect(percentOf(rows, 'legendary')).toBe(0);
  });

  it('reports how many cards back each tier, so a 0% is explainable', () => {
    const { pool, cardDefinitions } = makePool({ common: 3, epic: 2 });

    const rows = effectiveRarityOdds(pool, 'shop', cardDefinitions);

    expect(rows.find((r) => r.rarity === 'common')!.available).toBe(3);
    expect(rows.find((r) => r.rarity === 'epic')!.available).toBe(2);
    expect(rows.find((r) => r.rarity === 'rare')!.available).toBe(0);
  });

  it('always reports the designed weight, even for a tier you cannot roll', () => {
    const { pool, cardDefinitions } = makePool({ common: 1 });
    const rows = effectiveRarityOdds(pool, 'elite', cardDefinitions);
    expect(rows.find((r) => r.rarity === 'legendary')!.weight).toBe(4);
    expect(rows.find((r) => r.rarity === 'legendary')!.percent).toBe(0);
  });

  it('returns zeroes rather than dividing by zero on an empty pool', () => {
    const rows = effectiveRarityOdds([], 'combat', {});
    expect(rows.map((r) => r.percent)).toEqual([0, 0, 0, 0]);
  });

  it('ignores ids with no definition', () => {
    const { pool, cardDefinitions } = makePool({ common: 2 });
    const rows = effectiveRarityOdds([...pool, 'does-not-exist'], 'cache', cardDefinitions);
    expect(rows.find((r) => r.rarity === 'common')!.available).toBe(2);
  });
});

/**
 * The screen must never quietly disagree with the engine. These sample what
 * `weightedSample` actually does and check the predicted percentages match.
 */
describe('effectiveRarityOdds matches what weightedSample really draws', () => {
  const observe = (
    pool: string[],
    cardDefinitions: Record<string, CardDefinition>,
    source: keyof typeof RARITY_ODDS,
    draws: number,
  ) => {
    const counts: Record<string, number> = {};
    // One long stream, not a fresh seed per draw: reseeding would sample mulberry32's
    // seed-to-first-output mapping rather than the generator itself.
    const rng = createRng(1234);
    for (let i = 0; i < draws; i++) {
      // One card per draw: the first slot is the probability the screen states.
      const [picked] = weightedSample(
        pool,
        1,
        (id) => rarityOf(cardDefinitions[id] ?? {}),
        RARITY_ODDS[source],
        rng,
      );
      const rarity = rarityOf(cardDefinitions[picked] ?? {});
      counts[rarity] = (counts[rarity] ?? 0) + 1;
    }
    return counts;
  };

  it.each(['combat', 'elite', 'shop', 'cache'] as const)('for a %s offer', (source) => {
    const { pool, cardDefinitions } = makePool({ common: 20, rare: 20, epic: 20, legendary: 20 });
    const draws = 20000;

    const observed = observe(pool, cardDefinitions, source, draws);
    const predicted = effectiveRarityOdds(pool, source, cardDefinitions);

    for (const row of predicted) {
      const actual = ((observed[row.rarity] ?? 0) / draws) * 100;
      // Sampling noise at 20k draws is well under a point.
      expect(actual).toBeCloseTo(row.percent, 0);
    }
  });

  it('matches after a tier is removed from the pool', () => {
    const { pool, cardDefinitions } = makePool({ common: 20, rare: 20, legendary: 20 });
    const draws = 20000;

    const observed = observe(pool, cardDefinitions, 'combat', draws);
    const predicted = effectiveRarityOdds(pool, 'combat', cardDefinitions);

    expect(observed.epic ?? 0).toBe(0);
    for (const row of predicted) {
      expect(((observed[row.rarity] ?? 0) / draws) * 100).toBeCloseTo(row.percent, 0);
    }
  });
});
