import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { AchievementsScreen } from './AchievementsScreen';

describe('AchievementsScreen', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders stats, progress, crew codex, and endings sections', () => {
    render(<AchievementsScreen />);
    expect(screen.getByRole('heading', { name: /achievements/i })).toBeInTheDocument();
    expect(screen.getByText(/runs won/i)).toBeInTheDocument();
    // Section eyebrow labels (exact match, to avoid the descriptive subtitle prose).
    expect(screen.getByText('Progress')).toBeInTheDocument();
    expect(screen.getByText('Crew codex')).toBeInTheDocument();
    expect(screen.getByText('Endings')).toBeInTheDocument();
  });

  it('opens a card preview when a level-unlock card name is clicked', () => {
    render(<AchievementsScreen />);

    // The ladder used to name unlockable cards in plain text — a player could not
    // tell what "Backup Generator" actually does without reaching that level first.
    fireEvent.click(screen.getByRole('button', { name: 'Backup Generator' }));

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveTextContent('Backup Generator');
    expect(dialog).toHaveTextContent(/1 power/i);
  });
});
