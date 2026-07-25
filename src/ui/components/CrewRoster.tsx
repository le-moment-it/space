import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CREW_CAP, crewDefinitions } from '../../data/crew';
import { useTranslation } from '../../i18n';
import './CrewRoster.css';

/**
 * Who is aboard and what each of them does.
 *
 * Crew passives are invisible once recruited — they change the rules of a fight with
 * nothing on screen to attribute it to — so this is where a player checks why their
 * shields started full or their hand carried over.
 */
export function CrewRoster({ crewIds, onClose }: { crewIds: string[]; onClose: () => void }) {
  const tr = useTranslation();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return createPortal(
    <div
      className="roster-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={tr.t('crew.roster')}
      onClick={onClose}
    >
      <div className="roster" onClick={(e) => e.stopPropagation()}>
        <header className="roster__head">
          <div>
            <p className="eyebrow">{tr.t('crew.roster')}</p>
            <p className="roster__count mono">
              {crewIds.length}/{CREW_CAP}
            </p>
          </div>
          <button className="roster__close" onClick={onClose} aria-label={tr.t('common.close')}>
            ✕
          </button>
        </header>

        {crewIds.length === 0 ? (
          <p className="roster__empty">{tr.t('crew.rosterEmpty')}</p>
        ) : (
          <ul className="roster__list">
            {crewIds.map((id) => {
              const crew = crewDefinitions[id];
              if (!crew) return null;
              return (
                <li key={id} className="crew__member">
                  <span className="crew__member-portrait">{crew.portrait}</span>
                  <span className="crew__member-text">
                    <span className="crew__member-name">{tr.crewName(id)}</span>
                    <span className="crew__member-role">{tr.crewRole(id)}</span>
                    <span className="crew__member-passive">{tr.crewPassive(id)}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>,
    document.body,
  );
}
