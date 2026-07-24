import { eventDefinitions } from '../../data/events';
import type { RunState } from '../../engine/run/types';
import { useTranslation } from '../../i18n';
import { useGameStore } from '../../state/gameStore';

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
        {def.choices.map((_, index) => (
          <button key={index} onClick={() => resolveEvent(index)}>
            {tr.eventChoice(def.id, index)}
          </button>
        ))}
      </div>
    </section>
  );
}
