import { cardDefinitions } from '../../data/cards';
import { MAX_UPGRADE_LEVEL, type CardType } from '../../engine/cards/types';
import type { RunState } from '../../engine/run/types';
import { useTranslation } from '../../i18n';
import { Card } from '../components/Card';
import { useGameStore } from '../../state/gameStore';
import './GarageScreen.css';

const TYPE_ORDER: Record<CardType, number> = { weapon: 0, maneuver: 1, shipSystem: 2, crew: 3 };

/** Garage node: upgrade one card for the rest of this run. */
export function GarageScreen({ run }: { run: RunState }) {
  const upgradeCardAtGarage = useGameStore((s) => s.upgradeCardAtGarage);
  const leaveNode = useGameStore((s) => s.leaveNode);
  const { t, cardName } = useTranslation();

  // Sort for display but carry the real deck index with each entry — upgrading by
  // the sorted position would silently improve a different card than the one clicked.
  const entries = run.deckCards
    .map((card, index) => ({ card, index }))
    .sort((a, b) => {
      const ca = cardDefinitions[a.card.cardId];
      const cb = cardDefinitions[b.card.cardId];
      return (
        TYPE_ORDER[ca.type] - TYPE_ORDER[cb.type] ||
        ca.cost - cb.cost ||
        cardName(a.card.cardId).localeCompare(cardName(b.card.cardId)) ||
        b.card.level - a.card.level
      );
    });

  const anyUpgradable = run.deckCards.some((c) => c.level < MAX_UPGRADE_LEVEL);

  return (
    <section className="screen garage">
      <header className="screen__head">
        <p className="eyebrow" style={{ color: 'var(--upgrade)' }}>
          {t('garage.eyebrow')}
        </p>
        <h2>{t('garage.title')}</h2>
        <p className="screen__sub">{anyUpgradable ? t('garage.sub') : t('garage.maxed')}</p>
      </header>

      <div className="garage__cards">
        {entries.map(({ card, index }) => {
          const maxed = card.level >= MAX_UPGRADE_LEVEL;
          return (
            <div key={index} className="garage__slot">
              <Card
                card={cardDefinitions[card.cardId]}
                level={card.level}
                playable={!maxed}
                dimmed={maxed}
                onClick={() => upgradeCardAtGarage(index)}
              />
              {maxed && <p className="garage__maxed mono">{t('garage.alreadyMax')}</p>}
            </div>
          );
        })}
      </div>

      <div className="garage__actions">
        <button className="btn-primary" onClick={leaveNode}>
          {t('garage.leave')}
        </button>
      </div>
    </section>
  );
}
