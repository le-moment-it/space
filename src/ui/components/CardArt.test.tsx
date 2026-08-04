import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { cardDefinitions } from '../../data/cards';
import { cardArt } from '../art/cards';
import { CardArt } from './CardArt';

describe('card art registry', () => {
  /**
   * Filenames come from a manual art process and are the only link between a file and a
   * card. This caught a real one: `apacitor-brace.png` had lost the leading letter, which
   * would otherwise have left Capacitor Brace on its fallback glyph indefinitely while
   * every other card looked finished.
   */
  it('maps every art file to a real card id', () => {
    const unknown = Object.keys(cardArt).filter((id) => !cardDefinitions[id]);
    expect(unknown, `art files matching no card: ${unknown.join(', ')}`).toEqual([]);
  });

  it('has art for all 35 cards', () => {
    const missing = Object.keys(cardDefinitions).filter((id) => !cardArt[id]);
    expect(missing, `cards still on the fallback glyph: ${missing.join(', ')}`).toEqual([]);
  });
});

describe('CardArt', () => {
  it('renders the painted art for a card that has it', () => {
    const { container } = render(
      <CardArt cardId="master-gunner" effect={{ kind: 'calibration', amount: 4 }} />,
    );

    const img = container.querySelector('img');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('data-card', 'master-gunner');
    // Decorative: the card prints its own name and effect directly below.
    expect(img).toHaveAttribute('alt', '');
    expect(container.querySelector('svg')).not.toBeInTheDocument();
  });

  it('falls back to the effect glyph for a card with no art', () => {
    const { container } = render(
      <CardArt cardId="not-a-card" effect={{ kind: 'damage', amount: 4 }} />,
    );

    expect(container.querySelector('img')).not.toBeInTheDocument();
    expect(container.querySelector('svg.card__glyph')).toBeInTheDocument();
  });

  /**
   * The glyph is the safety net for any card added before someone paints it, so it must
   * keep covering every effect kind — its exhaustive switch throws otherwise.
   */
  it('still draws a glyph for every effect kind in the game', () => {
    const kinds = new Map(
      Object.values(cardDefinitions).flatMap((c) =>
        [c.effect, ...(c.extraEffects ?? [])].map((e) => [e.kind, e] as const),
      ),
    );
    for (const [kind, effect] of kinds) {
      const { container } = render(<CardArt cardId="not-a-card" effect={effect} />);
      expect(container.querySelector('svg.card__glyph'), kind).toBeInTheDocument();
    }
  });
});
