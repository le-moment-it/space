import { create } from 'zustand';
import {
  cardDefinitions,
  defaultUnlockedCardIds,
  eliteRewardCardIds,
  runCardPool,
  startingDeckCardIds,
} from '../data/cards';
import { bossEnemyByAct, combatEnemiesByAct, eliteEnemiesByAct } from '../data/enemies';
import { eventDefinitions } from '../data/events';
import { milestoneDefinitions } from '../data/milestones';
import { defaultUnlockedShipSystemIds, shipSystemDefinitions } from '../data/shipSystems';
import { generateMap } from '../engine/map/generate';
import { DEFAULT_MAP_CONFIG } from '../engine/map/types';
import { evaluateMilestones } from '../engine/progression/unlocks';
import {
  acknowledgeCombat,
  buyShopItem,
  chooseShipSystemReward,
  endRunCombatTurn,
  enterNode,
  getAvailableNodeIds,
  initRun,
  leaveNode,
  playRunCombatCard,
  resolveEventChoice,
} from '../engine/run/resolve';
import { DEFAULT_RUN_CONFIG, type RunContent, type RunState } from '../engine/run/types';
import { createRng, type Rng } from '../engine/rng';
import { loadSave, persistSave } from '../engine/save/serialize';
import type { SaveDataV2, SaveMetaV2 } from '../engine/save/types';

const SAVE_DEFAULTS = {
  unlockedCardIds: defaultUnlockedCardIds,
  unlockedShipSystemIds: defaultUnlockedShipSystemIds,
};

function buildRunContent(meta: SaveMetaV2): RunContent {
  const unlockedCards = new Set(meta.unlockedCardIds);
  const unlockedShopPool = runCardPool.filter((id) => unlockedCards.has(id));
  const unlockedEliteRewards = eliteRewardCardIds.filter((id) => unlockedCards.has(id));

  return {
    cardDefinitions,
    combatEnemiesByAct,
    eliteEnemiesByAct,
    bossEnemyByAct,
    events: eventDefinitions,
    eliteRewardCardIds:
      unlockedEliteRewards.length > 0 ? unlockedEliteRewards : meta.unlockedCardIds,
    shopCardPool: unlockedShopPool,
    treasureCardPool: unlockedShopPool,
    shipSystemDefinitions,
    availableShipSystemIds: meta.unlockedShipSystemIds,
  };
}

/**
 * Detects run-ending / milestone-relevant transitions between two RunState snapshots
 * and updates lifetime stats + re-evaluates milestones accordingly. Works regardless
 * of which action caused the transition (combat, an event's hull effect, etc.).
 */
function applyBookkeeping(prevRun: RunState, nextRun: RunState, meta: SaveMetaV2): SaveMetaV2 {
  let stats = meta.stats;
  let changed = false;

  const currentNode = prevRun.currentNodeId ? prevRun.map.nodes[prevRun.currentNodeId] : undefined;
  const justWon = prevRun.activeCombat?.phase !== 'won' && nextRun.activeCombat?.phase === 'won';
  if (justWon && currentNode?.type === 'elite') {
    stats = { ...stats, elitesDefeated: stats.elitesDefeated + 1 };
    changed = true;
  }
  if (justWon && currentNode?.type === 'boss') {
    stats = { ...stats, bossesDefeated: stats.bossesDefeated + 1 };
    changed = true;
  }

  if (nextRun.act > stats.highestActReached) {
    stats = { ...stats, highestActReached: nextRun.act };
    changed = true;
  }

  if (prevRun.phase !== 'runLost' && nextRun.phase === 'runLost') {
    stats = { ...stats, runsLost: stats.runsLost + 1 };
    changed = true;
  }
  if (prevRun.phase !== 'runWon' && nextRun.phase === 'runWon') {
    stats = { ...stats, runsWon: stats.runsWon + 1 };
    changed = true;
  }

  if (!changed) return meta;
  return evaluateMilestones({ ...meta, stats }, milestoneDefinitions);
}

interface GameStore {
  meta: SaveMetaV2;
  run: RunState | null;
  appPhase: 'hub' | 'run';
  startNewRun: () => void;
  enterNode: (nodeId: string) => void;
  playCard: (instanceId: string) => void;
  endTurn: () => void;
  acknowledgeCombat: () => void;
  chooseShipSystem: (shipSystemId: string) => void;
  resolveEvent: (choiceIndex: number) => void;
  buyItem: (index: number) => void;
  leaveNode: () => void;
  returnToHub: () => void;
}

export const useGameStore = create<GameStore>((set, get) => {
  let rng: Rng = createRng(Date.now());

  const initialSave: SaveDataV2 = loadSave(SAVE_DEFAULTS);

  function persist(meta: SaveMetaV2, run: RunState | null): void {
    persistSave({ version: 2, meta, currentRun: run });
  }

  // Commit any migration immediately, so a session that never mutates state (loads
  // the Hub, closes the tab) doesn't leave a stale-version payload in localStorage.
  persist(initialSave.meta, initialSave.currentRun);

  function withRun(mutate: (run: RunState, content: RunContent) => RunState): void {
    const { run, meta } = get();
    if (!run) return;
    const content = buildRunContent(meta);
    const nextRun = mutate(run, content);
    const nextMeta = applyBookkeeping(run, nextRun, meta);
    persist(nextMeta, nextRun);
    set({ run: nextRun, meta: nextMeta });
  }

  return {
    meta: initialSave.meta,
    run: initialSave.currentRun,
    appPhase: initialSave.currentRun ? 'run' : 'hub',

    startNewRun: () => {
      const map = generateMap(rng, DEFAULT_MAP_CONFIG);
      const newRun = initRun(map, startingDeckCardIds, DEFAULT_RUN_CONFIG);
      const meta: SaveMetaV2 = {
        ...get().meta,
        stats: { ...get().meta.stats, runsStarted: get().meta.stats.runsStarted + 1 },
      };
      persist(meta, newRun);
      set({ run: newRun, meta, appPhase: 'run' });
    },

    enterNode: (nodeId) => withRun((run, content) => enterNode(run, nodeId, content, rng)),
    playCard: (instanceId) =>
      withRun((run, content) => playRunCombatCard(run, instanceId, content, rng)),
    endTurn: () => withRun((run, content) => endRunCombatTurn(run, content, rng)),
    acknowledgeCombat: () => withRun((run, content) => acknowledgeCombat(run, content, rng)),
    chooseShipSystem: (shipSystemId) =>
      withRun((run, content) => chooseShipSystemReward(run, shipSystemId, content, rng)),
    resolveEvent: (choiceIndex) =>
      withRun((run, content) => resolveEventChoice(run, choiceIndex, content)),
    buyItem: (index) => withRun((run, content) => buyShopItem(run, index, content)),
    leaveNode: () => withRun((run) => leaveNode(run)),

    returnToHub: () => {
      const { meta } = get();
      persist(meta, null);
      set({ run: null, appPhase: 'hub' });
    },
  };
});

export { getAvailableNodeIds };
