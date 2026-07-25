import { describe, expect, it } from 'vitest';
import { createRng, weightedSample } from './rng';

const RARITY = { common: 70, rare: 22, epic: 7, legendary: 1 };
const tierOf = (id: string) => id.split(':')[0];

describe('weightedSample', () => {
  const pool = ['common:a', 'common:b', 'common:c', 'rare:a', 'rare:b', 'epic:a', 'legendary:a'];

  it('returns the requested number of DISTINCT items', () => {
    for (let seed = 0; seed < 40; seed++) {
      const picked = weightedSample(pool, 3, tierOf, RARITY, createRng(seed));
      expect(picked).toHaveLength(3);
      expect(new Set(picked).size).toBe(3);
    }
  });

  it('never returns more than the pool holds', () => {
    const picked = weightedSample(['common:a', 'rare:a'], 5, tierOf, RARITY, createRng(1));
    expect(picked).toHaveLength(2);
  });

  it('copes with a pool missing whole tiers', () => {
    const onlyCommons = ['common:a', 'common:b'];
    const picked = weightedSample(onlyCommons, 2, tierOf, RARITY, createRng(2));
    expect(picked.sort()).toEqual(onlyCommons);
  });

  it('still fills the offer when every present tier has zero weight', () => {
    const picked = weightedSample(['mystery:a', 'mystery:b'], 2, tierOf, RARITY, createRng(3));
    expect(picked).toHaveLength(2);
  });

  it('is deterministic for a seed and skews toward the heavier tiers', () => {
    const a = weightedSample(pool, 3, tierOf, RARITY, createRng(7));
    const b = weightedSample(pool, 3, tierOf, RARITY, createRng(7));
    expect(a).toEqual(b);

    // Over many draws, commons should dominate legendaries by a wide margin.
    let commons = 0;
    let legendaries = 0;
    for (let seed = 0; seed < 400; seed++) {
      const tier = tierOf(weightedSample(pool, 1, tierOf, RARITY, createRng(seed))[0]);
      if (tier === 'common') commons++;
      if (tier === 'legendary') legendaries++;
    }
    expect(commons).toBeGreaterThan(legendaries * 10);
  });
});
