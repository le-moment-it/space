import type { CardRarity } from './types';

/**
 * How likely each rarity is per offer slot, by where the offer comes from.
 *
 * Sources differ on purpose, so route choice matters: elites are the reliable way
 * to see high rarity, the shop is where you hunt (and pay a premium), and a cache
 * is a lucky free find. Weights are relative, not percentages — a pool missing a
 * tier just redistributes across the tiers it has.
 */
export type OfferSource = 'combat' | 'elite' | 'shop' | 'cache';

export const RARITY_ODDS: Record<OfferSource, Record<CardRarity, number>> = {
  combat: { common: 70, rare: 22, epic: 7, legendary: 1 },
  elite: { common: 45, rare: 35, epic: 16, legendary: 4 },
  shop: { common: 55, rare: 30, epic: 12, legendary: 3 },
  cache: { common: 65, rare: 25, epic: 9, legendary: 1 },
};

/** Salvage added to a shop price on top of the energy-cost term, by rarity. */
export const RARITY_PRICE_PREMIUM: Record<CardRarity, number> = {
  common: 0,
  rare: 15,
  epic: 35,
  legendary: 60,
};
