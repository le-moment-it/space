import { levelProgress } from '../../engine/progression/level';
import { useTranslation } from '../../i18n';
import { useGameStore } from '../../state/gameStore';
import './LevelBadge.css';

/**
 * Commander level in the top bar, with the XP counts printed beside it.
 *
 * XP is awarded silently mid-fight, so this is the only place it can be felt
 * accumulating — the numbers are on the face rather than in a tooltip, because a
 * progress bar alone tells you roughly where you are but never how far is left.
 */
export function LevelBadge() {
  const xp = useGameStore((s) => s.meta.xp);
  const { t } = useTranslation();
  const { level, into, span, atMax } = levelProgress(xp);

  const pct = atMax ? 100 : Math.round((into / span) * 100);

  return (
    <span
      className="levelbadge"
      aria-label={
        atMax
          ? `${t('level.label')} ${level} — ${t('level.max')}`
          : `${t('level.label')} ${level} — ${t('level.progress', { into, span, next: level + 1 })}`
      }
    >
      <span className="levelbadge__row">
        <span className="levelbadge__level mono">{t('level.short', { level })}</span>
        <span className="levelbadge__xp mono">
          {atMax ? t('level.maxShort') : t('level.xpOf', { into, span })}
        </span>
      </span>
      <span className="levelbadge__bar" aria-hidden="true">
        <span
          className={`levelbadge__fill${atMax ? ' levelbadge__fill--max' : ''}`}
          style={{ width: `${pct}%` }}
        />
      </span>
    </span>
  );
}
