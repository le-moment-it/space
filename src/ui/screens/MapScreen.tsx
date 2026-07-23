import type { RunState } from '../../engine/run/types';
import { StarMap } from '../components/StarMap';
import { useGameStore } from '../../state/gameStore';

export function MapScreen({ run }: { run: RunState }) {
  const enterNode = useGameStore((s) => s.enterNode);

  return (
    <section className="screen">
      <header className="screen__head">
        <p className="eyebrow">Navigation</p>
        <h2>Star chart — Act {run.act}</h2>
        <p className="screen__sub">Plot a course. Every path bends toward the boss.</p>
      </header>
      <StarMap run={run} onEnter={enterNode} />
    </section>
  );
}
