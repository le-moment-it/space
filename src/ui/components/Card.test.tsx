import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { cardDefinitions } from '../../data/cards';
import { Card } from './Card';

const kineticCannon = cardDefinitions['kinetic-cannon']; // 1 power, deal 6 damage
const failsafeScreen = cardDefinitions['failsafe-screen']; // has the Exhaust keyword

const openPreview = () => screen.queryByRole('dialog', { name: /upgrade path/i });

describe('Card — upgrade preview', () => {
  it('opens on right-click and shows all three tiers with their real numbers', () => {
    render(<Card card={kineticCannon} />);
    expect(openPreview()).not.toBeInTheDocument();

    fireEvent.contextMenu(screen.getByRole('button'));

    const dialog = openPreview();
    expect(dialog).toBeInTheDocument();
    // Base 6, +2 per tier: 6 / 8 / 10.
    const text = dialog!.textContent ?? '';
    expect(text).toContain('6');
    expect(text).toContain('8');
    expect(text).toContain('10');
    // One column per tier, plus the card that was right-clicked.
    expect(within(dialog!).getAllByRole('button', { name: /kinetic cannon/i })).toHaveLength(3);
  });

  it('marks the tier the copy is actually at', () => {
    render(<Card card={kineticCannon} level={1} />);
    fireEvent.contextMenu(screen.getByRole('button'));

    const current = openPreview()!.querySelector('.upgrade__tier--current');
    expect(current).toBeInTheDocument();
    // The + column, not base.
    expect(current?.textContent).toContain('+');
    expect(current?.textContent).toContain('8');
  });

  it('marks the owned tier, not the displayed one, when they differ', () => {
    // RewardScreen shows a card at the level it WOULD become.
    render(<Card card={kineticCannon} level={2} ownedLevel={1} />);
    fireEvent.contextMenu(screen.getByRole('button'));

    const current = openPreview()!.querySelector('.upgrade__tier--current');
    expect(current?.textContent).toContain('8'); // the +1 column
    expect(current?.textContent).not.toContain('10');
  });

  it('says so when the card is already fully upgraded', () => {
    render(<Card card={kineticCannon} level={2} />);
    fireEvent.contextMenu(screen.getByRole('button'));
    expect(within(openPreview()!).getByText(/fully upgraded/i)).toBeInTheDocument();
  });

  it('does not open nested previews from the cards inside the panel', () => {
    render(<Card card={kineticCannon} />);
    fireEvent.contextMenu(screen.getByRole('button'));

    const inner = within(openPreview()!).getAllByRole('button', { name: /kinetic cannon/i })[0];
    fireEvent.contextMenu(inner);

    // Still exactly one panel.
    expect(screen.getAllByRole('dialog', { name: /upgrade path/i })).toHaveLength(1);
  });

  it('shows the keyword explainer, not the upgrade path, when a keyword is right-clicked', () => {
    render(<Card card={failsafeScreen} />);

    fireEvent.contextMenu(screen.getByText(/^exhaust$/i));

    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    expect(openPreview()).not.toBeInTheDocument();
  });

  it('closes on Escape', () => {
    render(<Card card={kineticCannon} />);
    fireEvent.contextMenu(screen.getByRole('button'));
    expect(openPreview()).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Escape' });

    expect(openPreview()).not.toBeInTheDocument();
  });

  it('right-clicking never plays the card', () => {
    const onClick = vi.fn();
    render(<Card card={kineticCannon} playable onClick={onClick} />);

    fireEvent.contextMenu(screen.getByRole('button', { name: /kinetic cannon/i }));

    expect(openPreview()).toBeInTheDocument();
    expect(onClick).not.toHaveBeenCalled();
  });

  it('still previews a card the player cannot afford', () => {
    // playable=false + onClick present => aria-disabled. Pointer events must survive.
    render(<Card card={kineticCannon} playable={false} onClick={() => {}} />);
    const button = screen.getByRole('button', { name: /kinetic cannon/i });
    expect(button).toHaveAttribute('aria-disabled', 'true');

    fireEvent.contextMenu(button);

    expect(openPreview()).toBeInTheDocument();
  });
});
