import { cardDefinitions } from '../../data/cards';
import type { RunState } from '../../engine/run/types';
import { useTranslation } from '../../i18n';
import { Card } from '../components/Card';
import { useGameStore } from '../../state/gameStore';
import './CardRewardScreen.css';

/** Post-combat: choose one of three cards to add to the deck, or skip. */
export function CardRewardScreen({ run, onViewDeck }: { run: RunState; onViewDeck: () => void }) {
  const chooseCardReward = useGameStore((s) => s.chooseCardReward);
  const { t } = useTranslation();
  const options = run.cardRewardOptions ?? [];

  return (
    <section className="screen cardreward">
      <header className="screen__head">
        <p className="eyebrow" style={{ color: 'var(--plasma)' }}>
          {t('reward.cardEyebrow')}
        </p>
        <h2>{t('reward.cardTitle')}</h2>
        <p className="screen__sub">{t('reward.cardSub')}</p>
      </header>

      <div className="cardreward__options">
        {options.map((id) => (
          <Card key={id} card={cardDefinitions[id]} playable onClick={() => chooseCardReward(id)} />
        ))}
      </div>

      <div className="cardreward__actions">
        <button className="btn-primary" onClick={() => chooseCardReward(null)}>
          {t('reward.skip')}
        </button>
        <button onClick={onViewDeck}>
          {t('reward.viewDeck', { count: run.deckCardIds.length })}
        </button>
      </div>
    </section>
  );
}
