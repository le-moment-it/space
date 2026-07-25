import { CARD_RARITIES, rarityOf, type CardDefinition, type CardRarity } from './types';
import { rarityWeightsFor, type OfferSource } from './rarityOdds';

export interface RarityChance {
  rarity: CardRarity;
  /** The curve's weight for this source and level, before any pool filtering. */
  weight: number;
  /** What you will actually see, as a percentage of one offered card. */
  percent: number;
  /** How many cards of this rarity the pool holds — why a 0% is 0%. */
  available: number;
}

/**
 * The rarity odds a player actually experiences from one offer slot.
 *
 * The weights are relative, not percentages, and they move with the player's level.
 * `weightedSample` rolls only among tiers that still have cards and renormalises
 * across them, so a pool missing a tier redistributes its share rather than wasting
 * it. This reproduces that arithmetic — including the level — so the Rules screen can
 * never quietly disagree with the engine.
 *
 * Exact rather than approximate for a single slot. Across a 3-card offer it stays
 * exact unless a tier is *exhausted* mid-offer, which needs a tier with fewer than 3
 * cards to be drawn dry first.
 */
export function effectiveRarityOdds(
  pool: readonly string[],
  source: OfferSource,
  cardDefinitions: Record<string, CardDefinition>,
  level: number,
): RarityChance[] {
  const weights = rarityWeightsFor(level, source);

  const available: Record<CardRarity, number> = {
    common: 0,
    rare: 0,
    epic: 0,
    legendary: 0,
  };
  for (const id of pool) {
    const def = cardDefinitions[id];
    if (def) available[rarityOf(def)] += 1;
  }

  // Only tiers that are both stocked and weighted can be rolled, exactly as in
  // weightedSample, which filters to non-empty buckets with a positive weight.
  const total = CARD_RARITIES.reduce(
    (sum, rarity) => (available[rarity] > 0 ? sum + weights[rarity] : sum),
    0,
  );

  return CARD_RARITIES.map((rarity) => ({
    rarity,
    weight: weights[rarity],
    percent: total > 0 && available[rarity] > 0 ? (weights[rarity] / total) * 100 : 0,
    available: available[rarity],
  }));
}
