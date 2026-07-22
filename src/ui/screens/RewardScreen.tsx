import { shipSystemDefinitions } from '../../data/shipSystems';
import type { RunState } from '../../engine/run/types';
import { useGameStore } from '../../state/gameStore';

export function RewardScreen({ run }: { run: RunState }) {
  const chooseShipSystem = useGameStore((s) => s.chooseShipSystem);
  if (!run.rewardOptions) return null;

  return (
    <section>
      <h2>Choose a Ship System</h2>
      <p>Sector cleared — install one upgrade for the rest of this run.</p>
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        {run.rewardOptions.map((id) => {
          const def = shipSystemDefinitions[id];
          return (
            <button
              key={id}
              onClick={() => chooseShipSystem(id)}
              style={{ textAlign: 'left', maxWidth: '14rem' }}
            >
              <strong>{def.name}</strong>
              <br />
              {def.description}
            </button>
          );
        })}
      </div>
    </section>
  );
}
