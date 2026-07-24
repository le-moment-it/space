import { cardDefinitions } from '../../data/cards';
import { crewDefinitions } from '../../data/crew';
import type { RunState } from '../../engine/run/types';
import { useTranslation } from '../../i18n';
import { Card } from '../components/Card';
import { useGameStore } from '../../state/gameStore';
import './CrewScreen.css';

export function CrewOfferScreen({ run }: { run: RunState }) {
  const resolveCrewOffer = useGameStore((s) => s.resolveCrewOffer);
  const tr = useTranslation();
  const crew = run.activeCrewId ? crewDefinitions[run.activeCrewId] : undefined;
  if (!crew) return null;

  return (
    <section className="screen screen--focus panel crew">
      <div className="crew__head">
        <span className="crew__portrait">{crew.portrait}</span>
        <div>
          <p className="eyebrow" style={{ color: 'var(--card-crew)' }}>
            {tr.t('crew.distressSignal')}
          </p>
          <h2>{tr.crewName(crew.id)}</h2>
          <p className="crew__role">{tr.crewRole(crew.id)}</p>
        </div>
      </div>

      <p className="crew__prompt">{tr.crewRecruitPrompt(crew.id)}</p>

      <div className="crew__joins">
        {crew.cardIds.map((id) => (
          <Card key={id} card={cardDefinitions[id]} />
        ))}
      </div>
      {crew.passive && <p className="crew__passive">{tr.t('crew.grantsPassive')}</p>}

      <div className="choices choices--row">
        <button className="btn-primary" onClick={() => resolveCrewOffer(true)}>
          {tr.t('crew.welcomeAboard')}
        </button>
        <button onClick={() => resolveCrewOffer(false)}>{tr.t('crew.leaveThem')}</button>
      </div>
    </section>
  );
}
