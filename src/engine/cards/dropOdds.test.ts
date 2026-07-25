import { describe, expect, it } from 'vitest';
import { createRng, weightedSample } from '../rng';
import { effectiveRarityOdds } from './dropOdds';
import { rarityWeightsFor, type OfferSource } from './rarityOdds';
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

const LEVEL = 20;

const percentOf = (rows: ReturnType<typeof effectiveRarityOdds>, rarity: CardRarity) =>
  rows.find((r) => r.rarity === rarity)!.percent;

describe('effectiveRarityOdds', () => {
  it('reproduces the declared weights when every tier is stocked', () => {
    const { pool, cardDefinitions } = makePool({ common: 9, rare: 9, epic: 9, legendary: 9 });

    const rows = effectiveRarityOdds(pool, 'combat', cardDefinitions, LEVEL);

    // Level-20 combat weights are 480/280/170/70, summing to 1000.
    expect(percentOf(rows, 'common')).toBeCloseTo(48);
    expect(percentOf(rows, 'rare')).toBeCloseTo(28);
    expect(percentOf(rows, 'epic')).toBeCloseTo(17);
    expect(percentOf(rows, 'legendary')).toBeCloseTo(7);
  });

  it('redistributes a missing tier across the tiers that remain', () => {
    const { pool, cardDefinitions } = makePool({ common: 5, rare: 5, legendary: 5 });

    const rows = effectiveRarityOdds(pool, 'combat', cardDefinitions, LEVEL);

    // Epic's share is gone, so the rest renormalise across what remains.
    const w = rarityWeightsFor(LEVEL, 'combat');
    const remaining = w.common + w.rare + w.legendary;
    expect(percentOf(rows, 'epic')).toBe(0);
    expect(percentOf(rows, 'common')).toBeCloseTo((w.common / remaining) * 100);
    expect(percentOf(rows, 'rare')).toBeCloseTo((w.rare / remaining) * 100);
    expect(percentOf(rows, 'legendary')).toBeCloseTo((w.legendary / remaining) * 100);
  });

  it('reads 100% common on a common-only pool, as a fresh profile does', () => {
    const { pool, cardDefinitions } = makePool({ common: 12 });

    const rows = effectiveRarityOdds(pool, 'elite', cardDefinitions, LEVEL);

    expect(percentOf(rows, 'common')).toBe(100);
    expect(percentOf(rows, 'rare')).toBe(0);
    expect(percentOf(rows, 'epic')).toBe(0);
    expect(percentOf(rows, 'legendary')).toBe(0);
  });

  it('reports how many cards back each tier, so a 0% is explainable', () => {
    const { pool, cardDefinitions } = makePool({ common: 3, epic: 2 });

    const rows = effectiveRarityOdds(pool, 'shop', cardDefinitions, LEVEL);

    expect(rows.find((r) => r.rarity === 'common')!.available).toBe(3);
    expect(rows.find((r) => r.rarity === 'epic')!.available).toBe(2);
    expect(rows.find((r) => r.rarity === 'rare')!.available).toBe(0);
  });

  it('always reports the designed weight, even for a tier you cannot roll', () => {
    const { pool, cardDefinitions } = makePool({ common: 1 });
    const rows = effectiveRarityOdds(pool, 'elite', cardDefinitions, LEVEL);
    expect(rows.find((r) => r.rarity === 'legendary')!.weight).toBe(
      rarityWeightsFor(LEVEL, 'elite').legendary,
    );
    expect(rows.find((r) => r.rarity === 'legendary')!.percent).toBe(0);
  });

  it('returns zeroes rather than dividing by zero on an empty pool', () => {
    const rows = effectiveRarityOdds([], 'combat', {}, LEVEL);
    expect(rows.map((r) => r.percent)).toEqual([0, 0, 0, 0]);
  });

  it('ignores ids with no definition', () => {
    const { pool, cardDefinitions } = makePool({ common: 2 });
    const rows = effectiveRarityOdds([...pool, 'does-not-exist'], 'cache', cardDefinitions, LEVEL);
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
    source: OfferSource,
    level: number,
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
        rarityWeightsFor(level, source),
        rng,
      );
      const rarity = rarityOf(cardDefinitions[picked] ?? {});
      counts[rarity] = (counts[rarity] ?? 0) + 1;
    }
    return counts;
  };

  // Every source at the bottom, middle and top of the curve: if the screen and the
  // engine ever disagree about how level shifts the odds, one of these fails.
  const CASES = (['combat', 'elite', 'shop', 'cache'] as const).flatMap((source) =>
    [1, 10, 20].map((level) => [source, level] as [OfferSource, number]),
  );

  it.each(CASES)('for a %s offer at level %i', (source, level) => {
    const { pool, cardDefinitions } = makePool({ common: 20, rare: 20, epic: 20, legendary: 20 });
    const draws = 20000;

    const observed = observe(pool, cardDefinitions, source, level, draws);
    const predicted = effectiveRarityOdds(pool, source, cardDefinitions, level);

    for (const row of predicted) {
      const actual = ((observed[row.rarity] ?? 0) / draws) * 100;
      // One percentage point is roughly 3 standard errors at 20k draws, so this
      // catches a real disagreement without failing on an unlucky seed.
      expect(Math.abs(actual - row.percent)).toBeLessThan(1);
    }
  });

  it('matches after a tier is removed from the pool', () => {
    const { pool, cardDefinitions } = makePool({ common: 20, rare: 20, legendary: 20 });
    const draws = 20000;

    const observed = observe(pool, cardDefinitions, 'combat', LEVEL, draws);
    const predicted = effectiveRarityOdds(pool, 'combat', cardDefinitions, LEVEL);

    expect(observed.epic ?? 0).toBe(0);
    for (const row of predicted) {
      const actual = ((observed[row.rarity] ?? 0) / draws) * 100;
      expect(Math.abs(actual - row.percent)).toBeLessThan(1);
    }
  });
});
