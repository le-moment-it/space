import type { NodeType } from '../../engine/map/types';
import { getAvailableNodeIds } from '../../engine/run/resolve';
import type { RunState } from '../../engine/run/types';
import { useGameStore } from '../../state/gameStore';

const TYPE_ICON: Record<NodeType, string> = {
  combat: '⚔️',
  elite: '💀',
  event: '❓',
  rest: '🛠️',
  shop: '💰',
  treasure: '🎁',
  boss: '☠️',
};

export function MapScreen({ run }: { run: RunState }) {
  const enterNode = useGameStore((s) => s.enterNode);
  const available = getAvailableNodeIds(run);
  const columns = [...run.map.layers, [run.map.bossNodeId]];

  return (
    <section>
      <h2>Star chart — Act {run.act}</h2>
      <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '1rem' }}>
        {columns.map((columnNodeIds, columnIndex) => (
          <div
            key={columnIndex}
            style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
          >
            {columnNodeIds.map((nodeId) => {
              const node = run.map.nodes[nodeId];
              const isAvailable = available.includes(nodeId);
              const isVisited = run.visitedNodeIds.includes(nodeId);
              return (
                <button
                  key={nodeId}
                  disabled={!isAvailable}
                  onClick={() => enterNode(nodeId)}
                  style={{
                    opacity: isVisited ? 0.5 : 1,
                    fontWeight: isAvailable ? 'bold' : 'normal',
                  }}
                >
                  {TYPE_ICON[node.type]} {node.type}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </section>
  );
}
