import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { HeroShip } from './HeroShip';

describe('HeroShip', () => {
  it('renders the painted ship when the art exists', () => {
    render(<HeroShip />);

    const img = screen.getByRole('img');
    expect(img.tagName).toBe('IMG');
    expect(img).toHaveAccessibleName(/salvage vessel/i);
  });

  it('carries the drift animation class only when animated', () => {
    const { container: still } = render(<HeroShip />);
    expect(still.querySelector('.heroship--animated')).not.toBeInTheDocument();

    const { container: drifting } = render(<HeroShip animated />);
    expect(drifting.querySelector('.heroship--animated')).toBeInTheDocument();
  });

  it('falls back to the vector ship when there is no art yet', async () => {
    // The vector ship is the reason a missing PNG is not a hole on the title screen.
    vi.resetModules();
    vi.doMock('../art/ship', () => ({ shipArt: undefined }));
    const { HeroShip: Unarted } = await import('./HeroShip');

    const { container } = render(<Unarted />);

    expect(container.querySelector('img')).not.toBeInTheDocument();
    expect(container.querySelector('svg')).toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAccessibleName(/salvage vessel/i);
    vi.doUnmock('../art/ship');
  });
});
