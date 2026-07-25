import { create } from 'zustand';
import {
  cardDefinitions,
  defaultLoadoutCardIds,
  defaultUnlockedCardIds,
  eliteRewardCardIds,
  runCardPool,
} from '../data/cards';
import { CREW_OFFER_CHANCE, crewDefinitions, recruitableCrewIds } from '../data/crew';
import { endingDefinitions } from '../data/endings';
import { bossEnemyByAct, combatEnemiesByAct, eliteEnemiesByAct } from '../data/enemies';
import { eventDefinitions } from '../data/events';
import { milestoneDefinitions } from '../data/milestones';
import { defaultUnlockedShipSystemIds, shipSystemDefinitions } from '../data/shipSystems';
import { generateMap } from '../engine/map/generate';
import { DEFAULT_MAP_CONFIG } from '../engine/map/types';
import { evaluateEndings } from '../engine/progression/endings';
import { evaluateMilestones } from '../engine/progression/unlocks';
import {
  acknowledgeCombat,
  buyShopItem,
  chooseCardReward,
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
import type { DeckCard } from '../engine/cards/types';
import { createRng, type Rng } from '../engine/rng';
import { loadSave, persistSave } from '../engine/save/serialize';
import { LOADOUT_SIZE, type SaveDataV6, type SaveMetaV6 } from '../engine/save/types';
import { loadLanguage, persistLanguage, type Language } from '../i18n/types';

const SAVE_DEFAULTS = {
  unlockedCardIds: defaultUnlockedCardIds,
  unlockedShipSystemIds: defaultUnlockedShipSystemIds,
  loadoutCardIds: defaultLoadoutCardIds,
};

/**
 * The deck a run actually starts with: the player's saved loadout if it's a valid
 * full deck of unlocked cards, otherwise the default (guards against a loadout left
 * incomplete, or referencing a card that no longer exists / isn't unlocked).
 */
function resolveLoadout(meta: SaveMetaV6): DeckCard[] {
  const unlocked = new Set(meta.unlockedCardIds);
  const allValid =
    meta.loadoutCards.length === LOADOUT_SIZE &&
    meta.loadoutCards.every((slot) => cardDefinitions[slot.cardId] && unlocked.has(slot.cardId));

  if (allValid) {
    // Tag each copy with the slot it was fielded from, so an act-end reward knows
    // which loadout slot to upgrade permanently.
    return meta.loadoutCards.map((slot, i) => ({
      cardId: slot.cardId,
      level: slot.level,
      loadoutIndex: i,
    }));
  }

  // Fallback deck: these copies are NOT the player's slots, so they carry no
  // loadoutIndex — a permanent upgrade must never write into a slot they never fielded.
  return defaultLoadoutCardIds.map((cardId) => ({ cardId, level: 0 as const }));
}

function buildRunContent(meta: SaveMetaV6): RunContent {
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
function applyBookkeeping(prevRun: RunState, nextRun: RunState, meta: SaveMetaV6): SaveMetaV6 {
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
  const withMilestones = evaluateMilestones({ ...meta, stats, crew }, milestoneDefinitions);
  return evaluateEndings(withMilestones, endingDefinitions);
}

interface GameStore {
  meta: SaveMetaV6;
  run: RunState | null;
  appPhase: 'hub' | 'run';
  /** UI language. App-level preference, persisted to localStorage separately from the save. */
  language: Language;
  setLanguage: (language: Language) => void;
  /** Endings unlocked this session but not yet shown — queues the ending scene(s). */
  pendingEndingIds: string[];
  startNewRun: () => void;
  enterNode: (nodeId: string) => void;
  playCard: (instanceId: string) => void;
  endTurn: () => void;
  acknowledgeCombat: () => void;
  /** Pick a card (or null to skip) from the post-combat card reward. */
  chooseCardReward: (cardId: string | null) => void;
  chooseShipSystem: (shipSystemId: string) => void;
  resolveEvent: (choiceIndex: number) => void;
  resolveCrewOffer: (accept: boolean) => void;
  dismissDialogue: () => void;
  buyItem: (index: number) => void;
  leaveNode: () => void;
  returnToHub: () => void;
  dismissEnding: () => void;
  viewEnding: (endingId: string) => void;
  /** Add one copy of an unlocked card to the loadout, if there's room. */
  addLoadoutCard: (cardId: string) => void;
  /** Remove the loadout card at the given index. */
  removeLoadoutCard: (index: number) => void;
  /** Reset the loadout to the default starting deck. */
  resetLoadout: () => void;
}

/**
 * Back-fills fields added to an in-flight combat after a save was written. A player
 * mid-fight when a new build ships would otherwise load a CombatState missing the
 * newer piles — cheaper and safer than a save version bump for an additive field.
 */
function normalizeRun(run: RunState | null): RunState | null {
  if (!run?.activeCombat || run.activeCombat.exhaustPile) return run;
  return { ...run, activeCombat: { ...run.activeCombat, exhaustPile: [] } };
}

export const useGameStore = create<GameStore>((set, get) => {
  let rng: Rng = createRng(Date.now());

  const loaded: SaveDataV6 = loadSave(SAVE_DEFAULTS);
  const initialSave: SaveDataV6 = { ...loaded, currentRun: normalizeRun(loaded.currentRun) };

  function persist(meta: SaveMetaV6, run: RunState | null): void {
    persistSave({ version: 6, meta, currentRun: run });
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
    const newEndings = nextMeta.endingsUnlocked.filter((id) => !meta.endingsUnlocked.includes(id));
    persist(nextMeta, nextRun);
    set((s) => ({
      run: nextRun,
      meta: nextMeta,
      pendingEndingIds:
        newEndings.length > 0 ? [...s.pendingEndingIds, ...newEndings] : s.pendingEndingIds,
    }));
  }

  return {
    meta: initialSave.meta,
    run: initialSave.currentRun,
    appPhase: initialSave.currentRun ? 'run' : 'hub',
    language: loadLanguage(),
    pendingEndingIds: [],

    setLanguage: (language) => {
      persistLanguage(language);
      set({ language });
    },

    startNewRun: () => {
      const map = generateMap(rng, DEFAULT_MAP_CONFIG);
      const newRun = initRun(map, resolveLoadout(get().meta), DEFAULT_RUN_CONFIG);
      const meta: SaveMetaV6 = {
        ...get().meta,
        stats: { ...get().meta.stats, runsStarted: get().meta.stats.runsStarted + 1 },
      };
      persist(meta, newRun);
      set({ run: newRun, meta, appPhase: 'run' });
    },

    enterNode: (nodeId) => withRun((run, content) => enterNode(run, nodeId, content, rng)),
    playCard: (instanceId) =>
      withRun((run, content) => playRunCombatCard(run, instanceId, content, rng)),
    endTurn: () => withRun((run) => endRunCombatTurn(run, rng)),
    acknowledgeCombat: () => withRun((run, content) => acknowledgeCombat(run, content, rng)),
    chooseCardReward: (cardId) => withRun((run, content) => chooseCardReward(run, cardId, content)),
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

    dismissEnding: () => set((s) => ({ pendingEndingIds: s.pendingEndingIds.slice(1) })),
    viewEnding: (endingId) => set((s) => ({ pendingEndingIds: [...s.pendingEndingIds, endingId] })),

    addLoadoutCard: (cardId) => {
      const { meta, run } = get();
      if (meta.loadoutCards.length >= LOADOUT_SIZE) return;
      if (!cardDefinitions[cardId] || !meta.unlockedCardIds.includes(cardId)) return;
      const nextMeta = {
        ...meta,
        loadoutCards: [...meta.loadoutCards, { cardId, level: 0 as const }],
      };
      persist(nextMeta, run);
      set({ meta: nextMeta });
    },

    removeLoadoutCard: (index) => {
      const { meta, run } = get();
      const nextMeta = {
        ...meta,
        loadoutCards: meta.loadoutCards.filter((_, i) => i !== index),
      };
      persist(nextMeta, run);
      set({ meta: nextMeta });
    },

    resetLoadout: () => {
      const { meta, run } = get();
      const nextMeta = {
        ...meta,
        loadoutCards: defaultLoadoutCardIds.map((cardId) => ({ cardId, level: 0 as const })),
      };
      persist(nextMeta, run);
      set({ meta: nextMeta });
    },
  };
});

export { getAvailableNodeIds };
