export type ShipSystemEffect =
  | { kind: 'maxHull'; amount: number }
  | { kind: 'maxPower'; amount: number }
  | { kind: 'baselineShield'; amount: number }
  | { kind: 'drawAmount'; amount: number };

export interface ShipSystemDefinition {
  id: string;
  name: string;
  description: string;
  effect: ShipSystemEffect;
}
