import { render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { cardDefinitions, defaultUnlockedCardIds } from '../../data/cards';
import { rarityOf } from '../../engine/cards/types';
import { createEmptySave } from '../../engine/save/schema';
import { SAVE_DEFAULTS, useGameStore } from '../../state/gameStore';
import { RulesScreen } from './RulesScreen';

const setUnlocked = (unlockedCardIds: string[]) => {
  const meta = createEmptySave(SAVE_DEFAULTS).meta;
  useGameStore.setState({ meta: { ...meta, unlockedCardIds } });
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
    setUnlocked(defaultUnlockedCardIds);
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

  it('reports 100% common on a fresh profile, because nothing else is unlocked', () => {
    render(<RulesScreen />);

    // Default unlocks are all common, so every source can only offer commons.
    expect(oddsRow(/combat win/i)).toEqual(['100%', '0%', '0%', '0%']);
    expect(oddsRow(/trader/i)).toEqual(['100%', '0%', '0%', '0%']);
  });

  it('shows the designed weights once every tier is unlocked', () => {
    setUnlocked(Object.keys(cardDefinitions));
    render(<RulesScreen />);

    expect(oddsRow(/combat win/i)).toEqual(['70%', '22%', '7%', '1%']);
    expect(oddsRow(/elite win/i)).toEqual(['45%', '35%', '16%', '4%']);
    expect(oddsRow(/trader/i)).toEqual(['55%', '30%', '12%', '3%']);
    expect(oddsRow(/derelict cache/i)).toEqual(['65%', '25%', '9%', '1%']);
  });

  it('redistributes a locked tier rather than leaving its share unclaimed', () => {
    // Everything but the legendaries.
    setUnlocked(
      Object.keys(cardDefinitions).filter((id) => rarityOf(cardDefinitions[id]) !== 'legendary'),
    );
    render(<RulesScreen />);

    const [common, rare, epic, legendary] = oddsRow(/combat win/i);
    expect(legendary).toBe('0%');
    // 70/22/7 renormalised over 99. Small values keep a decimal so 1% and 0.5%
    // stay distinguishable; larger ones round.
    expect(common).toBe('71%');
    expect(rare).toBe('22%');
    expect(epic).toBe('7.1%');
  });

  it('counts how many cards of each rarity you have unlocked', () => {
    render(<RulesScreen />);
    // 12 default commons out of the full common pool.
    expect(screen.getByText(/^12 unlocked of \d+$/)).toBeInTheDocument();
    expect(screen.getAllByText(/^0 unlocked of \d+$/).length).toBeGreaterThan(0);
  });
});
