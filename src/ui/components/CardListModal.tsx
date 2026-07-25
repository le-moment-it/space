import { useEffect } from 'react';
import { cardDefinitions } from '../../data/cards';
import type { CardType, UpgradeLevel } from '../../engine/cards/types';
import { useTranslation } from '../../i18n';
import { Card } from './Card';
import './CardListModal.css';

const TYPE_ORDER: Record<CardType, number> = { weapon: 0, maneuver: 1, shipSystem: 2 };

/** A card in a list view: the definition id plus this copy's upgrade level. */
export interface CardListEntry {
  cardId: string;
  level: UpgradeLevel;
}

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
  cards,
  note,
  onClose,
}: {
  title: string;
  cards: CardListEntry[];
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

  const sorted = [...cards].sort((a, b) => {
    const ca = cardDefinitions[a.cardId];
    const cb = cardDefinitions[b.cardId];
    return (
      TYPE_ORDER[ca.type] - TYPE_ORDER[cb.type] ||
      ca.cost - cb.cost ||
      cardName(a.cardId).localeCompare(cardName(b.cardId)) ||
      b.level - a.level
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
            <p className="cardlist__sub mono">{t('cardList.count', { count: cards.length })}</p>
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
            {sorted.map((entry, i) => (
              <Card
                key={`${entry.cardId}-${i}`}
                card={cardDefinitions[entry.cardId]}
                level={entry.level}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
