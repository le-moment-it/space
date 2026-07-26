import { cardDefinitions } from '../../data/cards';
import { eventDefinitions } from '../../data/events';
import type { EventEffect } from '../../engine/events/types';
import type { RunState } from '../../engine/run/types';
import { useTranslation, type Translator } from '../../i18n';
import { useGameStore } from '../../state/gameStore';
import './EventScreen.css';

export function EventScreen({ run }: { run: RunState }) {
  const resolveEvent = useGameStore((s) => s.resolveEvent);
  const tr = useTranslation();
  const def = eventDefinitions.find((e) => e.id === run.activeEventId);
  if (!def) return null;

  return (
    <section className="screen screen--focus panel">
      <p className="eyebrow">{tr.t('event.eyebrow')}</p>
      <h2>{tr.eventTitle(def.id)}</h2>
      <p className="screen__sub">{tr.eventPrompt(def.id)}</p>
      <div className="choices">
        {def.choices.map((choice, index) => (
          <button key={index} className="choice" onClick={() => resolveEvent(index)}>
            <span className="choice__label">{tr.eventChoice(def.id, index)}</span>
            <span className="choice__outcomes">
              {choice.effects.map((effect, i) => (
                <Outcome key={i} effect={effect} tr={tr} />
              ))}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

/**
 * What a choice actually costs and pays, printed on the button.
 *
 * The amounts were always in the data and never on screen, so "dock and salvage the
 * wreck" was a blind bet: you could not tell 8 hull for 25 salvage from 30 hull for 5.
 * Rendered from the same `effects` array the engine resolves, so the two cannot
 * disagree — a retuned event updates its own button.
 */
function Outcome({ effect, tr }: { effect: EventEffect; tr: Translator }) {
  const { t, cardName } = tr;

  switch (effect.kind) {
    case 'hull':
      return effect.amount < 0 ? (
        <span className="outcome outcome--cost">
          {t('event.outcome.hullLoss', { amount: Math.abs(effect.amount) })}
        </span>
      ) : (
        <span className="outcome outcome--repair">
          {t('event.outcome.hullGain', { amount: effect.amount })}
        </span>
      );
    case 'salvage':
      return (
        <span className="outcome outcome--salvage">
          {t('event.outcome.salvage', { amount: effect.amount })}
        </span>
      );
    case 'addCard':
      return (
        <span className="outcome outcome--card" data-type={cardDefinitions[effect.cardId]?.type}>
          {t('event.outcome.card', { name: cardName(effect.cardId) })}
        </span>
      );
    case 'nothing':
      return <span className="outcome outcome--nothing">{t('event.outcome.nothing')}</span>;
    default: {
      const exhaustive: never = effect;
      throw new Error(`Unhandled event effect: ${JSON.stringify(exhaustive)}`);
    }
  }
}
