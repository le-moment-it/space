import { useCallback, useRef, useState } from 'react';

/** How far the pointer must travel before a press becomes a drag rather than a click. */
const DRAG_THRESHOLD_PX = 8;

export interface DragState {
  /** The card being dragged, or null when nothing is in hand. */
  instanceId: string | null;
  /** Offset from where the drag started, in px. */
  dx: number;
  dy: number;
  /** True once the pointer has moved past the threshold. */
  active: boolean;
  /** True while the pointer is over the drop target. */
  overTarget: boolean;
}

const IDLE: DragState = { instanceId: null, dx: 0, dy: 0, active: false, overTarget: false };

/**
 * Pick a card up and throw it.
 *
 * Pointer events rather than mouse or touch handlers, so one code path covers both,
 * and `setPointerCapture` keeps the drag alive once the pointer leaves the small card
 * it started on. A press shorter than the threshold is left alone entirely — the
 * card's own onClick still fires, so clicking to play never became harder.
 *
 * `dropRef` is the region a card must be released over to be played; releasing
 * anywhere else springs it back.
 */
export function useCardDrag({
  dropRef,
  onDrop,
}: {
  dropRef: React.RefObject<HTMLElement | null>;
  onDrop: (instanceId: string) => void;
}) {
  const [drag, setDrag] = useState<DragState>(IDLE);
  const origin = useRef({ x: 0, y: 0 });
  // Read during pointermove without re-subscribing handlers on every frame.
  const activeRef = useRef(false);

  const isOverTarget = (x: number, y: number) => {
    const rect = dropRef.current?.getBoundingClientRect();
    return Boolean(rect && x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom);
  };

  const onPointerDown = useCallback(
    (instanceId: string) => (e: React.PointerEvent) => {
      // Left button only: right-click belongs to the upgrade preview.
      if (e.button !== 0) return;
      // A press that lands on a keyword opens its explainer instead of dragging.
      if ((e.target as HTMLElement).closest('.kw, .kwchip')) return;

      origin.current = { x: e.clientX, y: e.clientY };
      activeRef.current = false;
      setDrag({ instanceId, dx: 0, dy: 0, active: false, overTarget: false });
      e.currentTarget.setPointerCapture?.(e.pointerId);
    },
    [],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      setDrag((current) => {
        if (!current.instanceId) return current;
        const dx = e.clientX - origin.current.x;
        const dy = e.clientY - origin.current.y;
        const active = current.active || Math.hypot(dx, dy) > DRAG_THRESHOLD_PX;
        activeRef.current = active;
        return {
          ...current,
          dx,
          dy,
          active,
          overTarget: active && isOverTarget(e.clientX, e.clientY),
        };
      });
    },
    // isOverTarget closes over a ref, which is stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      e.currentTarget.releasePointerCapture?.(e.pointerId);
      setDrag((current) => {
        if (current.instanceId && current.active && isOverTarget(e.clientX, e.clientY)) {
          onDrop(current.instanceId);
        }
        return IDLE;
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onDrop],
  );

  const onPointerCancel = useCallback(() => setDrag(IDLE), []);

  /**
   * True when a real drag just ended. The card's click fires after pointerup, so
   * without this a completed drag would also register as a click and play twice.
   */
  const consumedClick = useCallback(() => {
    const was = activeRef.current;
    activeRef.current = false;
    return was;
  }, []);

  return { drag, onPointerDown, onPointerMove, onPointerUp, onPointerCancel, consumedClick };
}
