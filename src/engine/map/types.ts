export type NodeType = 'combat' | 'elite' | 'event' | 'rest' | 'shop' | 'treasure' | 'boss';

export interface MapNode {
  id: string;
  layerIndex: number;
  type: NodeType;
  /** Outgoing edges (node ids in the next layer, or the boss node from the last layer). */
  next: string[];
}

export interface MapGraph {
  nodes: Record<string, MapNode>;
  /** layers[i] = node ids in content layer i, in generation order. Does not include the boss. */
  layers: string[][];
  /** The pathCount entry points reachable at the very start of the act (== layers[0]). */
  entryNodeIds: string[];
  bossNodeId: string;
}

export interface MapConfig {
  layerCount: number;
  minNodesPerLayer: number;
  maxNodesPerLayer: number;
  pathCount: number;
  /** Elite nodes cannot appear in layers below this index. */
  eliteMinLayerIndex: number;
}

/**
 * layerCount=8, 4-5 nodes/layer guarantees >=30 non-boss nodes even in the worst
 * case roll (3 + 7*4 = 31), matching docs/GAME_DESIGN.md's "30+ nodes" target.
 */
export const DEFAULT_MAP_CONFIG: MapConfig = {
  layerCount: 8,
  minNodesPerLayer: 4,
  maxNodesPerLayer: 5,
  pathCount: 3,
  eliteMinLayerIndex: 2,
};
