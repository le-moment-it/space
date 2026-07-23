import { useGameStore } from '../../state/gameStore';
import { TOTAL_ACTS } from '../../engine/run/types';
import { BattleScreen } from './BattleScreen';
import { CrewOfferScreen } from './CrewOfferScreen';
import { DialogueScreen } from './DialogueScreen';
import { EventScreen } from './EventScreen';
import { MapScreen } from './MapScreen';
import { RestScreen } from './RestScreen';
import { RewardScreen } from './RewardScreen';
import { ShopScreen } from './ShopScreen';
import { TreasureScreen } from './TreasureScreen';
import './RunScreen.css';

export function RunScreen() {
  const run = useGameStore((s) => s.run);
  const playCard = useGameStore((s) => s.playCard);
  const endTurn = useGameStore((s) => s.endTurn);
  const acknowledgeCombat = useGameStore((s) => s.acknowledgeCombat);
  const returnToHub = useGameStore((s) => s.returnToHub);

  if (!run) return null;

  const hullPct = run.maxHull > 0 ? Math.max(0, Math.min(100, (run.hull / run.maxHull) * 100)) : 0;

  return (
    <div className="run">
      <div className="statgrid">
        <div className="stat stat--wide">
          <span className="stat__label">Hull</span>
          <span className="stat__value mono">
            {run.hull}/{run.maxHull}
          </span>
          <span className="stat__bar">
            <span className="stat__bar-fill" style={{ width: `${hullPct}%` }} />
          </span>
        </div>
        <div className="stat">
          <span className="stat__label">Act</span>
          <span className="stat__value mono">
            {run.act}/{TOTAL_ACTS}
          </span>
        </div>
        <div className="stat">
          <span className="stat__label">Salvage</span>
          <span className="stat__value mono stat__value--salvage">{run.salvage}</span>
        </div>
        <div className="stat">
          <span className="stat__label">Deck</span>
          <span className="stat__value mono">{run.deckCardIds.length}</span>
        </div>
        <div className="stat">
          <span className="stat__label">Systems</span>
          <span className="stat__value mono">{run.shipSystemIds.length}</span>
        </div>
        <div className="stat">
          <span className="stat__label">Crew</span>
          <span className="stat__value mono">{run.crewIds.length}</span>
        </div>
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
      {run.phase === 'crewOffer' && <CrewOfferScreen run={run} />}
      {run.phase === 'dialogue' && <DialogueScreen run={run} />}
      {run.phase === 'rest' && <RestScreen run={run} />}
      {run.phase === 'shop' && <ShopScreen run={run} />}
      {run.phase === 'treasure' && <TreasureScreen run={run} />}
      {run.phase === 'reward' && <RewardScreen run={run} />}

      {run.phase === 'runWon' && (
        <section className="screen run-end">
          <p className="eyebrow" style={{ color: 'var(--signal)' }}>
            Sector cleared
          </p>
          <h2>The Reach falls quiet</h2>
          <p className="screen__sub">You defeated the final boss and completed the run.</p>
          <button className="btn-primary" onClick={returnToHub}>
            Return to bridge
          </button>
        </section>
      )}

      {run.phase === 'runLost' && (
        <section className="screen run-end">
          <p className="eyebrow" style={{ color: 'var(--hazard)' }}>
            Signal lost
          </p>
          <h2>Your ship was destroyed</h2>
          <p className="screen__sub">The Reach keeps its census.</p>
          <button className="btn-primary" onClick={returnToHub}>
            Return to bridge
          </button>
        </section>
      )}
    </div>
  );
}
