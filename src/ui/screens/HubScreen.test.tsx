import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { HubScreen } from './HubScreen';

describe('HubScreen', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders lifetime stats and a launch button', () => {
    render(<HubScreen />);
    expect(screen.getByRole('heading', { name: /hub/i })).toBeInTheDocument();
    expect(screen.getByText(/runs started/i)).toBeInTheDocument();
    expect(screen.getByText(/cards unlocked/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /launch new run/i })).toBeInTheDocument();
  });
});
