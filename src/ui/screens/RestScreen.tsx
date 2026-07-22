import { useRunStore } from '../../state/runStore';

export function RestScreen() {
  const run = useRunStore((s) => s.run);
  const leaveNode = useRunStore((s) => s.leaveNode);

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
