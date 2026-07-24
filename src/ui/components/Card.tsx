import type { CardDefinition, CardEffect, CardType } from '../../engine/cards/types';
import { useTranslation, type Translator, type UiKey } from '../../i18n';
import { CardArt } from './CardArt';
import './Card.css';

const TYPE_LABEL_KEY: Record<CardType, UiKey> = {
  weapon: 'card.type.weapon',
  maneuver: 'card.type.maneuver',
  shipSystem: 'card.type.shipSystem',
  crew: 'card.type.crew',
};

/**
 * Renders a card's effect as text with the key numbers/verbs highlighted (machine voice).
 * The surrounding words come from the translator; the bolded value stays inline so the
 * verb + <b>amount unit</b> + suffix structure holds up in every supported language.
 */
export function EffectText({ effect, t }: { effect: CardEffect; t: Translator['t'] }) {
  switch (effect.kind) {
    case 'damage':
      return (
        <>
          {t('effect.deal')}{' '}
          <b className="kw kw--damage">
            {effect.amount} {t('effect.damage')}
          </b>
          .
        </>
      );
    case 'shield':
      return (
        <>
          {t('effect.gain')}{' '}
          <b className="kw kw--shield">
            {effect.amount} {t('effect.shields')}
          </b>
          .
        </>
      );
    case 'heal':
      return (
        <>
          {t('effect.repair')}{' '}
          <b className="kw kw--repair">
            {effect.amount} {t('effect.hull')}
          </b>
          .
        </>
      );
    case 'power':
      return (
        <>
          {t('effect.gain')}{' '}
          <b className="kw kw--power">
            {effect.amount} {t('effect.power')}
          </b>{' '}
          {t('effect.thisTurn')}.
        </>
      );
    case 'weaken':
      return (
        <>
          {t('effect.weaken')} —{' '}
          <b className="kw kw--weaken">
            −{effect.amount} {t('effect.damage')}
          </b>{' '}
          {t('effect.for')}{' '}
          <b className="kw">
            {effect.duration} {t('effect.turns')}
          </b>
          .
        </>
      );
    case 'draw':
      return (
        <>
          {t('effect.draw')} <b className="kw">{effect.amount}</b>{' '}
          {effect.amount === 1 ? t('effect.card') : t('effect.cards')}.
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
  const { t, cardName } = useTranslation();
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
        <span className="card__type">{t(TYPE_LABEL_KEY[card.type])}</span>
        <span className="card__cost mono">{card.cost}</span>
      </div>
      <div className="card__name">{cardName(card.id)}</div>
      <div className="card__viewport">
        <CardArt effect={card.effect} />
      </div>
      <div className="card__text">
        <EffectText effect={card.effect} t={t} />
      </div>
    </button>
  );
}
