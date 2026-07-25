import { useState } from 'react';
import { cardDefinitions } from '../../data/cards';
import type { CombatState, Intent } from '../../engine/combat/types';
import { resolveCard } from '../../engine/cards/types';
import { useTranslation, type Translator } from '../../i18n';
import { Card } from '../components/Card';
import { CardListModal } from '../components/CardListModal';
import { PileIcon } from '../components/PileIcon';
import './BattleScreen.css';

const PILES = {
  draw: (c: CombatState) => c.drawPile,
  discard: (c: CombatState) => c.discardPile,
  exhaust: (c: CombatState) => c.exhaustPile,
} as const;

interface BattleScreenProps {
  combat: CombatState;
  onPlayCard: (instanceId: string) => void;
  onEndTurn: () => void;
  onContinue: () => void;
}

export function BattleScreen({ combat, onPlayCard, onEndTurn, onContinue }: BattleScreenProps) {
  const tr = useTranslation();
  const { t, enemyName } = tr;
  const [openPile, setOpenPile] = useState<'draw' | 'discard' | 'exhaust' | null>(null);
  const isPlayerTurn = combat.phase === 'playerTurn';
  const { player, enemy } = combat;

  return (
    <section className="battle">
      <div className="battle__combatants">
        <div className="combatant combatant--enemy">
          <p className="eyebrow combatant__tag">{t('battle.hostileContact')}</p>
          <h3 className="combatant__name">{enemyName(enemy.id)}</h3>
          <IntentReadout intent={enemy.intent} t={t} />
          {enemy.weakenTurnsRemaining > 0 && (
            <p className="combatant__status">
              {t('battle.weakened', {
                amount: enemy.weakenAmount,
                turns: enemy.weakenTurnsRemaining,
              })}
            </p>
          )}
          <HpBar value={enemy.hull} max={enemy.maxHull} tone="threat" t={t} />
          {enemy.shield > 0 && <ShieldChip value={enemy.shield} t={t} />}
        </div>

        <div className="combatant combatant--player">
          <p className="eyebrow combatant__tag">{t('battle.yourShip')}</p>
          <div className="combatant__resources">
            <PowerPips current={player.power} max={player.maxPower} t={t} />
            {player.shield > 0 && <ShieldChip value={player.shield} t={t} />}
          </div>
          <HpBar value={player.hull} max={player.maxHull} tone="hull" t={t} />
        </div>
      </div>

      <div className="battle__hand" role="list" aria-label={t('battle.yourHand')}>
        {combat.hand.map((instance) => {
          const def = cardDefinitions[instance.cardId];
          // Cost must come from the *upgraded* card: a cost-reducing upgrade would
          // otherwise grey out a card the engine would happily let you play.
          const playable = isPlayerTurn && player.power >= resolveCard(def, instance.level).cost;
          return (
            <div role="listitem" key={instance.instanceId}>
              <Card
                card={def}
                level={instance.level}
                playable={playable}
                onClick={() => onPlayCard(instance.instanceId)}
              />
            </div>
          );
        })}
      </div>

      <div className="battle__bar">
        <div className="piles">
          <button
            className="pile"
            onClick={() => setOpenPile('draw')}
            title={t('pile.draw')}
            aria-label={`${t('pile.draw')}: ${combat.drawPile.length}`}
          >
            <PileIcon variant="draw" />
            <span className="pile__label">{t('pile.draw')}</span>
            <span className="pile__count mono">{combat.drawPile.length}</span>
          </button>
          <button
            className="pile"
            onClick={() => setOpenPile('discard')}
            title={t('pile.discard')}
            aria-label={`${t('pile.discard')}: ${combat.discardPile.length}`}
          >
            <PileIcon variant="discard" />
            <span className="pile__label">{t('pile.discard')}</span>
            <span className="pile__count mono">{combat.discardPile.length}</span>
          </button>
          {/* Only surfaces once something is exhausted — decks without exhaust
              cards never see a pile that would always read zero. */}
          {combat.exhaustPile.length > 0 && (
            <button
              className="pile pile--exhaust"
              onClick={() => setOpenPile('exhaust')}
              title={t('pile.exhaust')}
              aria-label={`${t('pile.exhaust')}: ${combat.exhaustPile.length}`}
            >
              <PileIcon variant="exhaust" />
              <span className="pile__label">{t('pile.exhaust')}</span>
              <span className="pile__count mono">{combat.exhaustPile.length}</span>
            </button>
          )}
          <span className="pilecount mono">
            {t('battle.turn')} <b>{combat.turn}</b>
          </span>
        </div>
        <button className="btn-primary" disabled={!isPlayerTurn} onClick={onEndTurn}>
          {t('battle.endTurn')}
        </button>
      </div>

      {openPile && (
        <CardListModal
          title={t(`pile.${openPile}`)}
          cards={PILES[openPile](combat)}
          note={
            openPile === 'draw'
              ? t('pile.drawNote')
              : openPile === 'exhaust'
                ? t('pile.exhaustNote')
                : undefined
          }
          onClose={() => setOpenPile(null)}
        />
      )}

      {(combat.phase === 'won' || combat.phase === 'lost') && (
        <div className="battle__overlay">
          <div className="panel battle__result">
            <p className="eyebrow">
              {combat.phase === 'won' ? t('battle.contactNeutralized') : t('battle.hullBreach')}
            </p>
            <h2>{combat.phase === 'won' ? t('battle.victory') : t('battle.shipLost')}</h2>
            <button className="btn-primary" onClick={onContinue}>
              {t('common.continue')}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function IntentReadout({ intent, t }: { intent: Intent; t: Translator['t'] }) {
  const attack = intent.kind === 'attack';
  return (
    <div className={`intent ${attack ? 'intent--attack' : 'intent--defend'}`}>
      <span className="intent__label">
        {attack ? t('battle.incomingAttack') : t('battle.bracing')}
      </span>
      <span className="intent__value mono">
        {attack ? '⌖' : '◈'} {intent.amount}
      </span>
    </div>
  );
}

function HpBar({
  value,
  max,
  tone,
  t,
}: {
  value: number;
  max: number;
  tone: 'hull' | 'threat';
  t: Translator['t'];
}) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div className={`hpbar hpbar--${tone}`}>
      <div className="hpbar__head">
        <span className="hpbar__label">{t('stat.hull')}</span>
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

function ShieldChip({ value, t }: { value: number; t: Translator['t'] }) {
  return (
    <span className="shieldchip mono" title={t('battle.shields')}>
      ◈ {value}
    </span>
  );
}

function PowerPips({ current, max, t }: { current: number; max: number; t: Translator['t'] }) {
  return (
    <span
      className="pips"
      title={t('battle.reactorPower', { current, max })}
      aria-label={t('battle.powerAria', { current, max })}
    >
      {Array.from({ length: max }).map((_, i) => (
        <span key={i} className={i < current ? 'pip pip--on' : 'pip'} />
      ))}
    </span>
  );
}
