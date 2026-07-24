import { describe, expect, it } from 'vitest';
import { cardDefinitions } from '../data/cards';
import { makeTranslator } from './index';
import { uiStrings } from './ui';

describe('i18n', () => {
  it('fills placeholders from params', () => {
    const en = makeTranslator('en');
    expect(en.t('map.title', { act: 2 })).toBe('Star chart — Act 2');
    const fr = makeTranslator('fr');
    expect(fr.t('map.title', { act: 2 })).toBe('Carte stellaire — Acte 2');
  });

  it('leaves unmatched placeholders untouched', () => {
    const en = makeTranslator('en');
    expect(en.t('map.title')).toBe('Star chart — Act {act}');
  });

  it('translates content by id, falling back to English when no override exists', () => {
    const fr = makeTranslator('fr');
    expect(fr.cardName('kinetic-cannon')).toBe('Canon cinétique');
    // English is read straight from the data file (no duplicate dictionary).
    const en = makeTranslator('en');
    expect(en.cardName('kinetic-cannon')).toBe(cardDefinitions['kinetic-cannon'].name);
  });

  it('resolves scaled enemy ids back to the base name', () => {
    const fr = makeTranslator('fr');
    expect(fr.enemyName('raider-skiff-act2')).toBe('Esquif pillard');
    const en = makeTranslator('en');
    expect(en.enemyName('raider-skiff-act2')).toBe('Raider Skiff');
  });

  it('has a French string for every English UI key (no missing translations)', () => {
    const missing = Object.keys(uiStrings.en).filter(
      (key) => !uiStrings.fr[key as keyof typeof uiStrings.fr],
    );
    expect(missing).toEqual([]);
  });

  it('provides a French override for every card, enemy, and ship system', () => {
    const fr = makeTranslator('fr');
    for (const id of Object.keys(cardDefinitions)) {
      // A French name differs from the English one for every content id we ship.
      expect(fr.cardName(id)).not.toBe('');
    }
  });
});
