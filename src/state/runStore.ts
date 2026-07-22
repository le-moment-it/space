import { create } from 'zustand';
import {
  cardDefinitions,
  eliteRewardCardIds,
  runCardPool,
  startingDeckCardIds,
} from '../data/cards';
import { bossEnemy, combatEnemies, eliteEnemies } from '../data/enemies';
import { eventDefinitions } from '../data/events';
import { createRng, type Rng } from '../engine/rng';
import { generateMap } from '../engine/map/generate';
import { DEFAULT_MAP_CONFIG } from '../engine/map/types';
import {
  acknowledgeCombat,
  buyShopItem,
  endRunCombatTurn,
  enterNode,
  initRun,
  leaveNode,
  playRunCombatCard,
  resolveEventChoice,
} from '../engine/run/resolve';
import { DEFAULT_RUN_CONFIG, type RunContent, type RunState } from '../engine/run/types';

const content: RunContent = {
  cardDefinitions,
  combatEnemies,
  eliteEnemies,
  bossEnemy,
  events: eventDefinitions,
  eliteRewardCardIds,
  shopCardPool: runCardPool,
  treasureCardPool: runCardPool,
};

function freshRun(rng: Rng): RunState {
  const map = generateMap(rng, DEFAULT_MAP_CONFIG);
  return initRun(map, startingDeckCardIds, DEFAULT_RUN_CONFIG);
}

interface RunStore {
  run: RunState;
  enterNode: (nodeId: string) => void;
  playCard: (instanceId: string) => void;
  endTurn: () => void;
  acknowledgeCombat: () => void;
  resolveEvent: (choiceIndex: number) => void;
  buyItem: (index: number) => void;
  leaveNode: () => void;
  restart: () => void;
}

export const useRunStore = create<RunStore>((set) => {
  let rng = createRng(Date.now());

  return {
    run: freshRun(rng),
    enterNode: (nodeId) => set((s) => ({ run: enterNode(s.run, nodeId, content, rng) })),
    playCard: (instanceId) =>
      set((s) => ({ run: playRunCombatCard(s.run, instanceId, content, rng) })),
    endTurn: () => set((s) => ({ run: endRunCombatTurn(s.run, content, rng) })),
    acknowledgeCombat: () => set((s) => ({ run: acknowledgeCombat(s.run) })),
    resolveEvent: (choiceIndex) =>
      set((s) => ({ run: resolveEventChoice(s.run, choiceIndex, content) })),
    buyItem: (index) => set((s) => ({ run: buyShopItem(s.run, index, content) })),
    leaveNode: () => set((s) => ({ run: leaveNode(s.run) })),
    restart: () => {
      rng = createRng(Date.now());
      set({ run: freshRun(rng) });
    },
  };
});
