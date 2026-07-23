import { eventDefinitions } from '../../data/events';
import type { RunState } from '../../engine/run/types';
import { useGameStore } from '../../state/gameStore';

export function EventScreen({ run }: { run: RunState }) {
  const resolveEvent = useGameStore((s) => s.resolveEvent);
  const def = eventDefinitions.find((e) => e.id === run.activeEventId);
  if (!def) return null;

  return (
    <section className="screen screen--focus panel">
      <p className="eyebrow">Anomaly</p>
      <h2>{def.title}</h2>
      <p className="screen__sub">{def.prompt}</p>
      <div className="choices">
        {def.choices.map((choice, index) => (
          <button key={index} onClick={() => resolveEvent(index)}>
            {choice.label}
          </button>
        ))}
      </div>
    </section>
  );
}
