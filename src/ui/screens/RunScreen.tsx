import { useRunStore } from '../../state/runStore';
import { BattleScreen } from './BattleScreen';
import { EventScreen } from './EventScreen';
import { MapScreen } from './MapScreen';
import { RestScreen } from './RestScreen';
import { ShopScreen } from './ShopScreen';
import { TreasureScreen } from './TreasureScreen';

export function RunScreen() {
  const run = useRunStore((s) => s.run);
  const playCard = useRunStore((s) => s.playCard);
  const endTurn = useRunStore((s) => s.endTurn);
  const acknowledgeCombat = useRunStore((s) => s.acknowledgeCombat);
  const restart = useRunStore((s) => s.restart);

  return (
    <div>
      <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1rem' }}>
        <span>
          Hull: {run.hull}/{run.maxHull}
        </span>
        <span>Salvage: {run.salvage}</span>
        <span>Deck: {run.deckCardIds.length} cards</span>
      </div>

      {run.phase === 'map' && <MapScreen />}

      {run.phase === 'combat' && run.activeCombat && (
        <BattleScreen
          combat={run.activeCombat}
          onPlayCard={playCard}
          onEndTurn={endTurn}
          onContinue={acknowledgeCombat}
        />
      )}

      {run.phase === 'event' && <EventScreen />}
      {run.phase === 'rest' && <RestScreen />}
      {run.phase === 'shop' && <ShopScreen />}
      {run.phase === 'treasure' && <TreasureScreen />}

      {run.phase === 'runWon' && (
        <section>
          <h2>Sector cleared!</h2>
          <p>You defeated the boss and completed the run.</p>
          <button onClick={restart}>Start a new run</button>
        </section>
      )}

      {run.phase === 'runLost' && (
        <section>
          <h2>Your ship was destroyed.</h2>
          <button onClick={restart}>Start a new run</button>
        </section>
      )}
    </div>
  );
}
