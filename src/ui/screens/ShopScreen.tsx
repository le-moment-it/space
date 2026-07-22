import { cardDefinitions } from '../../data/cards';
import { useRunStore } from '../../state/runStore';

export function ShopScreen() {
  const run = useRunStore((s) => s.run);
  const buyItem = useRunStore((s) => s.buyItem);
  const leaveNode = useRunStore((s) => s.leaveNode);
  if (!run.shopOffer) return null;

  return (
    <section>
      <h2>Salvage Trader</h2>
      <p>Salvage: {run.salvage}</p>
      <ul>
        {run.shopOffer.map((item, index) => {
          const def = cardDefinitions[item.cardId];
          return (
            <li key={item.cardId}>
              {def.name} — {item.price} salvage{' '}
              <button
                disabled={item.purchased || run.salvage < item.price}
                onClick={() => buyItem(index)}
              >
                {item.purchased ? 'Bought' : 'Buy'}
              </button>
            </li>
          );
        })}
      </ul>
      <button onClick={leaveNode}>Leave</button>
    </section>
  );
}
