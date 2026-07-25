import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  MAX_UPGRADE_LEVEL,
  type CardDefinition,
  type UpgradeLevel,
} from '../../engine/cards/types';
import { useTranslation } from '../../i18n';
import { Card } from './Card';
import './UpgradePreview.css';

const TIERS: UpgradeLevel[] = [0, 1, 2];

/**
 * The full upgrade path of one card, opened by right-clicking it anywhere in the game.
 *
 * The tiers render themselves: `Card` already resolves its own upgrade level, so each
 * column is just the same card at a different level. That means a tier which changes
 * cost, drops Exhaust, or swaps the effect outright shows those differences for free,
 * rather than needing a hand-written diff that could drift from the engine.
 *
 * Portalled to <body> because `.card` sets overflow:hidden and takes a transform on
 * hover — either would clip or trap a panel rendered inside it.
 */
export function UpgradePreview({
  card,
  level,
  onClose,
}: {
  card: CardDefinition;
  /** The tier this copy actually is, which gets marked "current". */
  level: UpgradeLevel;
  onClose: () => void;
}) {
  const { t, cardName } = useTranslation();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const maxed = level >= MAX_UPGRADE_LEVEL;

  return createPortal(
    // Dismissed by backdrop / Escape / the close button only — deliberately NOT by
    // pointerdown, so right-clicking a keyword inside the panel keeps the panel open.
    <div
      className="upgrade-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={`${cardName(card.id)} — ${t('upgrade.title')}`}
      onClick={onClose}
    >
      <div className="upgrade" onClick={(e) => e.stopPropagation()}>
        <header className="upgrade__head">
          <div>
            <p className="eyebrow">{t('upgrade.title')}</p>
            <p className="upgrade__name">{cardName(card.id)}</p>
          </div>
          <button className="upgrade__close" onClick={onClose} aria-label={t('common.close')}>
            ✕
          </button>
        </header>

        <div className="upgrade__tiers">
          {TIERS.map((tier) => {
            const isCurrent = tier === level;
            const isNext = tier === level + 1;
            return (
              <div
                key={tier}
                className={`upgrade__tier${isCurrent ? ' upgrade__tier--current' : ''}`}
              >
                {/* previewable={false}: these cards must not open previews of their own. */}
                <Card card={card} level={tier} previewable={false} />
                <p className="upgrade__label mono">
                  {tier === 0 ? t('upgrade.tierBase') : '+'.repeat(tier)}
                </p>
                {/* Always rendered, blank when neither: equal tier heights are what
                    let the fan arc symmetrically instead of stepping down. */}
                <p
                  className={`upgrade__marker mono${isNext ? ' upgrade__marker--next' : ''}`}
                  aria-hidden={!isCurrent && !isNext}
                >
                  {isCurrent ? t('upgrade.current') : isNext ? t('upgrade.next') : '\u00A0'}
                </p>
              </div>
            );
          })}
        </div>

        {maxed && <p className="upgrade__maxed">{t('upgrade.maxed')}</p>}
      </div>
    </div>,
    document.body,
  );
}
