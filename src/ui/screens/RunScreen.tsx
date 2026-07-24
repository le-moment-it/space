import { useGameStore } from '../../state/gameStore';
import { TOTAL_ACTS } from '../../engine/run/types';
import { useTranslation } from '../../i18n';
import { BattleLog } from '../components/BattleLog';
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
  const { t } = useTranslation();

  if (!run) return null;

  const hullPct = run.maxHull > 0 ? Math.max(0, Math.min(100, (run.hull / run.maxHull) * 100)) : 0;

  const statGrid = (
    <div className="statgrid">
      <div className="stat stat--wide">
        <span className="stat__label">{t('stat.hull')}</span>
        <span className="stat__value mono">
          {run.hull}/{run.maxHull}
        </span>
        <span className="stat__bar">
          <span className="stat__bar-fill" style={{ width: `${hullPct}%` }} />
        </span>
      </div>
      <div className="stat">
        <span className="stat__label">{t('stat.act')}</span>
        <span className="stat__value mono">
          {run.act}/{TOTAL_ACTS}
        </span>
      </div>
      <div className="stat">
        <span className="stat__label">{t('stat.salvage')}</span>
        <span className="stat__value mono stat__value--salvage">{run.salvage}</span>
      </div>
      <div className="stat">
        <span className="stat__label">{t('stat.deck')}</span>
        <span className="stat__value mono">{run.deckCardIds.length}</span>
      </div>
      <div className="stat">
        <span className="stat__label">{t('stat.systems')}</span>
        <span className="stat__value mono">{run.shipSystemIds.length}</span>
      </div>
      <div className="stat">
        <span className="stat__label">{t('stat.crew')}</span>
        <span className="stat__value mono">{run.crewIds.length}</span>
      </div>
    </div>
  );

  // Combat gets a bespoke layout: the stat row + fight share the left column so the
  // log rail on the right can run the full height, starting level with the stats.
  if (run.phase === 'combat' && run.activeCombat) {
    return (
      <div className="run run--combat">
        <div className="run__fight">
          {statGrid}
          <BattleScreen
            combat={run.activeCombat}
            onPlayCard={playCard}
            onEndTurn={endTurn}
            onContinue={acknowledgeCombat}
          />
        </div>
        <BattleLog log={run.activeCombat.log} />
      </div>
    );
  }

  return (
    <div className="run">
      {statGrid}

      {run.phase === 'map' && <MapScreen run={run} />}
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
            {t('run.wonEyebrow')}
          </p>
          <h2>{t('run.wonTitle')}</h2>
          <p className="screen__sub">{t('run.wonSub')}</p>
          <button className="btn-primary" onClick={returnToHub}>
            {t('run.returnToBridge')}
          </button>
        </section>
      )}

      {run.phase === 'runLost' && (
        <section className="screen run-end">
          <p className="eyebrow" style={{ color: 'var(--hazard)' }}>
            {t('run.lostEyebrow')}
          </p>
          <h2>{t('run.lostTitle')}</h2>
          <p className="screen__sub">{t('run.lostSub')}</p>
          <button className="btn-primary" onClick={returnToHub}>
            {t('run.returnToBridge')}
          </button>
        </section>
      )}
    </div>
  );
}
