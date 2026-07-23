import { cardDefinitions } from '../../data/cards';
import { LOADOUT_SIZE } from '../../engine/save/types';
import { useGameStore } from '../../state/gameStore';
import { HeroShip } from '../components/HeroShip';
import './StartScreen.css';

/** Shown on the Game tab when no run is in progress: the ready room to launch. */
export function StartScreen({ onEditDeck }: { onEditDeck: () => void }) {
  const meta = useGameStore((s) => s.meta);
  const startNewRun = useGameStore((s) => s.startNewRun);
  const loadout = meta.loadoutCardIds;
  const ready = loadout.length === LOADOUT_SIZE;

  // Group the loadout into "name ×n" manifest rows.
  const counts = new Map<string, number>();
  for (const id of loadout) counts.set(id, (counts.get(id) ?? 0) + 1);

  return (
    <section className="screen start">
      <div className="start__hero">
        <HeroShip animated />
      </div>

      <p className="eyebrow">Ready room</p>
      <h2>Launch a run</h2>
      <p className="screen__sub">
        Your ship carries a {LOADOUT_SIZE}-card deck into the Reach. Build it in the Deck tab.
      </p>

      <div className="start__manifest">
        {[...counts.entries()].map(([id, n]) => (
          <span key={id} className="manifest-chip" data-type={cardDefinitions[id].type}>
            {cardDefinitions[id].name}
            {n > 1 && <span className="manifest-chip__n mono">×{n}</span>}
          </span>
        ))}
      </div>

      <div className="start__actions">
        <button className="btn-primary" disabled={!ready} onClick={startNewRun}>
          Launch new run
        </button>
        <button onClick={onEditDeck}>Edit deck</button>
      </div>

      {!ready && (
        <p className="start__warn">
          Your deck needs {LOADOUT_SIZE} cards ({loadout.length}/{LOADOUT_SIZE}). Edit it in the
          Deck tab.
        </p>
      )}
    </section>
  );
}
