import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { crewDefinitions } from '../../data/crew';
import { crewArt } from '../art/crew';
import { CrewPortrait } from './CrewPortrait';

describe('crew art registry', () => {
  /**
   * Filenames come from a manual art process, so a typo (`Torque.png`, `dr_elara_voss.png`)
   * would silently leave that crew member on their emoji forever. Fail loudly instead.
   */
  it('maps every portrait file to a real crew id', () => {
    const unknown = Object.keys(crewArt).filter((id) => !crewDefinitions[id]);
    expect(unknown, `portrait files matching no crew id: ${unknown.join(', ')}`).toEqual([]);
  });

  it('has a portrait for all six crew', () => {
    const missing = Object.keys(crewDefinitions).filter((id) => !crewArt[id]);
    expect(missing, `crew still on the emoji fallback: ${missing.join(', ')}`).toEqual([]);
  });
});

describe('CrewPortrait', () => {
  it('renders the portrait art for a crew member who has it', () => {
    const { container } = render(<CrewPortrait crewId="torque" size="lg" />);

    const img = container.querySelector('img');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('data-crew', 'torque');
    // Decorative: every call site prints the name right beside it, so a described
    // portrait would make a screen reader announce the name twice.
    expect(img).toHaveAttribute('alt', '');
    expect(container.querySelector('.crewportrait--lg')).toBeInTheDocument();
  });

  it('falls back to the emoji when a crew member has no art yet', async () => {
    // Portraits arrive one at a time; a crew member without one must still render.
    vi.resetModules();
    vi.doMock('../art/crew', () => ({ crewArt: {} }));
    const { CrewPortrait: Unarted } = await import('./CrewPortrait');

    const { container } = render(<Unarted crewId="torque" size="sm" />);

    expect(container.querySelector('img')).not.toBeInTheDocument();
    expect(container.textContent).toBe(crewDefinitions['torque'].portrait);
    vi.doUnmock('../art/crew');
  });

  it('renders the unknown mark for a crew member not yet met', () => {
    const { container } = render(<CrewPortrait crewId={null} size="md" />);

    expect(container.querySelector('img')).not.toBeInTheDocument();
    expect(container.textContent).toBe('?');
    expect(container.querySelector('.crewportrait--unknown')).toBeInTheDocument();
  });
});
