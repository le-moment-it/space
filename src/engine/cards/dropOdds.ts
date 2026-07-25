import { CARD_RARITIES, rarityOf, type CardDefinition, type CardRarity } from './types';
import { RARITY_ODDS, type OfferSource } from './rarityOdds';

export interface RarityChance {
  rarity: CardRarity;
  /** The designed weight for this source, before any pool filtering. */
  weight: number;
  /** What you will actually see, as a percentage of one offered card. */
  percent: number;
  /** How many cards of this rarity the pool holds — why a 0% is 0%. */
  available: number;
}

/**
 * The rarity odds a player actually experiences from one offer slot.
 *
 * `RARITY_ODDS` are relative weights, not percentages, and the pools they draw from
 * are filtered to what the player has unlocked. `weightedSample` therefore rolls only
 * among tiers that still have cards and renormalises across them — so a profile with
 * no Epics unlocked sees that 7% redistributed, not wasted. This reproduces that
 * arithmetic so the Rules screen can never quietly disagree with the engine.
 *
 * Exact rather than approximate for a single slot. Across a 3-card offer it stays
 * exact unless a tier is *exhausted* mid-offer, which needs a tier with fewer than 3
 * cards to be drawn dry first.
 */
export function effectiveRarityOdds(
  pool: readonly string[],
  source: OfferSource,
  cardDefinitions: Record<string, CardDefinition>,
): RarityChance[] {
  const weights = RARITY_ODDS[source];

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
