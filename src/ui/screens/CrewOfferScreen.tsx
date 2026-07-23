import { cardDefinitions } from '../../data/cards';
import { crewDefinitions } from '../../data/crew';
import type { RunState } from '../../engine/run/types';
import { Card } from '../components/Card';
import { useGameStore } from '../../state/gameStore';
import './CrewScreen.css';

export function CrewOfferScreen({ run }: { run: RunState }) {
  const resolveCrewOffer = useGameStore((s) => s.resolveCrewOffer);
  const crew = run.activeCrewId ? crewDefinitions[run.activeCrewId] : undefined;
  if (!crew) return null;

  return (
    <section className="screen screen--focus panel crew">
      <div className="crew__head">
        <span className="crew__portrait">{crew.portrait}</span>
        <div>
          <p className="eyebrow" style={{ color: 'var(--card-crew)' }}>
            Distress signal
          </p>
          <h2>{crew.name}</h2>
          <p className="crew__role">{crew.role}</p>
        </div>
      </div>

      <p className="crew__prompt">{crew.recruitPrompt}</p>

      <div className="crew__joins">
        {crew.cardIds.map((id) => (
          <Card key={id} card={cardDefinitions[id]} />
        ))}
      </div>
      {crew.passive && <p className="crew__passive">Grants a passive bonus while aboard.</p>}

      <div className="choices choices--row">
        <button className="btn-primary" onClick={() => resolveCrewOffer(true)}>
          Welcome aboard
        </button>
        <button onClick={() => resolveCrewOffer(false)}>Leave them</button>
      </div>
    </section>
  );
}
