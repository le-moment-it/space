import { useState } from 'react';
import { CREW_CAP, crewDefinitions } from '../../data/crew';
import type { RunState } from '../../engine/run/types';
import { useTranslation } from '../../i18n';
import { useGameStore } from '../../state/gameStore';
import './CrewScreen.css';

/**
 * A crew recruitment offer. Crew grant a run-long passive and nothing else, so the
 * passive text *is* the decision — it is printed in full rather than summarised.
 *
 * With a full berth the choice becomes a swap, and the roster shows what each person
 * aboard currently does so the trade is legible.
 */
export function CrewOfferScreen({ run }: { run: RunState }) {
  const resolveCrewOffer = useGameStore((s) => s.resolveCrewOffer);
  const tr = useTranslation();
  const [choosingReplacement, setChoosingReplacement] = useState(false);

  const crew = run.activeCrewId ? crewDefinitions[run.activeCrewId] : undefined;
  if (!crew) return null;

  const full = run.crewIds.length >= CREW_CAP;

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

      <div className="crew__grant">
        <p className="eyebrow">{tr.t('crew.grantsPassive')}</p>
        <p className="crew__grant-text">{tr.crewPassive(crew.id)}</p>
      </div>

      {choosingReplacement ? (
        <div className="crew__replace">
          <p className="crew__replace-label">
            {tr.t('crew.full', { count: run.crewIds.length, cap: CREW_CAP })}
          </p>
          <div className="crew__roster">
            {run.crewIds.map((id) => {
              const aboard = crewDefinitions[id];
              if (!aboard) return null;
              return (
                <button
                  key={id}
                  className="crew__member crew__member--action"
                  onClick={() => resolveCrewOffer(true, id)}
                >
                  <span className="crew__member-portrait">{aboard.portrait}</span>
                  <span className="crew__member-text">
                    <span className="crew__member-name">{tr.crewName(id)}</span>
                    <span className="crew__member-passive">{tr.crewPassive(id)}</span>
                  </span>
                  <span className="crew__member-cta mono">{tr.t('crew.replaceWith')}</span>
                </button>
              );
            })}
          </div>
          <div className="choices choices--row">
            <button onClick={() => setChoosingReplacement(false)}>{tr.t('settings.cancel')}</button>
          </div>
        </div>
      ) : (
        <div className="choices choices--row">
          <button
            className="btn-primary"
            onClick={() => (full ? setChoosingReplacement(true) : resolveCrewOffer(true))}
          >
            {tr.t('crew.welcomeAboard')}
          </button>
          <button onClick={() => resolveCrewOffer(false)}>{tr.t('crew.leaveThem')}</button>
        </div>
      )}
    </section>
  );
}
