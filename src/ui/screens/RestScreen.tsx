import type { RunState } from '../../engine/run/types';
import { useGameStore } from '../../state/gameStore';

export function RestScreen({ run }: { run: RunState }) {
  const leaveNode = useGameStore((s) => s.leaveNode);

  return (
    <section>
      <h2>Repair Bay</h2>
      <p>
        Hull restored. Current hull: {run.hull}/{run.maxHull}.
      </p>
      <button onClick={leaveNode}>Continue</button>
    </section>
  );
}
