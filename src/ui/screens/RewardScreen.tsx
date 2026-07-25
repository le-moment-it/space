import { cardDefinitions } from '../../data/cards';
import { nextLevel } from '../../engine/cards/types';
import { upgradableDeckIndices } from '../../engine/run/resolve';
import type { RunState } from '../../engine/run/types';
import { useTranslation } from '../../i18n';
import { Card } from '../components/Card';
import { useGameStore } from '../../state/gameStore';
import './RewardScreen.css';

/**
 * Boss reward: a ship system for this run, OR a permanent card upgrade — not both.
 * The upgrade lane shows each card at the level it *would become*, since that is
 * what the player is actually choosing between.
 */
export function RewardScreen({ run }: { run: RunState }) {
  const chooseShipSystem = useGameStore((s) => s.chooseShipSystem);
  const chooseCardUpgradeReward = useGameStore((s) => s.chooseCardUpgradeReward);
  const skipBossReward = useGameStore((s) => s.skipBossReward);
  const tr = useTranslation();
  const { t } = tr;

  const systems = run.rewardOptions ?? [];
  const upgradable = upgradableDeckIndices(run, true);
  // Nothing on either side would strand the player on a phase with no exit.
  const stuck = systems.length === 0 && upgradable.length === 0;

  return (
    <section className="screen reward">
      <header className="screen__head">
        <p className="eyebrow" style={{ color: 'var(--plasma)' }}>
          {t('reward.eyebrow')}
        </p>
        <h2>{t('reward.title')}</h2>
        <p className="screen__sub">{t('reward.sub')}</p>
      </header>

      {systems.length > 0 && (
        <div className="reward__lane">
          <div className="reward__lane-head">
            <p className="eyebrow">{t('reward.systemLane')}</p>
            <p className="reward__lane-hint">{t('reward.systemLaneHint')}</p>
          </div>
          <div className="reward-grid">
            {systems.map((id) => (
              <button key={id} className="reward-option" onClick={() => chooseShipSystem(id)}>
                <span className="reward-option__name">{tr.shipSystemName(id)}</span>
                <span className="reward-option__desc">{tr.shipSystemDescription(id)}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="reward__lane">
        <div className="reward__lane-head">
          <p className="eyebrow" style={{ color: 'var(--upgrade)' }}>
            {t('reward.upgradeLane')}
          </p>
          <p className="reward__lane-hint">{t('reward.upgradeLaneHint')}</p>
        </div>
        {upgradable.length === 0 ? (
          <p className="screen__sub">{t('reward.noUpgrades')}</p>
        ) : (
          <div className="reward__cards">
            {upgradable.map((deckIndex) => {
              const card = run.deckCards[deckIndex];
              return (
                <Card
                  key={deckIndex}
                  card={cardDefinitions[card.cardId]}
                  level={nextLevel(card.level)}
                  playable
                  onClick={() => chooseCardUpgradeReward(deckIndex)}
                />
              );
            })}
          </div>
        )}
      </div>

      {stuck && (
        <div className="reward__actions">
          <button className="btn-primary" onClick={skipBossReward}>
            {t('reward.continue')}
          </button>
        </div>
      )}
    </section>
  );
}
