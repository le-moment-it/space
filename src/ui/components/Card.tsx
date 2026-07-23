import type { CardDefinition, CardEffect, CardType } from '../../engine/cards/types';
import { CardArt } from './CardArt';
import './Card.css';

const TYPE_LABEL: Record<CardType, string> = {
  weapon: 'Weapon',
  maneuver: 'Maneuver',
  shipSystem: 'System',
  crew: 'Crew',
};

/** Renders a card's effect as text with the key numbers/verbs highlighted (machine voice). */
function EffectText({ effect }: { effect: CardEffect }) {
  switch (effect.kind) {
    case 'damage':
      return (
        <>
          Deal <b className="kw kw--damage">{effect.amount} damage</b>.
        </>
      );
    case 'shield':
      return (
        <>
          Gain <b className="kw kw--shield">{effect.amount} shields</b>.
        </>
      );
    case 'heal':
      return (
        <>
          Repair <b className="kw kw--repair">{effect.amount} hull</b>.
        </>
      );
    case 'power':
      return (
        <>
          Gain <b className="kw kw--power">{effect.amount} power</b> this turn.
        </>
      );
    case 'weaken':
      return (
        <>
          Weaken — <b className="kw kw--weaken">−{effect.amount} damage</b> for{' '}
          <b className="kw">{effect.duration} turns</b>.
        </>
      );
    case 'draw':
      return (
        <>
          Draw <b className="kw">{effect.amount}</b> {effect.amount === 1 ? 'card' : 'cards'}.
        </>
      );
    default:
      return null;
  }
}

interface CardProps {
  card: CardDefinition;
  playable?: boolean;
  dimmed?: boolean;
  onClick?: () => void;
}

export function Card({ card, playable = false, dimmed = false, onClick }: CardProps) {
  const interactive = Boolean(onClick);
  const className = [
    'card',
    playable ? 'card--playable' : '',
    dimmed ? 'card--dimmed' : '',
    interactive ? 'card--interactive' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type="button"
      className={className}
      data-type={card.type}
      disabled={interactive && !playable}
      onClick={onClick}
    >
      <div className="card__header">
        <span className="card__type">{TYPE_LABEL[card.type]}</span>
        <span className="card__cost mono">{card.cost}</span>
      </div>
      <div className="card__name">{card.name}</div>
      <div className="card__viewport">
        <CardArt effect={card.effect} />
      </div>
      <div className="card__text">
        <EffectText effect={card.effect} />
      </div>
    </button>
  );
}
