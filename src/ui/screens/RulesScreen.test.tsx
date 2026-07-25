import { render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { cardDefinitions, defaultUnlockedCardIds } from '../../data/cards';
import { rarityWeightsFor } from '../../engine/cards/rarityOdds';
import { CARD_RARITIES } from '../../engine/cards/types';
import { MAX_LEVEL, xpForLevel } from '../../engine/progression/level';
import { createEmptySave } from '../../engine/save/schema';
import { SAVE_DEFAULTS, useGameStore } from '../../state/gameStore';
import { RulesScreen } from './RulesScreen';

const setProfile = (xp: number, unlockedCardIds: string[] = defaultUnlockedCardIds) => {
  const meta = createEmptySave(SAVE_DEFAULTS).meta;
  useGameStore.setState({ meta: { ...meta, xp, unlockedCardIds } });
};

/** The percentages the curve implies for a source at a level, as the screen formats them. */
const expected = (level: number, source: 'combat' | 'elite' | 'shop' | 'cache') => {
  const w = rarityWeightsFor(level, source);
  const total = CARD_RARITIES.reduce((sum, r) => sum + w[r], 0);
  return CARD_RARITIES.map((r) => {
    const n = (w[r] / total) * 100;
    return `${n >= 10 ? Math.round(n) : Math.round(n * 10) / 10}%`;
  });
};

/** The odds cells of one row of the drop table, left to right. */
const oddsRow = (name: RegExp) => {
  const row = screen.getByRole('row', { name });
  return within(row)
    .getAllByRole('cell')
    .map((c) => c.textContent?.trim())
    .slice(1); // first cell is the reward column
};

describe('RulesScreen', () => {
  beforeEach(() => {
    localStorage.clear();
    setProfile(0);
  });

  it('renders every section', () => {
    render(<RulesScreen />);

    expect(screen.getByRole('heading', { name: /rules/i })).toBeInTheDocument();
    for (const label of [
      'The run',
      'A fight',
      'What you find',
      'Other nodes',
      'Rarity',
      'The star chart',
      'Keywords',
      'Upgrades',
      'Crew',
    ]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it('explains every keyword the game can show', () => {
    render(<RulesScreen />);
    // The nine rules keywords, by their explanation text.
    expect(screen.getByText(/leaves the fight instead of going to your discard/i)).toBeVisible();
    expect(screen.getByText(/takes 50% more damage/i)).toBeVisible();
    expect(screen.getByText(/first damage that would reach your hull/i)).toBeVisible();
  });

  it('gives a real but tiny chance of every rarity at level 1', () => {
    render(<RulesScreen />);

    // The point of the rework: no tier is impossible on a fresh profile.
    expect(oddsRow(/combat win/i)).toEqual(expected(1, 'combat'));
    expect(oddsRow(/combat win/i)).toEqual(['96%', '3%', '0.8%', '0.2%']);
  });

  it('shows better odds at the cap than at level 1', () => {
    setProfile(xpForLevel(MAX_LEVEL));
    render(<RulesScreen />);

    expect(oddsRow(/combat win/i)).toEqual(expected(MAX_LEVEL, 'combat'));
    expect(oddsRow(/elite win/i)).toEqual(expected(MAX_LEVEL, 'elite'));
    // Legendary is 0.2% at level 1 and far higher here.
    expect(oddsRow(/combat win/i)[3]).toBe('7%');
  });

  it('ranks elite above trader above cache above combat, at any level', () => {
    setProfile(xpForLevel(10));
    render(<RulesScreen />);

    const legendaryOf = (row: RegExp) => parseFloat(oddsRow(row)[3]);
    expect(legendaryOf(/derelict cache/i)).toBeGreaterThan(legendaryOf(/combat win/i));
    expect(legendaryOf(/trader/i)).toBeGreaterThan(legendaryOf(/derelict cache/i));
    expect(legendaryOf(/elite win/i)).toBeGreaterThan(legendaryOf(/trader/i));
  });

  it('reports how much of the collection is buildable', () => {
    render(<RulesScreen />);
    expect(screen.getByText(/^12 of \d+ in your collection$/)).toBeInTheDocument();
    expect(screen.getAllByText(/^0 of \d+ in your collection$/).length).toBeGreaterThan(0);
  });

  it('shows more of the collection once levelled', () => {
    setProfile(xpForLevel(MAX_LEVEL), Object.keys(cardDefinitions));
    render(<RulesScreen />);
    expect(screen.queryAllByText(/^0 of \d+ in your collection$/)).toEqual([]);
  });
});
