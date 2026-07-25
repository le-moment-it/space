import { describe, expect, it } from 'vitest';
import { cardDefinitions } from '../../data/cards';
import {
  MAX_UPGRADE_LEVEL,
  nextLevel,
  resolveCard,
  type CardDefinition,
  type UpgradeLevel,
} from './types';

const base: CardDefinition = {
  id: 'test-cannon',
  name: 'Test Cannon',
  type: 'weapon',
  cost: 1,
  description: '',
  effect: { kind: 'damage', amount: 6 },
};

describe('resolveCard', () => {
  it('returns the definition untouched at level 0', () => {
    expect(resolveCard(base, 0)).toBe(base);
  });

  it('steps damage by +2 per tier — the Kinetic Cannon 6/8/10 progression', () => {
    expect(resolveCard(base, 1).effect).toEqual({ kind: 'damage', amount: 8 });
    expect(resolveCard(base, 2).effect).toEqual({ kind: 'damage', amount: 10 });
  });

  it('steps the small-number effects by only +1 per tier', () => {
    const draw: CardDefinition = { ...base, effect: { kind: 'draw', amount: 1 } };
    expect(resolveCard(draw, 1).effect).toEqual({ kind: 'draw', amount: 2 });
    expect(resolveCard(draw, 2).effect).toEqual({ kind: 'draw', amount: 3 });

    const power: CardDefinition = { ...base, effect: { kind: 'power', amount: 2 } };
    expect(resolveCard(power, 2).effect).toEqual({ kind: 'power', amount: 4 });
  });

  it('keeps the untouched fields of a weaken effect (duration) intact', () => {
    const weaken: CardDefinition = {
      ...base,
      effect: { kind: 'weaken', amount: 3, duration: 2 },
    };
    expect(resolveCard(weaken, 1).effect).toEqual({ kind: 'weaken', amount: 4, duration: 2 });
  });

  it('never mutates the base definition', () => {
    const snapshot = structuredClone(base);
    resolveCard(base, 2);
    expect(base).toEqual(snapshot);
  });

  it('prefers an explicit per-card override over the default rule', () => {
    const custom: CardDefinition = {
      ...base,
      upgrades: [
        { effect: { kind: 'damage', amount: 9 } },
        { effect: { kind: 'damage', amount: 14 }, cost: 0 },
      ],
    };
    expect(resolveCard(custom, 1).effect).toEqual({ kind: 'damage', amount: 9 });
    expect(resolveCard(custom, 1).cost).toBe(1); // untouched by tier 1
    expect(resolveCard(custom, 2).effect).toEqual({ kind: 'damage', amount: 14 });
    expect(resolveCard(custom, 2).cost).toBe(0);
  });

  it('an override only replaces the fields it names — the rest still get the default step', () => {
    const cheaper: CardDefinition = { ...base, upgrades: [{ cost: 0 }, { cost: 0 }] };
    // cost is overridden, damage still steps +2 per tier
    expect(cheaper.upgrades && resolveCard(cheaper, 1)).toMatchObject({
      cost: 0,
      effect: { kind: 'damage', amount: 8 },
    });
  });

  it('never lets an override drive cost below zero', () => {
    const silly: CardDefinition = { ...base, upgrades: [{ cost: -5 }, { cost: -5 }] };
    expect(resolveCard(silly, 1).cost).toBe(0);
  });

  it('lets an override drop exhaust', () => {
    const oneShot: CardDefinition = {
      ...base,
      exhaust: true,
      upgrades: [{ exhaust: false }, { exhaust: false }],
    };
    expect(resolveCard(oneShot, 0).exhaust).toBe(true);
    expect(resolveCard(oneShot, 1).exhaust).toBe(false);
  });

  it('produces a valid upgrade for every shipped card at both tiers', () => {
    for (const def of Object.values(cardDefinitions)) {
      for (const level of [1, 2] as UpgradeLevel[]) {
        const up = resolveCard(def, level);
        expect(up.effect.kind).toBe(def.effect.kind);
        expect(up.effect.amount).toBeGreaterThan(def.effect.amount);
        expect(up.cost).toBeGreaterThanOrEqual(0);
      }
    }
  });
});

describe('nextLevel', () => {
  it('steps up one tier and stops at the cap', () => {
    expect(nextLevel(0)).toBe(1);
    expect(nextLevel(1)).toBe(2);
    expect(nextLevel(MAX_UPGRADE_LEVEL)).toBe(MAX_UPGRADE_LEVEL);
  });
});
