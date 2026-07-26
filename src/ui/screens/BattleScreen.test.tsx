import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cardDefinitions } from '../../data/cards';
import { initCombat } from '../../engine/combat/resolve';
import { DEFAULT_COMBAT_CONFIG, type EnemyDefinition } from '../../engine/combat/types';
import { createRng } from '../../engine/rng';
import { BattleScreen } from './BattleScreen';

const enemy: EnemyDefinition = {
  id: 'test-enemy',
  name: 'Test Enemy',
  maxHull: 30,
  intentPattern: [{ kind: 'attack', amount: 5 }],
};

/** A hand of `count` copies of one card, so every card is identical and affordable. */
const combatWith = (cardId: string, count = 3, power = 3) => {
  const state = initCombat({
    cardDefinitions,
    startingDeck: Array.from({ length: count }, () => ({ cardId, level: 0 as const })),
    enemy,
    rng: createRng(1),
    config: { ...DEFAULT_COMBAT_CONFIG, drawAmount: count, playerMaxPower: power },
  });
  return { ...state, player: { ...state.player, power } };
};

const arena = () => document.querySelector('.battle__arena') as HTMLElement;
const handCards = () => within(screen.getByRole('list')).getAllByRole('button');

/** jsdom has no layout, so getBoundingClientRect is all zeroes — give the arena one. */
const stubArenaRect = (rect: Partial<DOMRect>) => {
  vi.spyOn(arena(), 'getBoundingClientRect').mockReturnValue({
    left: 0,
    top: 0,
    right: 500,
    bottom: 300,
    width: 500,
    height: 300,
    x: 0,
    y: 0,
    toJSON: () => ({}),
    ...rect,
  } as DOMRect);
};

/**
 * jsdom has no PointerEvent, and testing-library's `fireEvent.pointerDown` falls back
 * to a bare Event that silently drops `button` and `clientX` — which would make every
 * assertion below pass for the wrong reason. A MouseEvent with a pointer type does
 * reach React's handler and carries the coordinates.
 */
const pointer = (el: HTMLElement, type: string, x: number, y: number, button = 0) =>
  fireEvent(el, new MouseEvent(type, { bubbles: true, button, clientX: x, clientY: y }));

/** Presses at `from`, moves to `to`, releases there. */
const dragCard = (card: HTMLElement, from: [number, number], to: [number, number]) => {
  pointer(card, 'pointerdown', from[0], from[1]);
  pointer(card, 'pointermove', to[0], to[1]);
  pointer(card, 'pointerup', to[0], to[1]);
};

beforeEach(() => {
  // Pointer capture is not implemented in jsdom.
  Element.prototype.setPointerCapture = vi.fn();
  Element.prototype.releasePointerCapture = vi.fn();
});

const noop = () => {};

