import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { AchievementsScreen } from './AchievementsScreen';

describe('AchievementsScreen', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders stats, milestones, crew codex, and endings sections', () => {
    render(<AchievementsScreen />);
    expect(screen.getByRole('heading', { name: /achievements/i })).toBeInTheDocument();
    expect(screen.getByText(/runs won/i)).toBeInTheDocument();
    // Section eyebrow labels (exact match, to avoid the descriptive subtitle prose).
    expect(screen.getByText('Milestones')).toBeInTheDocument();
    expect(screen.getByText('Crew codex')).toBeInTheDocument();
    expect(screen.getByText('Endings')).toBeInTheDocument();
  });
});
