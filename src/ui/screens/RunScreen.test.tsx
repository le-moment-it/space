import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useGameStore } from '../../state/gameStore';
import { RunScreen } from './RunScreen';

describe('RunScreen', () => {
  beforeEach(() => {
    localStorage.clear();
    useGameStore.getState().startNewRun();
  });

  it('renders the star chart at the start of a run', () => {
    render(<RunScreen />);
    expect(screen.getByRole('heading', { name: /star chart/i })).toBeInTheDocument();
    // HUD readout chips.
    expect(screen.getByText('Hull')).toBeInTheDocument();
    expect(screen.getByText('Salvage')).toBeInTheDocument();
  });
});
