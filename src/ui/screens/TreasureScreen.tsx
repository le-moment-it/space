import { cardDefinitions } from '../../data/cards';
import type { RunState } from '../../engine/run/types';
import { useTranslation } from '../../i18n';
import { Card } from '../components/Card';
import { useGameStore } from '../../state/gameStore';

export function TreasureScreen({ run }: { run: RunState }) {
  const leaveNode = useGameStore((s) => s.leaveNode);
  const { t } = useTranslation();
  const reward = run.pendingReward;

  return (
    <section
      className="screen screen--focus panel"
      style={{ alignItems: 'center', textAlign: 'center' }}
    >
      <p className="eyebrow" style={{ color: 'var(--salvage)' }}>
        {t('treasure.eyebrow')}
      </p>
      <h2>{t('treasure.title')}</h2>
      {reward && (
        <p className="screen__sub">
          {t('treasure.salvaged')}{' '}
          <b className="mono" style={{ color: 'var(--salvage)' }}>
            {reward.salvage}
          </b>{' '}
          {reward.cardId ? t('treasure.scrapAndSchematic') : t('treasure.scrapOnly')}
        </p>
      )}
      {reward?.cardId && (
        <div style={{ margin: '0.5rem 0' }}>
          <Card card={cardDefinitions[reward.cardId]} />
        </div>
      )}
      <button className="btn-primary" onClick={leaveNode}>
        {t('common.continue')}
      </button>
    </section>
  );
}
