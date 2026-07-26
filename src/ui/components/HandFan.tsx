import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import './HandFan.css';

/** Degrees between neighbouring cards. Small: a hand should arc, not splay. */
const SPREAD_DEG = 5;
/** How far the outer cards sit below the middle one, per squared step. */
const ARC_PX = 5;
/** Card width — must match `--card-w` in Card.css. */
const CARD_W = 158;
/**
 * Widest gap between successive cards. Wider than a card, so a hand that fits does
 * not overlap at all — overlap costs you the effect text, and a card you cannot read
 * is a card you cannot choose.
 */
const MAX_STEP = CARD_W + 10;
/**
 * Tightest gap. Enough to keep the cost pip and the start of the name visible, so a
 * crowded hand is still countable and aimable; hover pulls the card out to read it.
 */
const MIN_STEP = 42;

export interface HandSlot {
  key: string;
  /** The card itself. It is transformed inside its slot, never the slot. */
  render: (props: { className: string }) => ReactNode;
}

/**
 * The distance between one card's left edge and the next, chosen so the whole hand
 * fits `width`.
 *
 * Overlap is a last resort rather than the default look: cards spread to their full
 * width whenever the table is wide enough, and only slide over each other as the hand
 * grows past what the space allows.
 *
 * Fixed overlap does not work either way — the fan spills outward from the centre, and
 * at seven cards it sat on top of the energy orb and the End Turn button.
 */
function stepFor(count: number, width: number): number {
  if (count < 2) return MAX_STEP;
  const toFit = (width - CARD_W) / (count - 1);
  return Math.max(MIN_STEP, Math.min(MAX_STEP, toFit));
}

/**
 * The hand, fanned.
 *
 * Each card sits in a **fixed, non-transforming slot that is taller than the card**,
 * with the card resting at the slot's bottom. Hover is tracked on the slot, so when
 * the card straightens and lifts the pointer is still inside the slot that owns it.
 *
 * That structure is the whole point. Transforming the hovered element directly is
 * what broke the upgrade preview: straightening a rotated card shifted it sideways,
 * the pointer fell off, the hover dropped, it re-tilted, and it oscillated. Giving
 * the hit area its own stable box makes the effect safe.
 */
export function HandFan({ slots }: { slots: HandSlot[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  // Measured rather than assumed: the column this sits in changes with the viewport,
  // and the overlap has to follow it or the fan overruns the controls beside it.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setWidth(el.clientWidth);
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const count = slots.length;
  const mid = (count - 1) / 2;
  const step = stepFor(count, width || CARD_W * 2);

  return (
    <div className="handfan" ref={ref} data-count={count}>
      {slots.map((slot, i) => {
        const offset = i - mid;
        return (
          <div
            key={slot.key}
            className="handfan__slot"
            style={{
              // Slots overlap; later cards sit on top, the way a held hand looks.
              marginLeft: i === 0 ? 0 : `${step - CARD_W}px`,
              zIndex: i + 1,
              ['--fan-rotate' as string]: `${offset * SPREAD_DEG}deg`,
              ['--fan-drop' as string]: `${offset * offset * ARC_PX}px`,
            }}
          >
            {slot.render({ className: 'handfan__card' })}
          </div>
        );
      })}
    </div>
  );
}