describe('BattleScreen — playing a card', () => {
  it('still plays on a plain click', () => {
    const onPlayCard = vi.fn();
    render(
      <BattleScreen
        combat={combatWith('flak-burst')}
        onPlayCard={onPlayCard}
        onEndTurn={noop}
        onContinue={noop}
      />,
    );

    fireEvent.click(handCards()[0]);

    expect(onPlayCard).toHaveBeenCalledTimes(1);
  });

  it('plays a card dragged onto the arena', () => {
    const onPlayCard = vi.fn();
    render(
      <BattleScreen
        combat={combatWith('flak-burst')}
        onPlayCard={onPlayCard}
        onEndTurn={noop}
        onContinue={noop}
      />,
    );
    stubArenaRect({});

    dragCard(handCards()[0], [250, 400], [250, 150]);

    expect(onPlayCard).toHaveBeenCalledTimes(1);
  });

  it('does not play a card released outside the arena', () => {
    const onPlayCard = vi.fn();
    render(
      <BattleScreen
        combat={combatWith('flak-burst')}
        onPlayCard={onPlayCard}
        onEndTurn={noop}
        onContinue={noop}
      />,
    );
    stubArenaRect({});

    // Dropped well below the arena's bottom edge.
    dragCard(handCards()[0], [250, 400], [250, 480]);

    expect(onPlayCard).not.toHaveBeenCalled();
  });

  it('treats a press that barely moves as a click, not a drag', () => {
    const onPlayCard = vi.fn();
    render(
      <BattleScreen
        combat={combatWith('flak-burst')}
        onPlayCard={onPlayCard}
        onEndTurn={noop}
        onContinue={noop}
      />,
    );
    stubArenaRect({});
    const card = handCards()[0];

    // 3px of travel is under the drag threshold, so the click still owns it.
    pointer(card, 'pointerdown', 250, 400);
    pointer(card, 'pointermove', 252, 398);
    pointer(card, 'pointerup', 252, 398);
    fireEvent.click(card);

    expect(onPlayCard).toHaveBeenCalledTimes(1);
  });

  it('plays a dragged card once, not twice', () => {
    const onPlayCard = vi.fn();
    render(
      <BattleScreen
        combat={combatWith('flak-burst')}
        onPlayCard={onPlayCard}
        onEndTurn={noop}
        onContinue={noop}
      />,
    );
    stubArenaRect({});
    const card = handCards()[0];

    // A real pointer sequence fires click after pointerup; the drag must swallow it.
    dragCard(card, [250, 400], [250, 150]);
    fireEvent.click(card);

    expect(onPlayCard).toHaveBeenCalledTimes(1);
  });

  it('drags from the effect text, not just the card border', () => {
    // The guard against dragging off a keyword once matched every `.kw`, and plain
    // coloured emphasis in the effect text is a `.kw` — so pressing almost anywhere
    // on a card silently refused to drag.
    const onPlayCard = vi.fn();
    render(
      <BattleScreen
        combat={combatWith('flak-burst')}
        onPlayCard={onPlayCard}
        onEndTurn={noop}
        onContinue={noop}
      />,
    );
    stubArenaRect({});
    const emphasis = within(handCards()[0]).getByText(/damage/i);

    pointer(emphasis, 'pointerdown', 250, 400);
    pointer(emphasis, 'pointermove', 250, 150);
    pointer(emphasis, 'pointerup', 250, 150);

    expect(onPlayCard).toHaveBeenCalledTimes(1);
  });

  it('does not drag when the press lands on an interactive keyword', () => {
    const onPlayCard = vi.fn();
    render(
      <BattleScreen
        combat={combatWith('failsafe-screen')}
        onPlayCard={onPlayCard}
        onEndTurn={noop}
        onContinue={noop}
      />,
    );
    stubArenaRect({});
    // Failsafe Screen prints the Exhaust chip, which owns its own press.
    const chip = within(handCards()[0]).getByText(/^exhaust$/i);

    pointer(chip, 'pointerdown', 250, 400);
    pointer(chip, 'pointermove', 250, 150);
    pointer(chip, 'pointerup', 250, 150);

    expect(onPlayCard).not.toHaveBeenCalled();
  });

  it('right-click never starts a drag or plays the card', () => {
    const onPlayCard = vi.fn();
    render(
      <BattleScreen
        combat={combatWith('flak-burst')}
        onPlayCard={onPlayCard}
        onEndTurn={noop}
        onContinue={noop}
      />,
    );
    stubArenaRect({});
    const card = handCards()[0];

    pointer(card, 'pointerdown', 250, 400, 2);
    pointer(card, 'pointermove', 250, 150, 2);
    pointer(card, 'pointerup', 250, 150, 2);

    expect(onPlayCard).not.toHaveBeenCalled();
  });
});

describe('BattleScreen — a card you cannot afford', () => {
  /** siege-cannon costs 3; with 0 power it is unaffordable. */
  const brokeCombat = () => {
    const state = combatWith('siege-cannon', 3, 3);
    return { ...state, player: { ...state.player, power: 0 } };
  };

  it('neither clicks nor drags', () => {
    const onPlayCard = vi.fn();
    render(
      <BattleScreen
        combat={brokeCombat()}
        onPlayCard={onPlayCard}
        onEndTurn={noop}
        onContinue={noop}
      />,
    );
    stubArenaRect({});
    const card = handCards()[0];
    expect(card).toHaveAttribute('aria-disabled', 'true');

    fireEvent.click(card);
    dragCard(card, [250, 400], [250, 150]);

    expect(onPlayCard).not.toHaveBeenCalled();
  });

  it('still opens its upgrade preview on right-click', () => {
    render(
      <BattleScreen combat={brokeCombat()} onPlayCard={noop} onEndTurn={noop} onContinue={noop} />,
    );

    fireEvent.contextMenu(handCards()[0]);

    expect(screen.getByRole('dialog', { name: /upgrade path/i })).toBeInTheDocument();
  });
});

describe('BattleScreen — layout', () => {
  it('shows the energy orb, both piles and the end turn button', () => {
    render(
      <BattleScreen
        combat={combatWith('flak-burst')}
        onPlayCard={noop}
        onEndTurn={noop}
        onContinue={noop}
      />,
    );

    expect(document.querySelector('.orb__value')?.textContent).toBe('3');
    expect(screen.getByLabelText(/draw pile: /i)).toBeInTheDocument();
    expect(screen.getByLabelText(/discard pile: /i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /end turn/i })).toBeInTheDocument();
  });

  it('lays the whole hand out in one fan, however many cards it holds', () => {
    render(
      <BattleScreen
        combat={combatWith('flak-burst', 9)}
        onPlayCard={noop}
        onEndTurn={noop}
        onContinue={noop}
      />,
    );

    expect(handCards()).toHaveLength(9);
    expect(document.querySelectorAll('.handfan__slot')).toHaveLength(9);
  });
});
