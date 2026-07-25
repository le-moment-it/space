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
    case 'corrosion':
      // Droplets eating into a surface.
      return (
        <>
          <path d="M14 30h20" />
          <path d="M18 30c0-4 3-6 3-10 0 4 3 6 3 10" opacity="0.9" />
          <circle cx="29" cy="20" r="2.5" />
          <circle cx="35" cy="26" r="1.8" opacity="0.7" />
        </>
      );
    case 'breach':
      // A cracked hull plate.
      return (
        <>
          <rect x="12" y="12" width="24" height="24" rx="3" opacity="0.55" />
          <path d="M20 12l5 10-7 5 8 9" stroke="var(--hazard)" />
        </>
      );
    case 'calibration':
      // Crosshair with adjustment ticks.
      return (
        <>
          <circle cx="24" cy="24" r="9" />
          <path d="M24 9v6M24 33v6M9 24h6M33 24h6" />
          <circle cx="24" cy="24" r="2" fill="currentColor" stroke="none" />
        </>
      );
    case 'deflector':
      // Layered shield arcs.
      return (
        <>
          <path d="M24 11l11 5v9c0 7-5 11-11 13-6-2-11-6-11-13v-9z" />
          <path d="M24 17l6 3v5c0 4-3 6-6 7-3-1-6-3-6-7v-5z" opacity="0.6" />
        </>
      );
    case 'charge':
      // A capacitor building charge.
      return (
        <>
          <path d="M17 14v20M31 14v20" />
          <path d="M24 16l-4 8h8l-4 8" stroke="var(--plasma)" />
        </>
      );
    default: {
      // Exhaustive: a new effect kind must get its own glyph rather than a blank disc.
      const exhaustive: never = effect;
      throw new Error(`Unhandled card effect art: ${JSON.stringify(exhaustive)}`);
    }
  }
}
