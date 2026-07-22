import { create } from 'zustand';
import { cardDefinitions, startingDeckCardIds } from '../data/cards';
import { scavengerDrone } from '../data/enemies';
import { createRng, type Rng } from '../engine/rng';
import { endPlayerTurn, initCombat, playCard } from '../engine/combat/resolve';
import type { CombatState } from '../engine/combat/types';

interface CombatStore {
  combat: CombatState;
  playCard: (instanceId: string) => void;
  endTurn: () => void;
  restart: () => void;
}

function freshCombat(rng: Rng): CombatState {
  return initCombat({ cardDefinitions, startingDeckCardIds, enemy: scavengerDrone, rng });
}

export const useCombatStore = create<CombatStore>((set) => {
  let rng = createRng(Date.now());

  return {
    combat: freshCombat(rng),
    playCard: (instanceId) =>
      set((s) => ({ combat: playCard(s.combat, instanceId, cardDefinitions) })),
    endTurn: () => set((s) => ({ combat: endPlayerTurn(s.combat, rng) })),
    restart: () => {
      rng = createRng(Date.now());
      set({ combat: freshCombat(rng) });
    },
  };
});
