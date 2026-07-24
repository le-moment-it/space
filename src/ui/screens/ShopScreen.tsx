import { cardDefinitions } from '../../data/cards';
import type { RunState } from '../../engine/run/types';
import { useTranslation } from '../../i18n';
import { Card } from '../components/Card';
import { useGameStore } from '../../state/gameStore';

export function ShopScreen({ run }: { run: RunState }) {
  const buyItem = useGameStore((s) => s.buyItem);
  const leaveNode = useGameStore((s) => s.leaveNode);
  const { t } = useTranslation();
  if (!run.shopOffer) return null;

  return (
    <section className="screen">
      <header className="shop__head">
        <div>
          <p className="eyebrow" style={{ color: 'var(--salvage)' }}>
            {t('shop.eyebrow')}
          </p>
          <h2>{t('shop.title')}</h2>
        </div>
        <span className="stat">
          <span className="stat__label">{t('stat.salvage')}</span>
          <span className="stat__value mono stat__value--salvage">{run.salvage}</span>
        </span>
      </header>

      <div className="shop__offers">
        {run.shopOffer.map((item, index) => {
          const def = cardDefinitions[item.cardId];
          const affordable = !item.purchased && run.salvage >= item.price;
          return (
            <div key={item.cardId} className="shop__offer">
              <Card card={def} dimmed={item.purchased} />
              <button className="shop__buy" disabled={!affordable} onClick={() => buyItem(index)}>
                {item.purchased ? t('shop.bought') : t('shop.buy', { price: item.price })}
              </button>
            </div>
          );
        })}
      </div>

      <button onClick={leaveNode}>{t('shop.leave')}</button>
    </section>
  );
}
