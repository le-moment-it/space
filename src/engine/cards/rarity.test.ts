import { describe, expect, it } from 'vitest';
import { cardDefinitions, defaultLoadoutCardIds, defaultUnlockedCardIds } from '../../data/cards';
import { milestoneDefinitions } from '../../data/milestones';
import { CARD_RARITIES, rarityOf } from './types';

describe('card rarity', () => {
  it('defaults to common when a card declares no rarity', () => {
    expect(rarityOf({})).toBe('common');
    expect(rarityOf({ rarity: undefined })).toBe('common');
  });

  it('returns the declared rarity when present', () => {
    for (const rarity of CARD_RARITIES) {
      expect(rarityOf({ rarity })).toBe(rarity);
    }
  });

  it('resolves every shipped card to a known rarity', () => {
    for (const card of Object.values(cardDefinitions)) {
      expect(CARD_RARITIES).toContain(rarityOf(card));
    }
  });

  it('treats cards that declare no rarity as common', () => {
    const undeclared = Object.values(cardDefinitions).filter((c) => c.rarity === undefined);
    expect(undeclared.length).toBeGreaterThan(0);
    for (const card of undeclared) {
      expect(rarityOf(card)).toBe('common');
    }
  });
});

/**
 * A fresh profile builds its first deck out of the default-unlocked list, so anything
 * above Common in there is handed to a brand-new player for free — which is exactly
 * how every Rare, Epic and Legendary once ended up available at game start.
 */
describe('unlock curve', () => {
  it('unlocks only common cards by default', () => {
    const notCommon = defaultUnlockedCardIds.filter(
      (id) => rarityOf(cardDefinitions[id]) !== 'common',
    );
    expect(notCommon).toEqual([]);
  });

  it('starts every player on a loadout they have actually unlocked', () => {
    const unlocked = new Set(defaultUnlockedCardIds);
    expect(defaultLoadoutCardIds.filter((id) => !unlocked.has(id))).toEqual([]);
  });

  it('names a real card in every default and milestone unlock list', () => {
    const ids = [
      ...defaultUnlockedCardIds,
      ...milestoneDefinitions.flatMap((m) => m.unlocksCardIds),
    ];
    expect(ids.filter((id) => !cardDefinitions[id])).toEqual([]);
  });

  it('leaves no card above common unreachable', () => {
    const reachable = new Set([
      ...defaultUnlockedCardIds,
      ...milestoneDefinitions.flatMap((m) => m.unlocksCardIds),
    ]);
    const stranded = Object.values(cardDefinitions)
      .filter((c) => rarityOf(c) !== 'common' && c.type !== 'crew')
      .map((c) => c.id)
      .filter((id) => !reachable.has(id));
    expect(stranded).toEqual([]);
  });

  it('gates the strongest cards behind the latest milestones', () => {
    const legendaries = milestoneDefinitions.filter((m) =>
      m.unlocksCardIds.some((id) => rarityOf(cardDefinitions[id]) === 'legendary'),
    );
    expect(legendaries.length).toBeGreaterThan(0);
    // Milestones are listed in rough order of effort; Legendaries belong at the end.
    for (const milestone of legendaries) {
      expect(milestoneDefinitions.indexOf(milestone)).toBeGreaterThanOrEqual(
        milestoneDefinitions.length - 2,
      );
    }
  });
});
