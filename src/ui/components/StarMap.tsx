import { useEffect, useRef } from 'react';
import { getAvailableNodeIds } from '../../engine/run/resolve';
import type { RunState } from '../../engine/run/types';
import { NodeGlyph } from './NodeGlyph';
import './StarMap.css';

const NODE = 46;
const COL_GAP = 84;
const ROW_GAP = 78;
const PAD_Y = 40;

interface StarMapProps {
  run: RunState;
  onEnter: (nodeId: string) => void;
}

/** Slay-the-Spire-style chart: sensor blips wired bottom (start) to top (boss). */
export function StarMap({ run, onEnter }: StarMapProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const available = getAvailableNodeIds(run);
  const layers = run.map.layers;

  const maxCols = Math.max(1, ...layers.map((l) => l.length));
  const width = maxCols * COL_GAP;
  const height = PAD_Y * 2 + layers.length * ROW_GAP;

  // Position every node in a bottom-up coordinate space.
  const pos = new Map<string, { x: number; y: number }>();
  layers.forEach((ids, layerIndex) => {
    const size = ids.length;
    ids.forEach((id, i) => {
      pos.set(id, {
        x: width / 2 + (i - (size - 1) / 2) * COL_GAP,
        y: height - PAD_Y - layerIndex * ROW_GAP,
      });
    });
  });
  pos.set(run.map.bossNodeId, { x: width / 2, y: PAD_Y });

  // Keep the player's current position (or the start row) in view.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const focus = run.currentNodeId ? pos.get(run.currentNodeId) : undefined;
    const targetY = focus ? focus.y : height;
    el.scrollTop = Math.max(0, targetY - el.clientHeight / 2);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run.currentNodeId]);

  const allNodeIds = [...Object.keys(run.map.nodes)];

  return (
    <div className="starmap-scroll" ref={scrollRef}>
      <div className="starmap" style={{ width, height }}>
        <svg className="starmap__wires" width={width} height={height} aria-hidden="true">
          {allNodeIds.flatMap((sourceId) => {
            const source = pos.get(sourceId);
            if (!source) return [];
            return run.map.nodes[sourceId].next.map((targetId) => {
              const target = pos.get(targetId);
              if (!target) return null;
              const active = sourceId === run.currentNodeId;
              const sy = source.y - NODE / 2;
              const ty = target.y + NODE / 2;
              const midY = (sy + ty) / 2;
              return (
                <path
                  key={`${sourceId}-${targetId}`}
                  className={active ? 'wire wire--active' : 'wire'}
                  d={`M${source.x} ${sy} C ${source.x} ${midY}, ${target.x} ${midY}, ${target.x} ${ty}`}
                />
              );
            });
          })}
        </svg>

        {allNodeIds.map((id) => {
          const p = pos.get(id);
          if (!p) return null;
          const node = run.map.nodes[id];
          const isCurrent = id === run.currentNodeId;
          const isAvailable = available.includes(id);
          const isVisited = run.visitedNodeIds.includes(id) && !isCurrent;
          const state = isCurrent
            ? 'current'
            : isAvailable
              ? 'available'
              : isVisited
                ? 'visited'
                : 'locked';
          return (
            <button
              key={id}
              className={`node node--${state} ${node.type === 'boss' ? 'node--boss' : ''}`}
              style={{ left: p.x, top: p.y, width: NODE, height: NODE }}
              disabled={!isAvailable}
              onClick={() => onEnter(id)}
              aria-label={`${node.type}${isAvailable ? ', available' : ''}`}
              title={node.type}
            >
              <NodeGlyph type={node.type} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
