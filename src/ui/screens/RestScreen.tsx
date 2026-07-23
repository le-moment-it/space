import type { RunState } from '../../engine/run/types';
import { useGameStore } from '../../state/gameStore';

export function RestScreen({ run }: { run: RunState }) {
  const leaveNode = useGameStore((s) => s.leaveNode);

  return (
    <section className="screen screen--focus panel">
      <p className="eyebrow" style={{ color: 'var(--repair)' }}>
        Repair bay
      </p>
      <h2>Systems restored</h2>
      <p className="screen__sub">
        Hull patched to{' '}
        <b className="mono" style={{ color: 'var(--repair)' }}>
          {run.hull}/{run.maxHull}
        </b>
        .
      </p>
      <button className="btn-primary" onClick={leaveNode}>
        Continue
      </button>
    </section>
  );
}
