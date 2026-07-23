import { cardDefinitions } from '../../data/cards';
import type { CardType } from '../../engine/cards/types';
import { LOADOUT_SIZE } from '../../engine/save/types';
import { useGameStore } from '../../state/gameStore';
import { Card } from '../components/Card';
import { HeroShip } from '../components/HeroShip';
import './DeckScreen.css';

const TYPE_ORDER: Record<CardType, number> = { weapon: 0, maneuver: 1, shipSystem: 2, crew: 3 };

function byTypeThenCost(a: string, b: string) {
  const ca = cardDefinitions[a];
  const cb = cardDefinitions[b];
  return (
    TYPE_ORDER[ca.type] - TYPE_ORDER[cb.type] || ca.cost - cb.cost || ca.name.localeCompare(cb.name)
  );
}

export function DeckScreen() {
  const meta = useGameStore((s) => s.meta);
  const runActive = useGameStore((s) => s.run !== null);
  const addLoadoutCard = useGameStore((s) => s.addLoadoutCard);
  const removeLoadoutCard = useGameStore((s) => s.removeLoadoutCard);
  const resetLoadout = useGameStore((s) => s.resetLoadout);

  const loadout = meta.loadoutCardIds;
  const full = loadout.length >= LOADOUT_SIZE;
  const available = [...meta.unlockedCardIds].sort(byTypeThenCost);

  return (
    <section className="screen deck">
      <header className="deck__head">
        <div>
          <p className="eyebrow">Loadout</p>
          <h2>Your deck</h2>
          <p className="screen__sub">
            Choose the {LOADOUT_SIZE} cards you launch with. Click a card to add or remove it.
            {runActive && ' Changes apply to your next run.'}
          </p>
        </div>
        <div className="deck__ship">
          <HeroShip />
        </div>
      </header>

      <div className="deck__section">
        <div className="deck__section-head">
          <p className="eyebrow">Deck</p>
          <div className="deck__meter">
            <span className={`mono deck__count${full ? ' deck__count--full' : ''}`}>
              {loadout.length}/{LOADOUT_SIZE}
            </span>
            <button onClick={resetLoadout}>Reset</button>
          </div>
        </div>
        {loadout.length === 0 ? (
          <p className="screen__sub">Empty — add cards from your collection below.</p>
        ) : (
          <div className="deck__cards">
            {loadout.map((id, i) => (
              <Card
                key={`${id}-${i}`}
                card={cardDefinitions[id]}
                playable
                onClick={() => removeLoadoutCard(i)}
              />
            ))}
          </div>
        )}
      </div>

      <div className="deck__section">
        <p className="eyebrow">Collection ({available.length})</p>
        <div className="deck__cards">
          {available.map((id) => (
            <Card
              key={id}
              card={cardDefinitions[id]}
              playable={!full}
              dimmed={full}
              onClick={() => addLoadoutCard(id)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
