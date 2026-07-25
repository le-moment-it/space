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

/** Overrides applied at one upgrade tier. Any omitted field keeps the base value. */
export interface CardUpgrade {
  effect?: CardEffect;
  extraEffects?: CardEffect[];
  cost?: number;
  exhaust?: boolean;
}

export interface CardDefinition {
  id: string;
  name: string;
  type: CardType;
  cost: number;
  description: string;
  /** The headline effect: drives the card art and the default upgrade step. */
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
   * Explicit stats for [level 1, level 2]. Omitted means the tiers are derived by
   * DEFAULT_UPGRADE_STEP — declare this only for cards the default rule serves badly
   * (or to make an upgrade change cost / drop exhaust rather than raise a number).
   */
  upgrades?: [CardUpgrade, CardUpgrade];
}

/** The single source of truth for the default: an undeclared rarity is common. */
export function rarityOf(card: Pick<CardDefinition, 'rarity'>): CardRarity {
  return card.rarity ?? 'common';
}

/**
 * How much one upgrade tier adds, per effect kind, when a card declares no explicit
 * upgrades. Split by magnitude on purpose: damage/shield/heal are big numbers (2–22)
 * where +2 is a modest bump, while power/weaken/draw are small (1–4) where +2 a tier
 * would be wild — draw 1 -> 5 is a different card, not an upgraded one.
 */
const DEFAULT_UPGRADE_STEP: Record<CardEffect['kind'], number> = {
  damage: 2,
  shield: 2,
  heal: 2,
  power: 1,
  weaken: 1,
  draw: 1,
  corrosion: 2,
  breach: 1,
  calibration: 1,
  deflector: 1,
  charge: 1,
};

/**
 * The card as actually played at a given upgrade level: explicit tier stats if the
 * card declares them, otherwise the base effect stepped by DEFAULT_UPGRADE_STEP.
 * Level 0 returns `def` itself, so unupgraded cards stay referentially identical.
 */
export function resolveCard(def: CardDefinition, level: UpgradeLevel): CardDefinition {
  if (level <= 0) return def;

  // Start from the default rule, then let any declared override replace individual
  // fields on top. So `upgrades: [{ cost: 0 }, ...]` reads as "cheaper AND stronger"
  // rather than silently cancelling the stat gain.
  //
  // Only the HEADLINE effect is stepped. Stepping every effect would make a
  // three-effect card gain three times as much per tier as a simple one; a card
  // that wants its extra effects to grow declares them in `upgrades`.
  const step = DEFAULT_UPGRADE_STEP[def.effect.kind] * level;
  const stepped: CardDefinition = {
    ...def,
    effect: { ...def.effect, amount: def.effect.amount + step },
  };

  const override = def.upgrades?.[level - 1];
  if (!override) return stepped;

  return {
    ...stepped,
    effect: override.effect ?? stepped.effect,
    extraEffects: override.extraEffects ?? stepped.extraEffects,
    cost: Math.max(0, override.cost ?? stepped.cost),
    exhaust: override.exhaust ?? stepped.exhaust,
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
