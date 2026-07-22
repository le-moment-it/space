import { describe, expect, it } from 'vitest';
import { createRng } from '../rng';
import { generateMap } from './generate';
import { DEFAULT_MAP_CONFIG } from './types';

function allNodeIds(map: ReturnType<typeof generateMap>): string[] {
  return Object.keys(map.nodes);
}

function reachableFromEntries(map: ReturnType<typeof generateMap>): Set<string> {
  const visited = new Set<string>(map.entryNodeIds);
  const queue = [...map.entryNodeIds];
  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) continue;
    for (const next of map.nodes[current].next) {
      if (!visited.has(next)) {
        visited.add(next);
        queue.push(next);
      }
    }
  }
  return visited;
}

describe('generateMap', () => {
  it('produces at least 30 non-boss nodes, across many seeds', () => {
    for (let seed = 0; seed < 30; seed++) {
      const map = generateMap(createRng(seed));
      const nonBossCount = allNodeIds(map).filter((id) => id !== map.bossNodeId).length;
      expect(nonBossCount).toBeGreaterThanOrEqual(30);
    }
  });

  it('has exactly pathCount entry nodes, all type combat, at layer 0', () => {
    const map = generateMap(createRng(1));
    expect(map.entryNodeIds).toHaveLength(DEFAULT_MAP_CONFIG.pathCount);
    for (const id of map.entryNodeIds) {
      expect(map.nodes[id].type).toBe('combat');
      expect(map.nodes[id].layerIndex).toBe(0);
    }
  });

  it('has no dead ends: every non-boss node has 1-2 outgoing edges', () => {
    for (let seed = 0; seed < 20; seed++) {
      const map = generateMap(createRng(seed));
      for (const node of Object.values(map.nodes)) {
        if (node.id === map.bossNodeId) continue;
        expect(node.next.length).toBeGreaterThanOrEqual(1);
        expect(node.next.length).toBeLessThanOrEqual(2);
      }
    }
  });

  it('every node is reachable from the entry nodes, including the boss', () => {
    for (let seed = 0; seed < 20; seed++) {
      const map = generateMap(createRng(seed));
      const reachable = reachableFromEntries(map);
      expect(reachable.has(map.bossNodeId)).toBe(true);
      for (const id of allNodeIds(map)) {
        expect(reachable.has(id)).toBe(true);
      }
    }
  });

  it('the last content layer connects only to the boss node', () => {
    const map = generateMap(createRng(2));
    const lastLayer = map.layers[map.layers.length - 1];
    for (const id of lastLayer) {
      expect(map.nodes[id].next).toEqual([map.bossNodeId]);
    }
  });

  it('never places an elite node before eliteMinLayerIndex', () => {
    for (let seed = 0; seed < 30; seed++) {
      const map = generateMap(createRng(seed));
      for (const node of Object.values(map.nodes)) {
        if (node.layerIndex < DEFAULT_MAP_CONFIG.eliteMinLayerIndex) {
          expect(node.type).not.toBe('elite');
        }
      }
    }
  });

  it('never lets a rest node lead directly into another rest node', () => {
    for (let seed = 0; seed < 30; seed++) {
      const map = generateMap(createRng(seed));
      for (const node of Object.values(map.nodes)) {
        if (node.type !== 'rest') continue;
        for (const nextId of node.next) {
          expect(map.nodes[nextId].type).not.toBe('rest');
        }
      }
    }
  });

  it('is deterministic for a given seed', () => {
    const a = generateMap(createRng(42));
    const b = generateMap(createRng(42));
    expect(a).toEqual(b);
  });

  it('produces different maps for different seeds', () => {
    const a = generateMap(createRng(1));
    const b = generateMap(createRng(2));
    expect(a).not.toEqual(b);
  });
});
