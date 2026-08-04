import { useEffect, useRef, useState } from 'react';
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
import { UpgradePreview } from './UpgradePreview';
import './Card.css';

/** Matches the keyword explainer, so both gestures feel the same on touch. */
const LONG_PRESS_MS = 450;

const TYPE_LABEL_KEY: Record<CardType, UiKey> = {
  weapon: 'card.type.weapon',
  maneuver: 'card.type.maneuver',
  shipSystem: 'card.type.shipSystem',
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
              <Keyword id="multihit" className="kw kw--damage kw--term">
                ×{effect.times}
              </Keyword>
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
          <Keyword id="weaken" className="kw kw--weaken kw--term">
            {t('effect.weaken')}
          </Keyword>{' '}
          —{' '}
          <b className="kw kw--weaken">
            −{effect.amount} {t('effect.damage')}
          </b>{' '}
          {t('effect.for')}{' '}
          <b className="kw">
            {effect.duration} {t(effect.duration === 1 ? 'effect.turn' : 'effect.turns')}
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
          <Keyword id="corrosion" className="kw kw--corrosion kw--term">
            {effect.amount} {t('effect.corrosion')}
          </Keyword>
          .
        </>
      );
    case 'breach':
      return (
        <>
          <Keyword id="breach" className="kw kw--corrosion kw--term">
            {t('effect.breach')}
          </Keyword>{' '}
          {t('effect.for')}{' '}
          <b className="kw">
            {effect.amount} {t(effect.amount === 1 ? 'effect.turn' : 'effect.turns')}
          </b>
          .
        </>
      );
    case 'calibration':
      return (
        <>
          <Keyword id="calibration" className="kw kw--damage kw--term">
            +{effect.amount} {t('effect.damage')}
          </Keyword>{' '}
          {t('effect.perAttack')}.
        </>
      );
    case 'deflector':
      return (
        <>
          <Keyword id="deflector" className="kw kw--shield kw--term">
            +{effect.amount}
          </Keyword>{' '}
          {t('effect.perShield')}.
        </>
      );
    case 'charge':
      return (
        <>
          {t('effect.double')}{' '}
          <Keyword id="charge" className="kw kw--charge kw--term">
            {t(
              effect.target === 'damage'
                ? 'effect.nextAttack'
                : effect.target === 'shield'
                  ? 'effect.nextShield'
                  : 'effect.nextRepair',
            )}
          </Keyword>
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
  /**
   * The tier this copy actually is, when that differs from the one being displayed.
   * RewardScreen shows a card at its *post*-upgrade level, so the preview would
   * otherwise mark a tier the player does not own as "current".
   */
  ownedLevel?: UpgradeLevel;
  /** False inside the upgrade preview itself, so its cards can't open more previews. */
  previewable?: boolean;
  playable?: boolean;
  dimmed?: boolean;
  onClick?: () => void;
  /**
   * Extra classes and pointer handlers for a card in hand. The hand fan positions and
   * transforms the card itself, so it also opts out of the built-in hover lift below —
   * two competing transforms on one element is how the fan starts fighting the cursor.
   */
  className?: string;
  style?: React.CSSProperties;
  onPointerDown?: (e: React.PointerEvent) => void;
  onPointerMove?: (e: React.PointerEvent) => void;
  onPointerUp?: (e: React.PointerEvent) => void;
  onPointerCancel?: (e: React.PointerEvent) => void;
}

export function Card({
  card: base,
  level = 0,
  ownedLevel,
  previewable = true,
  playable = false,
  dimmed = false,
  onClick,
  className: extraClassName,
  style,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
}: CardProps) {
  const { t, cardName } = useTranslation();
  const [previewOpen, setPreviewOpen] = useState(false);
  const longPress = useRef<number | null>(null);
  const card = resolveCard(base, level);

  // A long press opened the preview — swallow the click that follows so the card
  // isn't also played/added.
  const suppressClick = useRef(false);
  useEffect(
    () => () => {
      if (longPress.current !== null) window.clearTimeout(longPress.current);
    },
    [],
  );

  const cancelLongPress = () => {
    if (longPress.current !== null) {
      window.clearTimeout(longPress.current);
      longPress.current = null;
    }
  };
  const interactive = Boolean(onClick);
  const className = [
    'card',
    playable ? 'card--playable' : '',
    dimmed ? 'card--dimmed' : '',
    interactive ? 'card--interactive' : '',
    // The fan owns this card's transform; suppress the card's own hover lift.
    extraClassName ? 'card--positioned' : '',
    extraClassName ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  const rarity = rarityOf(card);
  const unplayable = interactive && !playable;

  return (
    // The preview is a SIBLING of the button, not a child. A portal escapes DOM
    // containment but not React's synthetic event tree, so nesting it would make
    // clicking the panel's backdrop or close button also play the card.
    <>
      <button
        type="button"
        className={className}
        style={style}
        data-type={card.type}
        data-rarity={rarity}
        // aria-disabled rather than the disabled attribute: a natively disabled
        // button swallows pointer events on its children, which would kill
        // right-click on keywords for exactly the cards players need to read
        // (the ones they cannot afford). The click is guarded instead.
        aria-disabled={unplayable || undefined}
        onClick={
          unplayable
            ? undefined
            : () => {
                if (suppressClick.current) {
                  suppressClick.current = false;
                  return;
                }
                onClick?.();
              }
        }
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onContextMenu={
          previewable
            ? (e) => {
                // Keywords stopPropagation on their own contextmenu, so a right-click
                // that lands on one never reaches here — the rules explainer wins.
                e.preventDefault();
                setPreviewOpen(true);
              }
            : undefined
        }
        onTouchStart={
          previewable
            ? () => {
                suppressClick.current = false;
                longPress.current = window.setTimeout(() => {
                  suppressClick.current = true;
                  setPreviewOpen(true);
                }, LONG_PRESS_MS);
              }
            : undefined
        }
        onTouchEnd={previewable ? cancelLongPress : undefined}
        onTouchMove={previewable ? cancelLongPress : undefined}
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
          <CardArt cardId={card.id} effect={card.effect} />
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

      {previewOpen && (
        <UpgradePreview
          card={base}
          level={ownedLevel ?? level}
          onClose={() => setPreviewOpen(false)}
        />
      )}
    </>
  );
}
