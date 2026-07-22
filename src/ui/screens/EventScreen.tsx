import { eventDefinitions } from '../../data/events';
import { useRunStore } from '../../state/runStore';

export function EventScreen() {
  const run = useRunStore((s) => s.run);
  const resolveEvent = useRunStore((s) => s.resolveEvent);
  const def = eventDefinitions.find((e) => e.id === run.activeEventId);
  if (!def) return null;

  return (
    <section>
      <h2>{def.title}</h2>
      <p>{def.prompt}</p>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {def.choices.map((choice, index) => (
          <button key={index} onClick={() => resolveEvent(index)}>
            {choice.label}
          </button>
        ))}
      </div>
    </section>
  );
}
