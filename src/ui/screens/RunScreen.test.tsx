import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RunScreen } from './RunScreen';

describe('RunScreen', () => {
  it('renders the star chart at the start of a run', () => {
    render(<RunScreen />);
    expect(screen.getByRole('heading', { name: /star chart/i })).toBeInTheDocument();
    expect(screen.getByText(/hull:/i)).toBeInTheDocument();
    expect(screen.getByText(/salvage:/i)).toBeInTheDocument();
  });
});
