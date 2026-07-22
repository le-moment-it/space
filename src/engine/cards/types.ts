export type CardType = 'weapon' | 'maneuver' | 'shipSystem';

export type CardEffect =
  | { kind: 'damage'; amount: number }
  | { kind: 'shield'; amount: number }
  | { kind: 'heal'; amount: number }
  | { kind: 'power'; amount: number }
  | { kind: 'weaken'; amount: number; duration: number };

export interface CardDefinition {
  id: string;
  name: string;
  type: CardType;
  cost: number;
  description: string;
  effect: CardEffect;
}

/** One physical copy of a card as it moves between deck/hand/discard. */
export interface CardInstance {
  instanceId: string;
  cardId: string;
}
