import type { SaveMetaV4 } from '../save/types';

export interface EndingDefinition {
  id: string;
  title: string;
  /** Short label shown in the Hub codex once unlocked. */
  subtitle: string;
  /** The scene, one paragraph per entry, shown at the Hub when newly unlocked. */
  scene: string[];
  /** True once the player has earned this ending. Pure function of lifetime save meta. */
  isUnlocked: (meta: SaveMetaV4) => boolean;
}

/**
 * Marks any newly-earned endings in meta.endingsUnlocked. Pure and idempotent —
 * safe to call after every stats/crew change; already-unlocked endings are skipped.
 * Generic so it composes with the other meta evaluators.
 */
export function evaluateEndings<T extends SaveMetaV4>(
  meta: T,
  endings: readonly EndingDefinition[],
): T {
  let unlocked = meta.endingsUnlocked;
  let changed = false;

  for (const ending of endings) {
    if (unlocked.includes(ending.id)) continue;
    if (!ending.isUnlocked(meta)) continue;
    unlocked = [...unlocked, ending.id];
    changed = true;
  }

  if (!changed) return meta;
  return { ...meta, endingsUnlocked: unlocked };
}
