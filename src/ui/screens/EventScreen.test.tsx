import { render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { cardDefinitions } from '../../data/cards';
import { eventDefinitions } from '../../data/events';
import type { RunState } from '../../engine/run/types';
import { useGameStore } from '../../state/gameStore';
import { EventScreen } from './EventScreen';

/** A run parked on the given event, which is all this screen reads. */
const runOn = (eventId: string): RunState => {
  useGameStore.getState().startNewRun();
  const run = useGameStore.getState().run;
  if (!run) throw new Error('expected a run');
  return { ...run, phase: 'event', activeEventId: eventId };
};

const choiceButtons = () => screen.getAllByRole('button');

beforeEach(() => {
  localStorage.clear();
});

describe('EventScreen', () => {
  it('prints what each choice costs and pays', () => {
    render(<EventScreen run={runOn('derelict-signal')} />);

    // "Dock and salvage the wreck" is -8 hull for +25 salvage.
    const dock = choiceButtons()[0];
    expect(within(dock).getByText('−8 hull')).toBeInTheDocument();
    expect(within(dock).getByText('+25 salvage')).toBeInTheDocument();
  });

  it('names the card a choice grants', () => {
    render(<EventScreen run={runOn('adrift-cargo-pod')} />);

    expect(screen.getByText(`+ ${cardDefinitions['hull-patch'].name}`)).toBeInTheDocument();
  });

  it('says so when a choice does nothing', () => {
    render(<EventScreen run={runOn('derelict-signal')} />);

    expect(within(choiceButtons()[1]).getByText('No effect')).toBeInTheDocument();
  });

  /**
   * The whole point of the screen: a player should never have to guess. If an event
   * gains an effect kind with no chip, this fails rather than shipping a blind choice.
   */
  it.each(eventDefinitions.map((e) => [e.id] as const))(
    'shows an outcome for every effect of every choice in %s',
    (eventId) => {
      const def = eventDefinitions.find((e) => e.id === eventId)!;
      render(<EventScreen run={runOn(eventId)} />);

      def.choices.forEach((choice, index) => {
        const chips = choiceButtons()[index].querySelectorAll('.outcome');
        expect(chips).toHaveLength(choice.effects.length);
        for (const chip of chips) expect(chip.textContent?.trim()).toBeTruthy();
      });
    },
  );

  it('renders nothing for an event id that does not exist', () => {
    const { container } = render(<EventScreen run={runOn('not-an-event')} />);
    expect(container).toBeEmptyDOMElement();
  });
});
