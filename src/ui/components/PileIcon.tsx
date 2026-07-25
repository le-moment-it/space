/**
 * Card-stack glyph for the combat piles. All three share the same stack; the mark
 * says what happens to the cards — up/out of the draw pile, down/into the discard,
 * struck through for exhausted (gone for the fight) — so they read as one family.
 */
export function PileIcon({ variant }: { variant: 'draw' | 'discard' | 'exhaust' }) {
  return (
    <svg
      className="pileicon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* back card, offset — reads as a stack rather than a single card */}
      <rect x="4.5" y="6.5" width="10" height="13" rx="1.6" opacity="0.45" />
      <rect x="8" y="4" width="10" height="13" rx="1.6" fill="var(--hull)" />
      {variant === 'draw' && <path d="M13 13.5V7.8M10.9 9.9L13 7.7l2.1 2.2" />}
      {variant === 'discard' && <path d="M13 7.5v5.7M10.9 11.1l2.1 2.2 2.1-2.2" />}
      {variant === 'exhaust' && <path d="M10.4 13.1l5.2-5.2M10.4 7.9l5.2 5.2" />}
    </svg>
  );
}
