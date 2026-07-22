import { cardDefinitions } from '../../data/cards';
import type { CombatState } from '../../engine/combat/types';

function intentLabel(intent: { kind: string; amount: number }): string {
  if (intent.kind === 'attack') return `Attack for ${intent.amount}`;
  return `Defend (+${intent.amount} shield)`;
}

interface BattleScreenProps {
  combat: CombatState;
  onPlayCard: (instanceId: string) => void;
  onEndTurn: () => void;
  onContinue: () => void;
}

export function BattleScreen({ combat, onPlayCard, onEndTurn, onContinue }: BattleScreenProps) {
  const isPlayerTurn = combat.phase === 'playerTurn';

  return (
    <section>
      <h2>Battle</h2>

      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
        <div>
          <h3>Your ship</h3>
          <p>
            Hull: {combat.player.hull}/{combat.player.maxHull}
          </p>
          <p>Shields: {combat.player.shield}</p>
          <p>
            Power: {combat.player.power}/{combat.player.maxPower}
          </p>
        </div>

        <div>
          <h3>{combat.enemy.name}</h3>
          <p>
            Hull: {combat.enemy.hull}/{combat.enemy.maxHull}
          </p>
          <p>Shields: {combat.enemy.shield}</p>
          <p>Intent: {intentLabel(combat.enemy.intent)}</p>
          {combat.enemy.weakenTurnsRemaining > 0 && (
            <p>
              Weakened: -{combat.enemy.weakenAmount} dmg ({combat.enemy.weakenTurnsRemaining} turns
              left)
            </p>
          )}
        </div>
      </div>

      <p>Turn {combat.turn}</p>

      {combat.phase === 'won' && (
        <div>
          <p>
            <strong>Victory!</strong> {combat.enemy.name} destroyed.
          </p>
          <button onClick={onContinue}>Continue</button>
        </div>
      )}

      {combat.phase === 'lost' && (
        <div>
          <p>
            <strong>Your ship was destroyed.</strong>
          </p>
          <button onClick={onContinue}>Continue</button>
        </div>
      )}

      <h3>Hand</h3>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {combat.hand.map((card) => {
          const def = cardDefinitions[card.cardId];
          const affordable = combat.player.power >= def.cost;
          return (
            <button
              key={card.instanceId}
              disabled={!isPlayerTurn || !affordable}
              onClick={() => onPlayCard(card.instanceId)}
              title={def.description}
            >
              {def.name} ({def.cost})
            </button>
          );
        })}
      </div>

      <p>
        <button disabled={!isPlayerTurn} onClick={onEndTurn}>
          End turn
        </button>
      </p>

      <h3>Draw pile: {combat.drawPile.length}</h3>
      <h3>Discard pile: {combat.discardPile.length}</h3>

      <h3>Log</h3>
      <ul>
        {combat.log
          .slice(-12)
          .reverse()
          .map((line, i) => (
            <li key={i}>{line}</li>
          ))}
      </ul>
    </section>
  );
}
