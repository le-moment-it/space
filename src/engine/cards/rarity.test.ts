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

  it('treats every launch card as common', () => {
    for (const card of Object.values(cardDefinitions)) {
      expect(rarityOf(card)).toBe('common');
    }
  });
});
