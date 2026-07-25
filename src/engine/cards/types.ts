export type CardType = 'weapon' | 'maneuver' | 'shipSystem' | 'crew';

export type CardRarity = 'common' | 'rare' | 'epic' | 'legendary';

/** Rarity ascending — useful for sorting and for weighting drops. */
export const CARD_RARITIES: CardRarity[] = ['common', 'rare', 'epic', 'legendary'];

export type CardEffect =
  | { kind: 'damage'; amount: number }
  | { kind: 'shield'; amount: number }
  | { kind: 'heal'; amount: number }
  | { kind: 'power'; amount: number }
  | { kind: 'weaken'; amount: number; duration: number }
  | { kind: 'draw'; amount: number };

export interface CardDefinition {
  id: string;
  name: string;
  type: CardType;
  cost: number;
  description: string;
  effect: CardEffect;
  /** Omitted means 'common' — see rarityOf(). Every launch card is common. */
  rarity?: CardRarity;
  /**
   * Exhaust: playing this card removes it from the fight instead of discarding it,
   * so it cannot be drawn again this combat. A modifier rather than an effect kind,
   * so any effect can exhaust. The run deck is untouched — it returns next fight.
   */
  exhaust?: boolean;
}

/** The single source of truth for the default: an undeclared rarity is common. */
export function rarityOf(card: Pick<CardDefinition, 'rarity'>): CardRarity {
  return card.rarity ?? 'common';
}

/** One physical copy of a card as it moves between deck/hand/discard. */
export interface CardInstance {
  instanceId: string;
  cardId: string;
}
