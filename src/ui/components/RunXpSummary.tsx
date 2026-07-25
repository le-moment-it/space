import { levelFor } from '../../engine/progression/level';
import { useTranslation } from '../../i18n';
import { useGameStore } from '../../state/gameStore';
import './RunXpSummary.css';

/**
 * What the run paid, shown when it ends.
 *
 * XP lands quietly during play, so a run that ends badly can still have been worth
 * something — this is where that becomes visible. The level-up line is derived by
 * rolling back the run's earnings rather than stored, so it needs no extra state.
 */
export function RunXpSummary({ xpEarned }: { xpEarned: number }) {
  const xp = useGameStore((s) => s.meta.xp);
  const { t } = useTranslation();

  if (xpEarned <= 0) return null;

  const level = levelFor(xp);
  const leveledUp = level > levelFor(xp - xpEarned);

  return (
    <div className="runxp">
      <p className="runxp__earned mono">{t('level.earned', { xp: xpEarned })}</p>
      {leveledUp && (
        <>
          <p className="runxp__levelup">{t('level.leveledUp', { level })}</p>
          <p className="runxp__note">{t('level.unlockedNow')}</p>
        </>
      )}
    </div>
  );
}
