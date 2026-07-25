import { describe, expect, it } from 'vitest';
import { MAX_LEVEL } from '../progression/level';
import { rarityWeightsFor, SOURCE_LEVEL_BONUS, type OfferSource } from './rarityOdds';
import { CARD_RARITIES, type CardRarity } from './types';

const SOURCES: OfferSource[] = ['combat', 'cache', 'shop', 'elite'];

/** The share of a tier, as a fraction of the whole roll. */
const share = (level: number, source: OfferSource, rarity: CardRarity) => {
  const w = rarityWeightsFor(level, source);
  const total = CARD_RARITIES.reduce((sum, r) => sum + w[r], 0);
  return w[rarity] / total;
};

describe('rarityWeightsFor', () => {
  it('matches the curve exactly at a defined anchor', () => {
    expect(rarityWeightsFor(1, 'combat')).toEqual({
      common: 960,
      rare: 30,
      epic: 8,
      legendary: 2,
    });
    expect(rarityWeightsFor(20, 'combat')).toEqual({
      common: 480,
      rare: 280,
      epic: 170,
      legendary: 70,
    });
  });

  it('interpolates between anchors', () => {
    // Level 3 is halfway from the level-1 anchor to the level-5 one.
    const w = rarityWeightsFor(3, 'combat');
    expect(w.common).toBeCloseTo((960 + 880) / 2);
    expect(w.rare).toBeCloseTo((30 + 80) / 2);
  });

  it('gives a real, tiny chance of every rarity from level 1', () => {
    // The point of the rework: nothing is impossible on a fresh profile.
    for (const rarity of CARD_RARITIES) {
      expect(share(1, 'combat', rarity)).toBeGreaterThan(0);
    }
    expect(share(1, 'combat', 'legendary')).toBeLessThan(0.005);
    expect(share(1, 'combat', 'rare')).toBeGreaterThan(0.02);
    expect(share(1, 'combat', 'rare')).toBeLessThan(0.05);
  });

  it('moves monotonically with level: common only falls, the rest only rise', () => {
    for (const source of SOURCES) {
      for (let level = 2; level <= MAX_LEVEL; level++) {
        expect(share(level, source, 'common')).toBeLessThan(share(level - 1, source, 'common'));
        for (const rarity of ['rare', 'epic', 'legendary'] as const) {
          expect(share(level, source, rarity)).toBeGreaterThan(share(level - 1, source, rarity));
        }
      }
    }
  });

  it('keeps sources ordered at every level — elite richest, combat leanest', () => {
    for (let level = 1; level <= MAX_LEVEL; level++) {
      const legendary = (s: OfferSource) => share(level, s, 'legendary');
      expect(legendary('cache')).toBeGreaterThan(legendary('combat'));
      expect(legendary('shop')).toBeGreaterThan(legendary('cache'));
      expect(legendary('elite')).toBeGreaterThan(legendary('shop'));
    }
  });

  it('keeps elites ahead of combat even at the cap', () => {
    // The curve runs past MAX_LEVEL precisely so source bonuses do not all clamp
    // together and converge at the top.
    expect(share(MAX_LEVEL, 'elite', 'legendary')).toBeGreaterThan(
      share(MAX_LEVEL, 'combat', 'legendary'),
    );
  });

  it('clamps the level rather than extrapolating off the curve', () => {
    expect(rarityWeightsFor(0, 'combat')).toEqual(rarityWeightsFor(1, 'combat'));
    expect(rarityWeightsFor(-5, 'combat')).toEqual(rarityWeightsFor(1, 'combat'));
    expect(rarityWeightsFor(999, 'combat')).toEqual(rarityWeightsFor(MAX_LEVEL, 'combat'));
  });

  it('reads a source bonus as exactly that many levels further along', () => {
    // combat at 10 + the shop's bonus must equal shop at 10.
    const bonus = SOURCE_LEVEL_BONUS.shop;
    expect(rarityWeightsFor(10, 'shop')).toEqual(rarityWeightsFor(10 + bonus, 'combat'));
  });
});
