import { crewDefinitions } from '../../data/crew';
import type { RunState } from '../../engine/run/types';
import { useGameStore } from '../../state/gameStore';

export function DialogueScreen({ run }: { run: RunState }) {
  const meta = useGameStore((s) => s.meta);
  const dismissDialogue = useGameStore((s) => s.dismissDialogue);
  const crew = run.activeCrewId ? crewDefinitions[run.activeCrewId] : undefined;
  if (!crew) return null;

  // timesRecruited was already incremented when the recruitment happened, so the
  // 1st-ever meeting shows dialogues[0]; once exhausted, the last line repeats.
  const timesRecruited = meta.crew[crew.id]?.timesRecruited ?? 1;
  const dialogueIndex = Math.min(timesRecruited - 1, crew.dialogues.length - 1);
  const line = crew.dialogues[dialogueIndex];

  return (
    <section>
      <h2>
        {crew.portrait} {crew.name}
      </h2>
      <p>
        <em>{crew.role}</em>
      </p>
      <blockquote>“{line}”</blockquote>
      <button onClick={dismissDialogue}>Continue</button>
    </section>
  );
}
