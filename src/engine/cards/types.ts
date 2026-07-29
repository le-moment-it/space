export type CardType = 'weapon' | 'maneuver' | 'shipSystem';

export type CardRarity = 'common' | 'rare' | 'epic' | 'legendary';

/** Rarity ascending — useful for sorting and for weighting drops. */
export const CARD_RARITIES: CardRarity[] = ['common', 'rare', 'epic', 'legendary'];

export type CardEffect =
  /** `times` > 1 is a multi-hit: each hit is checked against shields separately. */
  | { kind: 'damage'; amount: number; times?: number }
  | { kind: 'shield'; amount: number }
  | { kind: 'heal'; amount: number }
  | { kind: 'power'; amount: number }
  | { kind: 'weaken'; amount: number; duration: number }
  | { kind: 'draw'; amount: number }
  /** Stacking damage over time on the enemy; ticks, then erodes by 1 each turn. */
  | { kind: 'corrosion'; amount: number }
  /** The enemy takes extra damage for `amount` turns. */
  | { kind: 'breach'; amount: number }
  /** +amount damage on every attack for the rest of the combat. */
  | { kind: 'calibration'; amount: number }
  /** +amount on every shield gain for the rest of the combat. */
  | { kind: 'deflector'; amount: number }
  /** Doubles the next effect of the named kind. */
  | { kind: 'charge'; target: 'damage' | 'shield' | 'heal'; amount: number };

export type UpgradeLevel = 0 | 1 | 2;

export const MAX_UPGRADE_LEVEL = 2;

/**
 * A card's stats at one upgrade tier.
 *
 * `effect` is required so the number a tier is worth is always readable in the data,
 * without holding the base card in your head. The modifiers are optional because a
 * tier usually leaves them alone: omitted means "same as the base card".
 */
export interface CardUpgrade {
  effect: CardEffect;
  extraEffects?: CardEffect[];
  cost?: number;
  exhaust?: boolean;
}

export interface CardDefinition {
  id: string;
  name: string;
  type: CardType;
  cost: number;
  /** The headline effect: drives the card art, and the tiers below build on it. */
  effect: CardEffect;
  /**
   * Further effects, resolved in order after the headline one. This is what lets a
   * higher-rarity card do something qualitatively different ("Deal 6 damage AND gain
   * 5 shields") rather than just carrying a bigger number.
   */
  extraEffects?: CardEffect[];
  /** Omitted means 'common' — see rarityOf(). Every launch card is common. */
  rarity?: CardRarity;
  /**
   * Exhaust: playing this card removes it from the fight instead of discarding it,
   * so it cannot be drawn again this combat. A modifier rather than an effect kind,
   * so any effect can exhaust. The run deck is untouched — it returns next fight.
   */
  exhaust?: boolean;
  /**
   * Complete stats at [+, ++]. Required: what an upgrade is worth is a per-card design
   * decision, so a new card cannot ship without one. A shared formula used to fill this
   * in, which meant the same flat step landed on a 2-damage card and a 20-damage one —
   * and, on multi-hit cards, once per hit.
   */
  upgrades: [CardUpgrade, CardUpgrade];
}

/** The single source of truth for the default: an undeclared rarity is common. */
export function rarityOf(card: Pick<CardDefinition, 'rarity'>): CardRarity {
  return card.rarity ?? 'common';
}

/**
 * The card as actually played at a given upgrade level: a lookup, not a calculation.
 * The tuple type guarantees both tiers exist, so there is no "undeclared" branch to
 * fall back on — the numbers on screen are the numbers written in `cards.ts`.
 *
 * Level 0 returns `def` itself, so unupgraded cards stay referentially identical.
 */
export function resolveCard(def: CardDefinition, level: UpgradeLevel): CardDefinition {
  if (level <= 0) return def;

  const tier = def.upgrades[level - 1];
  return {
    ...def,
    effect: tier.effect,
    extraEffects: tier.extraEffects ?? def.extraEffects,
    cost: Math.max(0, tier.cost ?? def.cost),
    exhaust: tier.exhaust ?? def.exhaust,
  };
}

/** Every effect a card resolves, headline first. */
export function effectsOf(def: CardDefinition): CardEffect[] {
  return def.extraEffects ? [def.effect, ...def.extraEffects] : [def.effect];
}

/** One physical copy of a card as it moves between deck/hand/discard. */
export interface CardInstance {
  instanceId: string;
  cardId: string;
  level: UpgradeLevel;
}

/** One copy of a card in a run deck. */
export interface DeckCard {
  cardId: string;
  level: UpgradeLevel;
  /**
   * Which loadout slot this copy came from, if any. Cards picked up mid-run have
   * none — which is exactly what makes them ineligible for a *permanent* upgrade.
   * Stored explicitly rather than inferred from position, so it survives any future
   * feature that removes cards from a deck.
   */
  loadoutIndex?: number;
}

/** A slot in the player's saved starting deck. */
export interface LoadoutCard {
  cardId: string;
  level: UpgradeLevel;
}

/** Raises a level by one tier, never past the cap. */
export function nextLevel(level: UpgradeLevel): UpgradeLevel {
  return Math.min(level + 1, MAX_UPGRADE_LEVEL) as UpgradeLevel;
}
