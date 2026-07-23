import { shipSystemDefinitions } from '../../data/shipSystems';
import type { RunState } from '../../engine/run/types';
import { useGameStore } from '../../state/gameStore';

export function RewardScreen({ run }: { run: RunState }) {
  const chooseShipSystem = useGameStore((s) => s.chooseShipSystem);
  if (!run.rewardOptions) return null;

  return (
    <section className="screen">
      <header className="screen__head">
        <p className="eyebrow" style={{ color: 'var(--plasma)' }}>
          Boss reward
        </p>
        <h2>Install a ship system</h2>
        <p className="screen__sub">One upgrade, bolted on for the rest of the run.</p>
      </header>
      <div className="reward-grid">
        {run.rewardOptions.map((id) => {
          const def = shipSystemDefinitions[id];
          return (
            <button key={id} className="reward-option" onClick={() => chooseShipSystem(id)}>
              <span className="reward-option__name">{def.name}</span>
              <span className="reward-option__desc">{def.description}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
