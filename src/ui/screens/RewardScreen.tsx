import type { RunState } from '../../engine/run/types';
import { useTranslation } from '../../i18n';
import { useGameStore } from '../../state/gameStore';

export function RewardScreen({ run }: { run: RunState }) {
  const chooseShipSystem = useGameStore((s) => s.chooseShipSystem);
  const tr = useTranslation();
  if (!run.rewardOptions) return null;

  return (
    <section className="screen">
      <header className="screen__head">
        <p className="eyebrow" style={{ color: 'var(--plasma)' }}>
          {tr.t('reward.eyebrow')}
        </p>
        <h2>{tr.t('reward.title')}</h2>
        <p className="screen__sub">{tr.t('reward.sub')}</p>
      </header>
      <div className="reward-grid">
        {run.rewardOptions.map((id) => (
          <button key={id} className="reward-option" onClick={() => chooseShipSystem(id)}>
            <span className="reward-option__name">{tr.shipSystemName(id)}</span>
            <span className="reward-option__desc">{tr.shipSystemDescription(id)}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
