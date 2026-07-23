import { cardDefinitions } from '../../data/cards';
import { crewDefinitions } from '../../data/crew';
import type { RunState } from '../../engine/run/types';
import { useGameStore } from '../../state/gameStore';

export function CrewOfferScreen({ run }: { run: RunState }) {
  const resolveCrewOffer = useGameStore((s) => s.resolveCrewOffer);
  const crew = run.activeCrewId ? crewDefinitions[run.activeCrewId] : undefined;
  if (!crew) return null;

  return (
    <section>
      <h2>
        {crew.portrait} {crew.name}
      </h2>
      <p>
        <em>{crew.role}</em>
      </p>
      <p>{crew.recruitPrompt}</p>
      <p>
        Joins with: {crew.cardIds.map((id) => cardDefinitions[id].name).join(', ')}
        {crew.passive && ' — plus a passive bonus while aboard'}
      </p>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button onClick={() => resolveCrewOffer(true)}>Welcome aboard</button>
        <button onClick={() => resolveCrewOffer(false)}>Leave them</button>
      </div>
    </section>
  );
}
