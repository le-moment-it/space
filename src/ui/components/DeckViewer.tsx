import { useEffect } from 'react';
import { cardDefinitions } from '../../data/cards';
import type { CardType } from '../../engine/cards/types';
import { useTranslation } from '../../i18n';
import { Card } from './Card';
import './DeckViewer.css';

const TYPE_ORDER: Record<CardType, number> = { weapon: 0, maneuver: 1, shipSystem: 2, crew: 3 };

/** A modal listing the run's current deck, so the player can plan card picks. */
export function DeckViewer({
  deckCardIds,
  onClose,
}: {
  deckCardIds: string[];
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

  const sorted = [...deckCardIds].sort((a, b) => {
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
      className="deckview-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={t('deckView.title')}
      onClick={onClose}
    >
      <div className="deckview" onClick={(e) => e.stopPropagation()}>
        <header className="deckview__head">
          <div>
            <p className="eyebrow">{t('deckView.title')}</p>
            <p className="deckview__sub mono">{t('deckView.sub', { count: deckCardIds.length })}</p>
          </div>
          <button className="deckview__close" onClick={onClose} aria-label={t('common.close')}>
            ✕
          </button>
        </header>
        <div className="deckview__cards">
          {sorted.map((id, i) => (
            <Card key={`${id}-${i}`} card={cardDefinitions[id]} />
          ))}
        </div>
      </div>
    </div>
  );
}
