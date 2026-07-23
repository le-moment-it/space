import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { defaultLoadoutCardIds } from '../../data/cards';
import { useGameStore } from '../../state/gameStore';
import { StartScreen } from './StartScreen';

describe('StartScreen', () => {
  beforeEach(() => {
    localStorage.clear();
    useGameStore.setState((s) => ({
      meta: { ...s.meta, loadoutCardIds: [...defaultLoadoutCardIds] },
    }));
  });

  it('shows the launch button enabled with a full default loadout', () => {
    render(<StartScreen onEditDeck={() => {}} />);
    const launch = screen.getByRole('button', { name: /launch new run/i });
    expect(launch).toBeEnabled();
  });

  it('disables launch and warns when the deck is short', () => {
    useGameStore.setState((s) => ({ meta: { ...s.meta, loadoutCardIds: ['kinetic-cannon'] } }));
    render(<StartScreen onEditDeck={() => {}} />);
    expect(screen.getByRole('button', { name: /launch new run/i })).toBeDisabled();
    expect(screen.getByText(/needs 10 cards/i)).toBeInTheDocument();
  });
});
