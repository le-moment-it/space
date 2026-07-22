import { weightedPick, type Rng } from '../rng';
import type { MapConfig, MapGraph, MapNode, NodeType } from './types';
import { DEFAULT_MAP_CONFIG } from './types';

const NODE_TYPE_WEIGHTS: { value: NodeType; weight: number }[] = [
  { value: 'combat', weight: 45 },
  { value: 'event', weight: 20 },
  { value: 'elite', weight: 10 },
  { value: 'rest', weight: 10 },
  { value: 'shop', weight: 8 },
  { value: 'treasure', weight: 7 },
];

function nodeId(layerIndex: number, index: number): string {
  return `l${layerIndex}n${index}`;
}

/**
 * Generates a branching star chart for one act: a layered graph where the first
 * layer has exactly `pathCount` nodes (the act's entry points), later layers braid
 * together via crossing edges, and the last layer converges onto a single boss node.
 * See docs/GAME_DESIGN.md §3 for the design rationale.
 */
export function generateMap(rng: Rng, config: MapConfig = DEFAULT_MAP_CONFIG): MapGraph {
  const layerSizes: number[] = [];
  for (let i = 0; i < config.layerCount; i++) {
    if (i === 0) {
      layerSizes.push(config.pathCount);
    } else {
      const span = config.maxNodesPerLayer - config.minNodesPerLayer + 1;
      layerSizes.push(config.minNodesPerLayer + rng.nextInt(span));
    }
  }

  const layers: string[][] = layerSizes.map((size, layerIndex) =>
    Array.from({ length: size }, (_, index) => nodeId(layerIndex, index)),
  );

  const outgoing = new Map<string, Set<string>>();
  const incoming = new Map<string, Set<string>>();
  const addEdge = (from: string, to: string): void => {
    if (!outgoing.has(from)) outgoing.set(from, new Set());
    if (!incoming.has(to)) incoming.set(to, new Set());
    outgoing.get(from)?.add(to);
    incoming.get(to)?.add(from);
  };

  // Step 1: pathCount base random walks guarantee start->last-layer connectivity and
  // give the map its "braided paths" look (each walk can drift ±1 slot per layer).
  // When two walks converge on the same node, cap its outgoing edges at 2 by having
  // the extra walk(s) continue along an edge that already exists, rather than forking
  // a 3rd distinct path out of one node.
  for (let p = 0; p < config.pathCount; p++) {
    let currentIndex = Math.min(p, layerSizes[0] - 1);
    for (let layerIndex = 0; layerIndex < config.layerCount - 1; layerIndex++) {
      const from = nodeId(layerIndex, currentIndex);
      const nextSize = layerSizes[layerIndex + 1];
      const existingOut = outgoing.get(from);
      let nextIndex: number;
      if (existingOut && existingOut.size >= 2) {
        const chosenTarget = rng.pick([...existingOut]);
        nextIndex = layers[layerIndex + 1].indexOf(chosenTarget);
      } else {
        const delta = rng.pick([-1, 0, 1]);
        nextIndex = Math.max(0, Math.min(nextSize - 1, currentIndex + delta));
        addEdge(from, nodeId(layerIndex + 1, nextIndex));
      }
      currentIndex = nextIndex;
    }
  }

  // Step 2: fix-up pass so nothing is a dead end (every node has >=1 outgoing edge)
  // or unreachable (every node has >=1 incoming edge from an already-reachable layer).
  for (let layerIndex = 0; layerIndex < config.layerCount - 1; layerIndex++) {
    const nextSize = layerSizes[layerIndex + 1];
    for (const id of layers[layerIndex]) {
      if (!outgoing.get(id)?.size) {
        addEdge(id, nodeId(layerIndex + 1, rng.nextInt(nextSize)));
      }
    }
  }
  for (let layerIndex = 1; layerIndex < config.layerCount; layerIndex++) {
    for (const id of layers[layerIndex]) {
      if (incoming.get(id)?.size) continue;
      // Prefer a source node that's still under the 2-outgoing-edge cap; only fall
      // back to an over-cap source if every node in the previous layer is already full.
      const prevLayer = layers[layerIndex - 1];
      const underCap = prevLayer.filter(
        (candidateId) => (outgoing.get(candidateId)?.size ?? 0) < 2,
      );
      const source = underCap.length > 0 ? rng.pick(underCap) : rng.pick(prevLayer);
      addEdge(source, id);
    }
  }

  // Step 3: a chance at a second outgoing edge per node, for extra path-crossing.
  for (let layerIndex = 0; layerIndex < config.layerCount - 1; layerIndex++) {
    const nextSize = layerSizes[layerIndex + 1];
    for (const id of layers[layerIndex]) {
      const currentOut = outgoing.get(id);
      if ((currentOut?.size ?? 0) < 2 && rng.next() < 0.3) {
        addEdge(id, nodeId(layerIndex + 1, rng.nextInt(nextSize)));
      }
    }
  }

  // Step 4: the last content layer converges onto a single boss node.
  const bossNodeId = 'boss';
  const lastLayerIndex = config.layerCount - 1;
  for (const id of layers[lastLayerIndex]) {
    addEdge(id, bossNodeId);
  }

  // Step 5: assign node types. Layer 0 is always combat (a gentle, predictable
  // opener). Elites are excluded below eliteMinLayerIndex; rest nodes can't
  // directly follow another rest node.
  const types = new Map<string, NodeType>();
  for (let layerIndex = 0; layerIndex < config.layerCount; layerIndex++) {
    for (const id of layers[layerIndex]) {
      if (layerIndex === 0) {
        types.set(id, 'combat');
        continue;
      }
      const predecessorTypes = [...(incoming.get(id) ?? [])].map((predId) => types.get(predId));
      const disallowRest = predecessorTypes.includes('rest');
      const disallowElite = layerIndex < config.eliteMinLayerIndex;
      const allowed = NODE_TYPE_WEIGHTS.filter(
        (entry) =>
          !(entry.value === 'rest' && disallowRest) && !(entry.value === 'elite' && disallowElite),
      );
      types.set(id, weightedPick(allowed, rng));
    }
  }
  types.set(bossNodeId, 'boss');

  const nodes: Record<string, MapNode> = {};
  for (let layerIndex = 0; layerIndex < config.layerCount; layerIndex++) {
    for (const id of layers[layerIndex]) {
      const type = types.get(id);
      if (!type) throw new Error(`Missing type for node ${id}`);
      nodes[id] = { id, layerIndex, type, next: [...(outgoing.get(id) ?? [])] };
    }
  }
  nodes[bossNodeId] = { id: bossNodeId, layerIndex: config.layerCount, type: 'boss', next: [] };

  return {
    nodes,
    layers,
    entryNodeIds: [...layers[0]],
    bossNodeId,
  };
}
