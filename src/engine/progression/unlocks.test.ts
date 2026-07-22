import { describe, expect, it } from 'vitest';
import { EMPTY_STATS, type SaveMetaV1 } from '../save/types';
import { evaluateMilestones } from './unlocks';
import type { MilestoneDefinition } from './types';

const milestones: MilestoneDefinition[] = [
  {
    id: 'win-a-run',
    description: 'Win a run',
    isComplete: (stats) => stats.runsWon >= 1,
    unlocksCardIds: ['card-a', 'card-b'],
    unlocksShipSystemIds: ['system-a'],
  },
  {
    id: 'defeat-5-elites',
    description: 'Defeat 5 elites',
    isComplete: (stats) => stats.elitesDefeated >= 5,
    unlocksCardIds: ['card-c'],
    unlocksShipSystemIds: [],
  },
];

function baseMeta(overrides: Partial<SaveMetaV1> = {}): SaveMetaV1 {
  return {
    unlockedCardIds: ['starter'],
    unlockedShipSystemIds: ['starter-system'],
    milestones: {},
    stats: { ...EMPTY_STATS },
    ...overrides,
  };
}

describe('evaluateMilestones', () => {
  it('returns the same object when no milestone newly completes', () => {
    const meta = baseMeta();
    expect(evaluateMilestones(meta, milestones)).toBe(meta);
  });

  it('unlocks content and flags the milestone once its condition is met', () => {
    const meta = baseMeta({ stats: { ...EMPTY_STATS, runsWon: 1 } });
    const result = evaluateMilestones(meta, milestones);

    expect(result.milestones['win-a-run']).toBe(true);
    expect(result.unlockedCardIds).toEqual(expect.arrayContaining(['starter', 'card-a', 'card-b']));
    expect(result.unlockedShipSystemIds).toEqual(
      expect.arrayContaining(['starter-system', 'system-a']),
    );
  });

  it('does not re-unlock or duplicate an already-completed milestone', () => {
    const meta = baseMeta({
      stats: { ...EMPTY_STATS, runsWon: 5 }, // still just >=1
      milestones: { 'win-a-run': true },
      unlockedCardIds: ['starter', 'card-a', 'card-b'],
      unlockedShipSystemIds: ['starter-system', 'system-a'],
    });
    const result = evaluateMilestones(meta, milestones);
    expect(result).toBe(meta); // nothing changed, same reference
  });

  it('can complete multiple milestones in one evaluation', () => {
    const meta = baseMeta({ stats: { ...EMPTY_STATS, runsWon: 1, elitesDefeated: 5 } });
    const result = evaluateMilestones(meta, milestones);
    expect(result.milestones['win-a-run']).toBe(true);
    expect(result.milestones['defeat-5-elites']).toBe(true);
    expect(result.unlockedCardIds).toEqual(
      expect.arrayContaining(['starter', 'card-a', 'card-b', 'card-c']),
    );
  });

  it('never unlocks duplicate ids', () => {
    const meta = baseMeta({
      unlockedCardIds: ['starter', 'card-a'],
      stats: { ...EMPTY_STATS, runsWon: 1 },
    });
    const result = evaluateMilestones(meta, milestones);
    const occurrences = result.unlockedCardIds.filter((id) => id === 'card-a').length;
    expect(occurrences).toBe(1);
  });
});
