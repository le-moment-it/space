import { levelProgress } from '../../engine/progression/level';
import { useTranslation } from '../../i18n';
import { useGameStore } from '../../state/gameStore';
import './LevelBadge.css';

/**
 * Commander level in the top bar, with a bar filling toward the next level.
 *
 * XP is awarded silently mid-fight — the only way to feel it accumulating is to see
 * it here, so the bar is the whole point of the component rather than decoration.
 */
export function LevelBadge() {
  const xp = useGameStore((s) => s.meta.xp);
  const { t } = useTranslation();
  const { level, into, span, atMax } = levelProgress(xp);

  const pct = atMax ? 100 : Math.round((into / span) * 100);
  const title = atMax ? t('level.max') : t('level.progress', { into, span, next: level + 1 });

  return (
    <span className="levelbadge" title={title} aria-label={`${t('level.label')} ${level}`}>
      <span className="levelbadge__text mono">{t('level.short', { level })}</span>
      <span className="levelbadge__bar" aria-hidden="true">
        <span
          className={`levelbadge__fill${atMax ? ' levelbadge__fill--max' : ''}`}
          style={{ width: `${pct}%` }}
        />
      </span>
    </span>
  );
}
