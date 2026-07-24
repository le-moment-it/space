import { cardDefinitions } from '../../data/cards';
import type { CombatState, Intent } from '../../engine/combat/types';
import { BattleLog } from '../components/BattleLog';
import { Card } from '../components/Card';
import './BattleScreen.css';

interface BattleScreenProps {
  combat: CombatState;
  onPlayCard: (instanceId: string) => void;
  onEndTurn: () => void;
  onContinue: () => void;
}

export function BattleScreen({ combat, onPlayCard, onEndTurn, onContinue }: BattleScreenProps) {
  const isPlayerTurn = combat.phase === 'playerTurn';
  const { player, enemy } = combat;

  return (
    <section className="battle">
      <div className="battle__main">
        <div className="battle__combatants">
          <div className="combatant combatant--enemy">
            <p className="eyebrow combatant__tag">Hostile contact</p>
            <h3 className="combatant__name">{enemy.name}</h3>
            <IntentReadout intent={enemy.intent} />
            {enemy.weakenTurnsRemaining > 0 && (
              <p className="combatant__status">
                Weakened −{enemy.weakenAmount} for {enemy.weakenTurnsRemaining}t
              </p>
            )}
            <HpBar value={enemy.hull} max={enemy.maxHull} tone="threat" />
            {enemy.shield > 0 && <ShieldChip value={enemy.shield} />}
          </div>

          <div className="combatant combatant--player">
            <p className="eyebrow combatant__tag">Your ship</p>
            <div className="combatant__resources">
              <PowerPips current={player.power} max={player.maxPower} />
              {player.shield > 0 && <ShieldChip value={player.shield} />}
            </div>
            <HpBar value={player.hull} max={player.maxHull} tone="hull" />
          </div>
        </div>

        <div className="battle__hand" role="list" aria-label="Your hand">
          {combat.hand.map((instance) => {
            const def = cardDefinitions[instance.cardId];
            const playable = isPlayerTurn && player.power >= def.cost;
            return (
              <div role="listitem" key={instance.instanceId}>
                <Card
                  card={def}
                  playable={playable}
                  onClick={() => onPlayCard(instance.instanceId)}
                />
              </div>
            );
          })}
        </div>

        <div className="battle__bar">
          <span className="pilecount mono">
            Draw <b>{combat.drawPile.length}</b> · Discard <b>{combat.discardPile.length}</b> · Turn{' '}
            <b>{combat.turn}</b>
          </span>
          <button className="btn-primary" disabled={!isPlayerTurn} onClick={onEndTurn}>
            End turn
          </button>
        </div>
      </div>

      <BattleLog log={combat.log} />

      {(combat.phase === 'won' || combat.phase === 'lost') && (
        <div className="battle__overlay">
          <div className="panel battle__result">
            <p className="eyebrow">
              {combat.phase === 'won' ? 'Contact neutralized' : 'Hull breach'}
            </p>
            <h2>{combat.phase === 'won' ? 'Victory' : 'Ship lost'}</h2>
            <button className="btn-primary" onClick={onContinue}>
              Continue
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function IntentReadout({ intent }: { intent: Intent }) {
  const attack = intent.kind === 'attack';
  return (
    <div className={`intent ${attack ? 'intent--attack' : 'intent--defend'}`}>
      <span className="intent__label">{attack ? 'Incoming attack' : 'Bracing'}</span>
      <span className="intent__value mono">
        {attack ? '⌖' : '◈'} {intent.amount}
      </span>
    </div>
  );
}

function HpBar({ value, max, tone }: { value: number; max: number; tone: 'hull' | 'threat' }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div className={`hpbar hpbar--${tone}`}>
      <div className="hpbar__head">
        <span className="hpbar__label">Hull</span>
        <span className="hpbar__val mono">
          {value}/{max}
        </span>
      </div>
      <div className="hpbar__track">
        <div className="hpbar__fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function ShieldChip({ value }: { value: number }) {
  return (
    <span className="shieldchip mono" title="Shields">
      ◈ {value}
    </span>
  );
}

function PowerPips({ current, max }: { current: number; max: number }) {
  return (
    <span
      className="pips"
      title={`Reactor power ${current}/${max}`}
      aria-label={`Power ${current} of ${max}`}
    >
      {Array.from({ length: max }).map((_, i) => (
        <span key={i} className={i < current ? 'pip pip--on' : 'pip'} />
      ))}
    </span>
  );
}
