import type { CardDefinition } from '../engine/cards/types';

/**
 * A card fixture with its upgrade path filled in.
 *
 * Real cards state both tiers explicitly (`src/data/cards.ts`), which is the point —
 * what an upgrade is worth is a design decision, not a formula. But most tests never
 * upgrade their fixtures, and making each one invent two tiers just to satisfy the
 * type would bury what the test is actually about.
 *
 * The default adds +2 then +4 to the headline effect and leaves cost, exhaust and any
 * extra effects alone. Pass `upgrades` when the upgrade is the thing under test.
 */
export function testCard(
  card: Omit<CardDefinition, 'upgrades'>,
  upgrades?: CardDefinition['upgrades'],
): CardDefinition {
  const at = (bonus: number) => ({ ...card.effect, amount: card.effect.amount + bonus });
  return { ...card, upgrades: upgrades ?? [{ effect: at(2) }, { effect: at(4) }] };
}
