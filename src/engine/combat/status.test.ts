import { describe, expect, it } from 'vitest';
import {
  applyStatus,
  consumeStatus,
  decayStatuses,
  hasStatus,
  statusAmount,
  tickDamage,
  type Statuses,
} from './status';

describe('applyStatus', () => {
  it('adds to an existing status instead of replacing it', () => {
    // The old bespoke weaken OVERWROTE: playing Weaken-2 after Weaken-6 downgraded
    // the debuff with no way for the player to see it. Stacking is the fix.
    let s: Statuses = applyStatus({}, 'weaken', 6, 2);
    s = applyStatus(s, 'weaken', 2, 1);
    expect(statusAmount(s, 'weaken')).toBe(8);
  });

  it('keeps the longer duration when two applications differ', () => {
    let s: Statuses = applyStatus({}, 'weaken', 3, 1);
    s = applyStatus(s, 'weaken', 3, 4);
    expect(s.weaken).toEqual({ amount: 6, turns: 4 });
  });

  it('ignores a non-positive amount', () => {
    const s = applyStatus({}, 'corrosion', 0);
    expect(hasStatus(s, 'corrosion')).toBe(false);
  });
});

describe('decayStatuses', () => {
  it('counts a duration status down and drops it at zero', () => {
    let s: Statuses = applyStatus({}, 'weaken', 3, 2);
    s = decayStatuses(s);
    expect(s.weaken).toEqual({ amount: 3, turns: 1 });
    s = decayStatuses(s);
    expect(hasStatus(s, 'weaken')).toBe(false);
  });

  it('erodes a stackDown status by one and drops it at zero', () => {
    let s: Statuses = applyStatus({}, 'corrosion', 2);
    s = decayStatuses(s);
    expect(statusAmount(s, 'corrosion')).toBe(1);
    s = decayStatuses(s);
    expect(hasStatus(s, 'corrosion')).toBe(false);
  });

  it('leaves whole-combat and charge statuses alone', () => {
    let s: Statuses = applyStatus({}, 'calibration', 2);
    s = applyStatus(s, 'chargeDamage', 1);
    const after = decayStatuses(decayStatuses(s));
    expect(statusAmount(after, 'calibration')).toBe(2);
    expect(statusAmount(after, 'chargeDamage')).toBe(1);
  });
});

describe('tickDamage', () => {
  it('totals only the statuses that deal damage over time', () => {
    let s: Statuses = applyStatus({}, 'corrosion', 5);
    s = applyStatus(s, 'weaken', 3, 2); // does not tick
    expect(tickDamage(s)).toBe(5);
  });

  it('is zero with no damaging statuses', () => {
    expect(tickDamage(applyStatus({}, 'weaken', 3, 2))).toBe(0);
  });
});

describe('consumeStatus', () => {
  it('spends one charge and reports the multiplier', () => {
    const s = applyStatus({}, 'chargeDamage', 1);
    const { multiplier, statuses } = consumeStatus(s, 'chargeDamage');
    expect(multiplier).toBe(2);
    expect(hasStatus(statuses, 'chargeDamage')).toBe(false);
  });

  it('leaves remaining charges in place', () => {
    const s = applyStatus({}, 'chargeDamage', 2);
    const { statuses } = consumeStatus(s, 'chargeDamage');
    expect(statusAmount(statuses, 'chargeDamage')).toBe(1);
  });

  it('is a no-op with no charge, multiplying by 1', () => {
    const { multiplier, statuses } = consumeStatus({}, 'chargeDamage');
    expect(multiplier).toBe(1);
    expect(statuses).toEqual({});
  });
});
