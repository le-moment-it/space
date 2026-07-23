import { create } from 'zustand';
import {
  cardDefinitions,
  defaultUnlockedCardIds,
  eliteRewardCardIds,
  runCardPool,
  startingDeckCardIds,
} from '../data/cards';
import { CREW_OFFER_CHANCE, crewDefinitions, recruitableCrewIds } from '../data/crew';
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
  dismissDialogue,
  endRunCombatTurn,
  enterNode,
  getAvailableNodeIds,
  initRun,
  leaveNode,
  playRunCombatCard,
  resolveCrewOffer,
  resolveEventChoice,
} from '../engine/run/resolve';
import { DEFAULT_RUN_CONFIG, type RunContent, type RunState } from '../engine/run/types';
import { createRng, type Rng } from '../engine/rng';
import { loadSave, persistSave } from '../engine/save/serialize';
import type { SaveDataV3, SaveMetaV3 } from '../engine/save/types';

const SAVE_DEFAULTS = {
  unlockedCardIds: defaultUnlockedCardIds,
  unlockedShipSystemIds: defaultUnlockedShipSystemIds,
};

function buildRunContent(meta: SaveMetaV3): RunContent {
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
    crewDefinitions,
    recruitableCrewIds,
    crewOfferChance: CREW_OFFER_CHANCE,
  };
}

/**
 * Detects run-ending / milestone-relevant transitions between two RunState snapshots
 * and updates lifetime stats + re-evaluates milestones accordingly. Works regardless
 * of which action caused the transition (combat, an event's hull effect, etc.).
 */
function applyBookkeeping(prevRun: RunState, nextRun: RunState, meta: SaveMetaV3): SaveMetaV3 {
  let stats = meta.stats;
  let crew = meta.crew;
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

  // Newly recruited crew: bump their lifetime meet counter (drives dialogue/codex).
  for (const crewId of nextRun.crewIds) {
    if (!prevRun.crewIds.includes(crewId)) {
      const current = crew[crewId]?.timesRecruited ?? 0;
      crew = { ...crew, [crewId]: { timesRecruited: current + 1 } };
      changed = true;
    }
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
  return evaluateMilestones({ ...meta, stats, crew }, milestoneDefinitions);
}

interface GameStore {
  meta: SaveMetaV3;
  run: RunState | null;
  appPhase: 'hub' | 'run';
  startNewRun: () => void;
  enterNode: (nodeId: string) => void;
  playCard: (instanceId: string) => void;
  endTurn: () => void;
  acknowledgeCombat: () => void;
  chooseShipSystem: (shipSystemId: string) => void;
  resolveEvent: (choiceIndex: number) => void;
  resolveCrewOffer: (accept: boolean) => void;
  dismissDialogue: () => void;
  buyItem: (index: number) => void;
  leaveNode: () => void;
  returnToHub: () => void;
}

export const useGameStore = create<GameStore>((set, get) => {
  let rng: Rng = createRng(Date.now());

  const initialSave: SaveDataV3 = loadSave(SAVE_DEFAULTS);

  function persist(meta: SaveMetaV3, run: RunState | null): void {
    persistSave({ version: 3, meta, currentRun: run });
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
      const meta: SaveMetaV3 = {
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
    resolveCrewOffer: (accept) => withRun((run, content) => resolveCrewOffer(run, accept, content)),
    dismissDialogue: () => withRun((run) => dismissDialogue(run)),
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
