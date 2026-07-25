import { MAX_LEVEL } from '../progression/level';
import type { CardRarity } from './types';

/**
 * Where a card offer comes from. Sources differ on purpose, so route choice matters:
 * elites are the reliable way to see high rarity, the shop is where you hunt (and pay
 * a premium), and a cache is a lucky free find.
 */
export type OfferSource = 'combat' | 'elite' | 'shop' | 'cache';

/**
 * How much better each source is, expressed as levels rather than a second table.
 *
 * One curve to tune instead of four, and the ordering can never drift apart: a shop
 * offer simply reads the curve four levels further along than a combat reward.
 */
export const SOURCE_LEVEL_BONUS: Record<OfferSource, number> = {
  combat: 0,
  cache: 2,
  shop: 4,
  elite: 7,
};

export type RarityWeights = Record<CardRarity, number>;

/**
 * The rarity curve, in per-mille — a level-1 Legendary is 0.2%, which whole percent
 * cannot express. Values are relative weights, so only their ratios matter.
 *
 * Every card is in the pool from run 1; the curve alone decides how likely each tier
 * is. The table runs past MAX_LEVEL because source bonuses read further along it — an
 * elite at level 20 reads level 27, which is what keeps elites better than combat at
 * the cap instead of converging with it.
 */
const CURVE: { level: number; weights: RarityWeights }[] = [
  { level: 1, weights: { common: 960, rare: 30, epic: 8, legendary: 2 } },
  { level: 5, weights: { common: 880, rare: 80, epic: 30, legendary: 10 } },
  { level: 10, weights: { common: 760, rare: 150, epic: 70, legendary: 20 } },
  { level: 15, weights: { common: 620, rare: 220, epic: 120, legendary: 40 } },
  { level: 20, weights: { common: 480, rare: 280, epic: 170, legendary: 70 } },
  { level: 27, weights: { common: 400, rare: 310, epic: 200, legendary: 90 } },
];

const RARITIES: CardRarity[] = ['common', 'rare', 'epic', 'legendary'];

/** Linearly interpolated weights at any point on the curve, clamped at both ends. */
function weightsAtCurve(point: number): RarityWeights {
  const first = CURVE[0];
  const last = CURVE[CURVE.length - 1];
  if (point <= first.level) return { ...first.weights };
  if (point >= last.level) return { ...last.weights };

  const upperIndex = CURVE.findIndex((anchor) => anchor.level >= point);
  const upper = CURVE[upperIndex];
  const lower = CURVE[upperIndex - 1];
  const t = (point - lower.level) / (upper.level - lower.level);

  const weights = {} as RarityWeights;
  for (const rarity of RARITIES) {
    weights[rarity] = lower.weights[rarity] + (upper.weights[rarity] - lower.weights[rarity]) * t;
  }
  return weights;
}

/**
 * The rarity weights a player of `level` faces from `source`.
 *
 * The single place the curve is read: `offerCards` uses it to draw and the Rules
 * screen uses it (via `effectiveRarityOdds`) to display, so the two cannot drift.
 */
export function rarityWeightsFor(level: number, source: OfferSource): RarityWeights {
  const clamped = Math.min(Math.max(Math.floor(level) || 1, 1), MAX_LEVEL);
  return weightsAtCurve(clamped + SOURCE_LEVEL_BONUS[source]);
}

/** Salvage added to a shop price on top of the energy-cost term, by rarity. */
export const RARITY_PRICE_PREMIUM: Record<CardRarity, number> = {
  common: 0,
  rare: 15,
  epic: 35,
  legendary: 60,
};
