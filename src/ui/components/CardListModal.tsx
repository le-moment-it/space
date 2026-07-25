import { useEffect } from 'react';
import { cardDefinitions } from '../../data/cards';
import type { CardType } from '../../engine/cards/types';
import { useTranslation } from '../../i18n';
import { Card } from './Card';
import './CardListModal.css';

const TYPE_ORDER: Record<CardType, number> = { weapon: 0, maneuver: 1, shipSystem: 2, crew: 3 };

/**
 * A modal listing a set of cards — the run deck, or a combat pile.
 *
 * Cards are always shown sorted by type/cost/name, never in their stored order.
 * For the draw pile that is deliberate: revealing the real order would hand the
 * player the next draws and remove the randomness the fight is built on. `note`
 * is where that gets spelled out to the player.
 */
export function CardListModal({
  title,
  cardIds,
  note,
  onClose,
}: {
  title: string;
  cardIds: string[];
  note?: string;
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

  const sorted = [...cardIds].sort((a, b) => {
    const ca = cardDefinitions[a];
    const cb = cardDefinitions[b];
    return (
      TYPE_ORDER[ca.type] - TYPE_ORDER[cb.type] ||
      ca.cost - cb.cost ||
      cardName(a).localeCompare(cardName(b))
    );
  });

  return (
    <div
      className="cardlist-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <div className="cardlist" onClick={(e) => e.stopPropagation()}>
        <header className="cardlist__head">
          <div>
            <p className="eyebrow">{title}</p>
            <p className="cardlist__sub mono">{t('cardList.count', { count: cardIds.length })}</p>
            {note && <p className="cardlist__note">{note}</p>}
          </div>
          <button className="cardlist__close" onClick={onClose} aria-label={t('common.close')}>
            ✕
          </button>
        </header>
        {sorted.length === 0 ? (
          <p className="cardlist__empty">{t('cardList.empty')}</p>
        ) : (
          <div className="cardlist__cards">
            {sorted.map((id, i) => (
              <Card key={`${id}-${i}`} card={cardDefinitions[id]} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
