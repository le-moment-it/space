import { describe, expect, it } from 'vitest';
import {
  LEVEL_UNLOCKS,
  MAX_LEVEL,
  levelFor,
  levelProgress,
  nextUnlock,
  unlocksUpTo,
  XP_AWARDS,
  xpForLevel,
  xpToAdvance,
} from './level';

describe('levelFor', () => {
  it('starts at level 1 with no XP', () => {
    expect(levelFor(0)).toBe(1);
  });

  it('is level 1 until the first threshold, then 2 exactly on it', () => {
    expect(levelFor(xpForLevel(2) - 1)).toBe(1);
    expect(levelFor(xpForLevel(2))).toBe(2);
  });

  it('lands on the right level at every threshold', () => {
    for (let level = 1; level <= MAX_LEVEL; level++) {
      expect(levelFor(xpForLevel(level))).toBe(level);
      if (level > 1) expect(levelFor(xpForLevel(level) - 1)).toBe(level - 1);
    }
  });

  it('caps at MAX_LEVEL however much XP is earned', () => {
    expect(levelFor(xpForLevel(MAX_LEVEL))).toBe(MAX_LEVEL);
    expect(levelFor(xpForLevel(MAX_LEVEL) * 100)).toBe(MAX_LEVEL);
  });

  it('never returns below 1, whatever it is handed', () => {
    expect(levelFor(-500)).toBe(1);
    expect(levelFor(Number.NaN)).toBe(1);
  });
});

describe('xpForLevel', () => {
  it('is the running total of the per-level costs', () => {
    let total = 0;
    for (let level = 1; level < MAX_LEVEL; level++) {
      expect(xpForLevel(level)).toBe(total);
      total += xpToAdvance(level);
    }
    expect(xpForLevel(MAX_LEVEL)).toBe(total);
  });

  it('rises with every level', () => {
    for (let level = 2; level <= MAX_LEVEL; level++) {
      expect(xpForLevel(level)).toBeGreaterThan(xpForLevel(level - 1));
    }
  });
});

describe('levelProgress', () => {
  it('reports the distance into the current level', () => {
    const xp = xpForLevel(4) + 25;
    const progress = levelProgress(xp);
    expect(progress.level).toBe(4);
    expect(progress.into).toBe(25);
    expect(progress.span).toBe(xpToAdvance(4));
    expect(progress.atMax).toBe(false);
  });

  it('never reports more progress than the level costs', () => {
    for (let level = 1; level < MAX_LEVEL; level++) {
      const justBefore = levelProgress(xpForLevel(level + 1) - 1);
      expect(justBefore.into).toBeLessThan(justBefore.span);
    }
  });

  it('flags the cap instead of an unfillable bar', () => {
    expect(levelProgress(xpForLevel(MAX_LEVEL)).atMax).toBe(true);
    expect(levelProgress(xpForLevel(MAX_LEVEL) * 2).atMax).toBe(true);
  });
});

describe('XP awards', () => {
  it('pays more for harder encounters', () => {
    expect(XP_AWARDS.elite).toBeGreaterThan(XP_AWARDS.combat);
    expect(XP_AWARDS.boss).toBeGreaterThan(XP_AWARDS.elite);
  });
});

describe('level unlocks', () => {
  it('is ordered and never unlocks at level 1, which is the starting deck', () => {
    let previous = 1;
    for (const unlock of LEVEL_UNLOCKS) {
      expect(unlock.level).toBeGreaterThan(previous);
      previous = unlock.level;
    }
    expect(LEVEL_UNLOCKS[LEVEL_UNLOCKS.length - 1].level).toBeLessThanOrEqual(MAX_LEVEL);
  });

  it('never grants the same id twice', () => {
    const cards = LEVEL_UNLOCKS.flatMap((u) => u.cardIds);
    const systems = LEVEL_UNLOCKS.flatMap((u) => u.shipSystemIds);
    expect(new Set(cards).size).toBe(cards.length);
    expect(new Set(systems).size).toBe(systems.length);
  });

  it('accumulates as the level rises and never shrinks', () => {
    let previousCards = 0;
    for (let level = 1; level <= MAX_LEVEL; level++) {
      const { cardIds } = unlocksUpTo(level);
      expect(cardIds.length).toBeGreaterThanOrEqual(previousCards);
      previousCards = cardIds.length;
    }
  });

  it('has everything unlocked at the cap', () => {
    const all = unlocksUpTo(MAX_LEVEL);
    expect(all.cardIds).toHaveLength(LEVEL_UNLOCKS.flatMap((u) => u.cardIds).length);
    expect(nextUnlock(MAX_LEVEL)).toBeUndefined();
  });

  it('points at the next thing to look forward to', () => {
    expect(nextUnlock(1)?.level).toBe(LEVEL_UNLOCKS[0].level);
    expect(nextUnlock(LEVEL_UNLOCKS[0].level)?.level).toBe(LEVEL_UNLOCKS[1].level);
  });
});
