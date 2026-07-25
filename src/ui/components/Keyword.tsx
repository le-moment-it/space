import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation, type UiKey } from '../../i18n';
import './Keyword.css';

/**
 * Registry of rules keywords. To add one: an entry here plus the two i18n keys.
 * `label` is what prints on the card; `desc` is the right-click explainer.
 */
export const KEYWORDS = {
  exhaust: { label: 'keyword.exhaust', desc: 'keyword.exhaust.desc' },
} as const satisfies Record<string, { label: UiKey; desc: UiKey }>;

export type KeywordId = keyof typeof KEYWORDS;

const LONG_PRESS_MS = 450;

/**
 * A rules keyword printed on a card. Right-click (or long-press on touch) opens a
 * short explainer, the way Hearthstone does — the card face stays terse and the
 * full rule is one gesture away.
 *
 * Renders as a <span>: cards are <button>s, so a nested button would be invalid.
 * The popover is portalled to <body> because .card sets overflow:hidden and gets a
 * transform on hover, either of which would clip or trap a positioned child.
 */
export function Keyword({ id }: { id: KeywordId }) {
  const { t } = useTranslation();
  const [at, setAt] = useState<{ x: number; y: number } | null>(null);
  const longPress = useRef<number | null>(null);
  const suppressClick = useRef(false);

  const label = t(KEYWORDS[id].label);
  const desc = t(KEYWORDS[id].desc);

  useEffect(() => {
    if (!at) return;
    const close = () => setAt(null);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    // Capture phase: dismiss before the click can reach a card underneath.
    window.addEventListener('pointerdown', close, true);
    window.addEventListener('scroll', close, true);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('pointerdown', close, true);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('keydown', onKey);
    };
  }, [at]);

  const open = (x: number, y: number) => setAt({ x, y });

  const cancelLongPress = () => {
    if (longPress.current !== null) {
      window.clearTimeout(longPress.current);
      longPress.current = null;
    }
  };

  return (
    <>
      <span
        className="kwchip"
        title={desc}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          open(e.clientX, e.clientY);
        }}
        onTouchStart={(e) => {
          const touch = e.touches[0];
          if (!touch) return;
          // Read the coordinates now: the Touch object is not guaranteed to
          // still be meaningful by the time the timer fires.
          const { clientX, clientY } = touch;
          suppressClick.current = false;
          longPress.current = window.setTimeout(() => {
            suppressClick.current = true;
            open(clientX, clientY);
          }, LONG_PRESS_MS);
        }}
        onTouchEnd={(e) => {
          cancelLongPress();
          // A long press opened the explainer — don't also play the card.
          if (suppressClick.current) e.preventDefault();
        }}
        onTouchMove={cancelLongPress}
      >
        {label}
      </span>

      {at && createPortal(<KeywordCard label={label} desc={desc} at={at} />, document.body)}
    </>
  );
}

const MARGIN = 12;
const WIDTH = 232;

function KeywordCard({
  label,
  desc,
  at,
}: {
  label: string;
  desc: string;
  at: { x: number; y: number };
}) {
  const ref = useRef<HTMLDivElement>(null);
  // Start at the pointer, then pull back inside the viewport once measured.
  const [pos, setPos] = useState({ left: at.x + MARGIN, top: at.y + MARGIN });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    const left = Math.min(at.x + MARGIN, window.innerWidth - width - MARGIN);
    const top =
      at.y + MARGIN + height > window.innerHeight ? at.y - height - MARGIN : at.y + MARGIN;
    setPos({ left: Math.max(MARGIN, left), top: Math.max(MARGIN, top) });
  }, [at]);

  return (
    <div
      ref={ref}
      className="kwcard"
      role="tooltip"
      style={{ left: pos.left, top: pos.top, width: WIDTH }}
    >
      <p className="kwcard__name">{label}</p>
      <p className="kwcard__desc">{desc}</p>
    </div>
  );
}
