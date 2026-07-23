import { useGameStore } from '../../state/gameStore';
import { TOTAL_ACTS } from '../../engine/run/types';
import { BattleScreen } from './BattleScreen';
import { EventScreen } from './EventScreen';
import { MapScreen } from './MapScreen';
import { RestScreen } from './RestScreen';
import { RewardScreen } from './RewardScreen';
import { ShopScreen } from './ShopScreen';
import { TreasureScreen } from './TreasureScreen';

export function RunScreen() {
  const run = useGameStore((s) => s.run);
  const playCard = useGameStore((s) => s.playCard);
  const endTurn = useGameStore((s) => s.endTurn);
  const acknowledgeCombat = useGameStore((s) => s.acknowledgeCombat);
  const returnToHub = useGameStore((s) => s.returnToHub);

  if (!run) return null;

  return (
    <div>
      <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1rem' }}>
        <span>
          Act {run.act}/{TOTAL_ACTS}
        </span>
        <span>
          Hull: {run.hull}/{run.maxHull}
        </span>
        <span>Salvage: {run.salvage}</span>
        <span>Deck: {run.deckCardIds.length} cards</span>
        <span>Ship systems: {run.shipSystemIds.length}</span>
      </div>

      {run.phase === 'map' && <MapScreen run={run} />}

      {run.phase === 'combat' && run.activeCombat && (
        <BattleScreen
          combat={run.activeCombat}
          onPlayCard={playCard}
          onEndTurn={endTurn}
          onContinue={acknowledgeCombat}
        />
      )}

      {run.phase === 'event' && <EventScreen run={run} />}
      {run.phase === 'rest' && <RestScreen run={run} />}
      {run.phase === 'shop' && <ShopScreen run={run} />}
      {run.phase === 'treasure' && <TreasureScreen run={run} />}
      {run.phase === 'reward' && <RewardScreen run={run} />}

      {run.phase === 'runWon' && (
        <section>
          <h2>Sector cleared!</h2>
          <p>You defeated the boss and completed the run.</p>
          <button onClick={returnToHub}>Continue to Hub</button>
        </section>
      )}

      {run.phase === 'runLost' && (
        <section>
          <h2>Your ship was destroyed.</h2>
          <button onClick={returnToHub}>Continue to Hub</button>
        </section>
      )}
    </div>
  );
}
