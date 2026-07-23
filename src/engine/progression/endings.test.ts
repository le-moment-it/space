import { describe, expect, it } from 'vitest';
import { EMPTY_STATS, type SaveMetaV4 } from '../save/types';
import { evaluateEndings } from './endings';
import type { EndingDefinition } from './endings';

const endings: EndingDefinition[] = [
  {
    id: 'a',
    title: 'A',
    subtitle: '',
    scene: [],
    isUnlocked: (meta) => meta.stats.runsWon >= 1,
  },
  {
    id: 'b',
    title: 'B',
    subtitle: '',
    scene: [],
    isUnlocked: (meta) => meta.stats.runsWon >= 1 && (meta.crew.medic?.timesRecruited ?? 0) >= 1,
  },
];

function baseMeta(overrides: Partial<SaveMetaV4> = {}): SaveMetaV4 {
  return {
    unlockedCardIds: [],
    unlockedShipSystemIds: [],
    milestones: {},
    stats: { ...EMPTY_STATS },
    crew: {},
    endingsUnlocked: [],
    ...overrides,
  };
}

describe('evaluateEndings', () => {
  it('returns the same object when nothing newly unlocks', () => {
    const meta = baseMeta();
    expect(evaluateEndings(meta, endings)).toBe(meta);
  });

  it('unlocks an ending once its condition is met', () => {
    const meta = baseMeta({ stats: { ...EMPTY_STATS, runsWon: 1 } });
    const result = evaluateEndings(meta, endings);
    expect(result.endingsUnlocked).toEqual(['a']);
  });

  it('unlocks multiple endings in one pass when conditions are all met', () => {
    const meta = baseMeta({
      stats: { ...EMPTY_STATS, runsWon: 1 },
      crew: { medic: { timesRecruited: 3 } },
    });
    const result = evaluateEndings(meta, endings);
    expect(result.endingsUnlocked).toEqual(['a', 'b']);
  });

  it('does not duplicate an already-unlocked ending', () => {
    const meta = baseMeta({
      stats: { ...EMPTY_STATS, runsWon: 3 },
      endingsUnlocked: ['a'],
    });
    const result = evaluateEndings(meta, endings);
    expect(result).toBe(meta);
  });

  it('keeps the true ending locked until its extra condition is met', () => {
    const meta = baseMeta({ stats: { ...EMPTY_STATS, runsWon: 5 } }); // A yes, B no (no crew)
    const result = evaluateEndings(meta, endings);
    expect(result.endingsUnlocked).toEqual(['a']);
  });
});
