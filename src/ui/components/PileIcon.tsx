/**
 * Card-stack glyph for the combat piles. Both are the same stack of cards; the
 * arrow says which way cards are moving — up/out of the draw pile, down/into
 * the discard — so the two read as a matched pair at a glance.
 */
export function PileIcon({ variant }: { variant: 'draw' | 'discard' }) {
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
      {variant === 'draw' ? (
        <path d="M13 13.5V7.8M10.9 9.9L13 7.7l2.1 2.2" />
      ) : (
        <path d="M13 7.5v5.7M10.9 11.1l2.1 2.2 2.1-2.2" />
      )}
    </svg>
  );
}
