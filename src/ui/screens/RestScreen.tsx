import type { RunState } from '../../engine/run/types';
import { useTranslation } from '../../i18n';
import { useGameStore } from '../../state/gameStore';

export function RestScreen({ run }: { run: RunState }) {
  const leaveNode = useGameStore((s) => s.leaveNode);
  const { t } = useTranslation();

  return (
    <section className="screen screen--focus panel">
      <p className="eyebrow" style={{ color: 'var(--repair)' }}>
        {t('rest.eyebrow')}
      </p>
      <h2>{t('rest.title')}</h2>
      <p className="screen__sub">
        {t('rest.hullPatchedTo')}{' '}
        <b className="mono" style={{ color: 'var(--repair)' }}>
          {run.hull}/{run.maxHull}
        </b>
        .
      </p>
      <button className="btn-primary" onClick={leaveNode}>
        {t('common.continue')}
      </button>
    </section>
  );
}
