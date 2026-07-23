import { cardDefinitions } from '../../data/cards';
import type { RunState } from '../../engine/run/types';
import { Card } from '../components/Card';
import { useGameStore } from '../../state/gameStore';

export function TreasureScreen({ run }: { run: RunState }) {
  const leaveNode = useGameStore((s) => s.leaveNode);
  const reward = run.pendingReward;

  return (
    <section
      className="screen screen--focus panel"
      style={{ alignItems: 'center', textAlign: 'center' }}
    >
      <p className="eyebrow" style={{ color: 'var(--salvage)' }}>
        Derelict cache
      </p>
      <h2>Recovered from the wreck</h2>
      {reward && (
        <p className="screen__sub">
          Salvaged{' '}
          <b className="mono" style={{ color: 'var(--salvage)' }}>
            {reward.salvage}
          </b>{' '}
          scrap{reward.cardId ? ' and a schematic:' : '.'}
        </p>
      )}
      {reward?.cardId && (
        <div style={{ margin: '0.5rem 0' }}>
          <Card card={cardDefinitions[reward.cardId]} />
        </div>
      )}
      <button className="btn-primary" onClick={leaveNode}>
        Continue
      </button>
    </section>
  );
}
