import { crewDefinitions } from '../../data/crew';
import type { RunState } from '../../engine/run/types';
import { useTranslation } from '../../i18n';
import { useGameStore } from '../../state/gameStore';
import './CrewScreen.css';

export function DialogueScreen({ run }: { run: RunState }) {
  const meta = useGameStore((s) => s.meta);
  const dismissDialogue = useGameStore((s) => s.dismissDialogue);
  const tr = useTranslation();
  const crew = run.activeCrewId ? crewDefinitions[run.activeCrewId] : undefined;
  if (!crew) return null;

  // timesRecruited was already incremented when the recruitment happened, so the
  // 1st-ever meeting shows dialogues[0]; once exhausted, the last line repeats.
  const timesRecruited = meta.crew[crew.id]?.timesRecruited ?? 1;
  const dialogueIndex = Math.min(timesRecruited - 1, crew.dialogues.length - 1);
  const line = tr.crewDialogue(crew.id, dialogueIndex);

  return (
    <section className="screen screen--focus panel crew">
      <div className="crew__head">
        <span className="crew__portrait">{crew.portrait}</span>
        <div>
          <p className="eyebrow" style={{ color: 'var(--card-crew)' }}>
            {tr.t('crew.comms')}
          </p>
          <h2>{tr.crewName(crew.id)}</h2>
          <p className="crew__role">{tr.crewRole(crew.id)}</p>
        </div>
      </div>
      <blockquote className="crew__line">&ldquo;{line}&rdquo;</blockquote>
      <button className="btn-primary" onClick={dismissDialogue}>
        {tr.t('common.continue')}
      </button>
    </section>
  );
}
