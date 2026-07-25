import type {
  CardDefinition,
  CardEffect,
  CardRarity,
  CardType,
  UpgradeLevel,
} from '../../engine/cards/types';
import { effectsOf, rarityOf, resolveCard } from '../../engine/cards/types';
import { useTranslation, type Translator, type UiKey } from '../../i18n';
import { CardArt } from './CardArt';
import { Keyword } from './Keyword';
import './Card.css';

const TYPE_LABEL_KEY: Record<CardType, UiKey> = {
  weapon: 'card.type.weapon',
  maneuver: 'card.type.maneuver',
  shipSystem: 'card.type.shipSystem',
  crew: 'card.type.crew',
};

const RARITY_LABEL_KEY: Record<CardRarity, UiKey> = {
  common: 'card.rarity.common',
  rare: 'card.rarity.rare',
  epic: 'card.rarity.epic',
  legendary: 'card.rarity.legendary',
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
          {effect.times && effect.times > 1 ? (
            <>
              {' '}
              <b className="kw kw--damage">×{effect.times}</b>
            </>
          ) : null}
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
    case 'corrosion':
      return (
        <>
          {t('effect.apply')}{' '}
          <b className="kw kw--corrosion">
            {effect.amount} {t('effect.corrosion')}
          </b>
          .
        </>
      );
    case 'breach':
      return (
        <>
          <b className="kw kw--corrosion">{t('effect.breach')}</b> {t('effect.for')}{' '}
          <b className="kw">
            {effect.amount} {t('effect.turns')}
          </b>
          .
        </>
      );
    case 'calibration':
      return (
        <>
          <b className="kw kw--damage">
            +{effect.amount} {t('effect.damage')}
          </b>{' '}
          {t('effect.perAttack')}.
        </>
      );
    case 'deflector':
      return (
        <>
          <b className="kw kw--shield">+{effect.amount}</b> {t('effect.perShield')}.
        </>
      );
    case 'charge':
      return (
        <>
          {t('effect.double')}{' '}
          <b className="kw kw--charge">
            {t(
              effect.target === 'damage'
                ? 'effect.nextAttack'
                : effect.target === 'shield'
                  ? 'effect.nextShield'
                  : 'effect.nextRepair',
            )}
          </b>
          .
        </>
      );
    default: {
      // Exhaustive: a new effect kind must print something, or it would silently
      // render a blank card face.
      const exhaustive: never = effect;
      throw new Error(`Unhandled card effect: ${JSON.stringify(exhaustive)}`);
    }
  }
}

interface CardProps {
  card: CardDefinition;
  /** Upgrade level of this copy. Resolved here, so callers pass the base definition. */
  level?: UpgradeLevel;
  playable?: boolean;
  dimmed?: boolean;
  onClick?: () => void;
}

export function Card({
  card: base,
  level = 0,
  playable = false,
  dimmed = false,
  onClick,
}: CardProps) {
  const { t, cardName } = useTranslation();
  const card = resolveCard(base, level);
  const interactive = Boolean(onClick);
  const className = [
    'card',
    playable ? 'card--playable' : '',
    dimmed ? 'card--dimmed' : '',
    interactive ? 'card--interactive' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const rarity = rarityOf(card);
  const unplayable = interactive && !playable;

  return (
    <button
      type="button"
      className={className}
      data-type={card.type}
      data-rarity={rarity}
      // aria-disabled rather than the disabled attribute: a natively disabled
      // button swallows pointer events on its children, which would kill
      // right-click on keywords for exactly the cards players need to read
      // (the ones they cannot afford). The click is guarded instead.
      aria-disabled={unplayable || undefined}
      onClick={unplayable ? undefined : onClick}
    >
      <div className="card__header">
        <span className="card__type">{t(TYPE_LABEL_KEY[card.type])}</span>
        <span className="card__cost mono">{card.cost}</span>
      </div>
      <div className="card__name" data-level={level > 0 ? level : undefined}>
        {cardName(card.id)}
        {'+'.repeat(level)}
      </div>
      <div className="card__viewport">
        <CardArt effect={card.effect} />
      </div>
      <div className="card__text">
        {effectsOf(card).map((effect, i) => (
          <span key={i}>
            {i > 0 && ' '}
            <EffectText effect={effect} t={t} />
          </span>
        ))}
      </div>
      {card.exhaust && (
        <div className="card__keywords">
          <Keyword id="exhaust" />
        </div>
      )}
      <div className="card__rarity">{t(RARITY_LABEL_KEY[rarity])}</div>
    </button>
  );
}
