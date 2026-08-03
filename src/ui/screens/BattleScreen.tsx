import { useRef, useState } from 'react';
import { cardDefinitions } from '../../data/cards';
import type { CombatState, Intent } from '../../engine/combat/types';
import { resolveCard } from '../../engine/cards/types';
import { statusAmount } from '../../engine/combat/status';
import { StatusChips } from '../components/StatusChips';
import { useTranslation, type Translator } from '../../i18n';
import { Card } from '../components/Card';
import { CardListModal } from '../components/CardListModal';
import { EnemyArt } from '../components/EnemyArt';
import { HeroShip } from '../components/HeroShip';
import { PileIcon } from '../components/PileIcon';
import { HandFan, type HandSlot } from '../components/HandFan';
import { useCardDrag } from '../components/useCardDrag';
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
  const arenaRef = useRef<HTMLDivElement>(null);
  const isPlayerTurn = combat.phase === 'playerTurn';
  const { player, enemy } = combat;

  const { drag, onPointerDown, onPointerMove, onPointerUp, onPointerCancel, consumedClick } =
    useCardDrag({ dropRef: arenaRef, onDrop: onPlayCard });

  const slots: HandSlot[] = combat.hand.map((instance) => {
    const def = cardDefinitions[instance.cardId];
    // Cost must come from the *upgraded* card: a cost-reducing upgrade would
    // otherwise grey out a card the engine would happily let you play.
    const playable = isPlayerTurn && player.power >= resolveCard(def, instance.level).cost;
    const dragging = drag.active && drag.instanceId === instance.instanceId;

    return {
      key: instance.instanceId,
      render: ({ className }) => (
        <Card
          card={def}
          level={instance.level}
          playable={playable}
          className={[
            className,
            dragging ? 'handfan__card--dragging' : '',
            dragging && drag.overTarget ? 'handfan__card--armed' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          // The held card's transform is inline on purpose. As a stylesheet rule it
          // lost to `.handfan__slot:hover .handfan__card:active` — the guard against
          // the global button:active — which outranks it while the mouse is down, so
          // the card never left the fan. Inline beats every rule and ends the contest.
          style={
            dragging
              ? {
                  // Built on top of the hover pose (lift and scale included) rather
                  // than replacing it, so picking a card up does not jog it a dozen
                  // pixels before it starts tracking.
                  transform: `translate(${drag.dx}px, calc(var(--fan-drop) - var(--lift) + ${drag.dy}px)) rotate(var(--fan-rotate)) scale(1.08)`,
                  transition: 'none',
                }
              : undefined
          }
          onPointerDown={playable ? onPointerDown(instance.instanceId) : undefined}
          onPointerMove={playable ? onPointerMove : undefined}
          onPointerUp={playable ? onPointerUp : undefined}
          onPointerCancel={playable ? onPointerCancel : undefined}
          onClick={() => {
            // The click that follows a completed drag would otherwise play it twice.
            if (consumedClick()) return;
            onPlayCard(instance.instanceId);
          }}
        />
      ),
    };
  });

  return (
    <section className="battle">
      <div ref={arenaRef} className={`battle__arena${drag.active ? ' battle__arena--armed' : ''}`}>
        <div className="combatant combatant--player">
          <p className="eyebrow combatant__tag">{t('battle.yourShip')}</p>
          <StatusChips statuses={player.statuses} />
          <HpBar value={player.hull} max={player.maxHull} tone="hull" t={t} />
          {player.shield > 0 && <ShieldChip value={player.shield} t={t} />}
          {/* The thing the numbers above are describing. It faces right, into the
              enemy panel, so the two sides read as facing each other. */}
          <div className="combatant__art combatant__art--player">
            <HeroShip animated />
          </div>
        </div>

        <p className="battle__drophint mono">{t('battle.dropHint')}</p>

        <div className="combatant combatant--enemy">
          <p className="eyebrow combatant__tag">{t('battle.hostileContact')}</p>
          <h3 className="combatant__name">{enemyName(enemy.id)}</h3>
          <IntentReadout
            intent={enemy.intent}
            weaken={statusAmount(enemy.statuses, 'weaken')}
            t={t}
          />
          <StatusChips statuses={enemy.statuses} />
          <HpBar value={enemy.hull} max={enemy.maxHull} tone="threat" t={t} />
          {enemy.shield > 0 && <ShieldChip value={enemy.shield} t={t} />}
          <EnemyArt enemyId={enemy.id} />
        </div>
      </div>

      {/* The table edge: what you spend on the left, what you do on the right, and
          the hand you hold between them. */}
      <div className="battle__table">
        <div className="battle__side">
          <EnergyOrb current={player.power} max={player.maxPower} t={t} />
          <PileButton
            variant="draw"
            count={combat.drawPile.length}
            label={t('pile.draw')}
            onClick={() => setOpenPile('draw')}
          />
        </div>

        <div className="battle__hand" role="list" aria-label={t('battle.yourHand')}>
          <HandFan
            slots={slots.map((slot) => ({
              ...slot,
              render: (props) => <div role="listitem">{slot.render(props)}</div>,
            }))}
          />
        </div>

        <div className="battle__side battle__side--right">
          <button className="btn-primary battle__end" disabled={!isPlayerTurn} onClick={onEndTurn}>
            {t('battle.endTurn')}
            <span className="battle__turn mono">
              {t('battle.turn')} {combat.turn}
            </span>
          </button>
          <div className="battle__piles">
            <PileButton
              variant="discard"
              count={combat.discardPile.length}
              label={t('pile.discard')}
              onClick={() => setOpenPile('discard')}
            />
            {/* Only surfaces once something is exhausted — decks without exhaust
                cards never see a pile that would always read zero. */}
            {combat.exhaustPile.length > 0 && (
              <PileButton
                variant="exhaust"
                count={combat.exhaustPile.length}
                label={t('pile.exhaust')}
                onClick={() => setOpenPile('exhaust')}
              />
            )}
          </div>
        </div>
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

function PileButton({
  variant,
  count,
  label,
  onClick,
}: {
  variant: 'draw' | 'discard' | 'exhaust';
  count: number;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={`pile pile--${variant}`}
      onClick={onClick}
      title={label}
      aria-label={`${label}: ${count}`}
    >
      <PileIcon variant={variant} />
      <span className="pile__count mono">{count}</span>
    </button>
  );
}

function IntentReadout({
  intent,
  weaken,
  t,
}: {
  intent: Intent;
  weaken: number;
  t: Translator['t'];
}) {
  const attack = intent.kind === 'attack';
  // Show what the attack will ACTUALLY land for. It previously advertised the raw
  // intent, so a weakened enemy said "10" and then hit for 7.
  const amount = attack ? Math.max(0, intent.amount - weaken) : intent.amount;
  const reduced = attack && amount < intent.amount;
  return (
    <div className={`intent ${attack ? 'intent--attack' : 'intent--defend'}`}>
      <span className="intent__label">
        {attack ? t('battle.incomingAttack') : t('battle.bracing')}
      </span>
      <span className="intent__value mono">
        {attack ? '⌖' : '◈'} {amount}
        {reduced && <s className="intent__was">{intent.amount}</s>}
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

/** The resource you spend, sized like it matters — not a row of status dots. */
function EnergyOrb({ current, max, t }: { current: number; max: number; t: Translator['t'] }) {
  return (
    <span
      className={`orb${current === 0 ? ' orb--spent' : ''}`}
      title={t('battle.reactorPower', { current, max })}
      aria-label={t('battle.powerAria', { current, max })}
    >
      <span className="orb__readout">
        <span className="orb__value mono">{current}</span>
        <span className="orb__max mono">/{max}</span>
      </span>
    </span>
  );
}
