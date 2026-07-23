import type { CardEffect } from '../../engine/cards/types';

/**
 * Cold line-art glyph shown in a card's viewport, keyed to what the card does.
 * Strokes use currentColor so the card frame can tint it with the type accent.
 */
export function CardArt({ effect }: { effect: CardEffect }) {
  return (
    <svg
      className="card__glyph"
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {glyph(effect)}
    </svg>
  );
}

function glyph(effect: CardEffect) {
  switch (effect.kind) {
    case 'damage':
      // targeting reticle locking a projectile
      return (
        <>
          <circle cx="24" cy="24" r="12" opacity="0.5" />
          <path d="M24 6v6M24 36v6M6 24h6M36 24h6" />
          <circle cx="24" cy="24" r="3.2" fill="currentColor" stroke="none" />
        </>
      );
    case 'shield':
      // deflector shield
      return (
        <>
          <path d="M24 6l14 5v11c0 9-6 15-14 20-8-5-14-11-14-20V11z" opacity="0.5" />
          <path d="M24 15v18M15 24h18" opacity="0.9" />
        </>
      );
    case 'heal':
      // repair pulse
      return (
        <>
          <path d="M4 24h9l4-9 6 18 4-9h9" />
          <circle cx="24" cy="24" r="15" opacity="0.35" />
        </>
      );
    case 'power':
      // reactor bolt
      return (
        <>
          <path
            d="M26 5L12 27h10l-4 16 18-24H24z"
            fill="currentColor"
            opacity="0.85"
            stroke="none"
          />
        </>
      );
    case 'weaken':
      // jammed signal
      return (
        <>
          <path d="M8 30c4-2 4-14 8-14s4 12 8 12 4-12 8-12 4 8 8 8" opacity="0.7" />
          <path d="M12 12l24 24" stroke="var(--hazard)" strokeWidth="2" />
        </>
      );
    case 'draw':
      // radar sweep
      return (
        <>
          <circle cx="24" cy="24" r="16" opacity="0.4" />
          <circle cx="24" cy="24" r="9" opacity="0.4" />
          <path d="M24 24L38 14" />
          <circle cx="33" cy="18" r="2" fill="currentColor" stroke="none" />
        </>
      );
    default:
      return <circle cx="24" cy="24" r="12" opacity="0.5" />;
  }
}
