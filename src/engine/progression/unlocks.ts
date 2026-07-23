import type { SaveMetaV2 } from '../save/types';
import type { MilestoneDefinition } from './types';

function mergeUnique(existing: readonly string[], additions: readonly string[]): string[] {
  const set = new Set(existing);
  for (const id of additions) set.add(id);
  return [...set];
}

/**
 * Checks each not-yet-completed milestone against current stats, marking any newly
 * completed ones and merging their unlocks into the pool. Pure and idempotent —
 * safe to call after every stats change; already-completed milestones are skipped.
 * Generic so later save-meta versions (which extend the v2 shape) pass through
 * with their extra fields intact.
 */
export function evaluateMilestones<T extends SaveMetaV2>(
  meta: T,
  milestones: readonly MilestoneDefinition[],
): T {
  let unlockedCardIds = meta.unlockedCardIds;
  let unlockedShipSystemIds = meta.unlockedShipSystemIds;
  let milestoneFlags = meta.milestones;
  let changed = false;

  for (const milestone of milestones) {
    if (milestoneFlags[milestone.id]) continue;
    if (!milestone.isComplete(meta.stats)) continue;

    changed = true;
    milestoneFlags = { ...milestoneFlags, [milestone.id]: true };
    unlockedCardIds = mergeUnique(unlockedCardIds, milestone.unlocksCardIds);
    unlockedShipSystemIds = mergeUnique(unlockedShipSystemIds, milestone.unlocksShipSystemIds);
  }

  if (!changed) return meta;
  return { ...meta, unlockedCardIds, unlockedShipSystemIds, milestones: milestoneFlags };
}
