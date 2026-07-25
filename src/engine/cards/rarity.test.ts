import { describe, expect, it } from 'vitest';
import { cardDefinitions } from '../../data/cards';
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
