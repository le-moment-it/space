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
  effect: { kind: 'damage', amount: 6 },
  upgrades: [
    { effect: { kind: 'damage', amount: 9 } },
    { effect: { kind: 'damage', amount: 14 }, cost: 0 },
  ],
};

describe('resolveCard', () => {
  it('returns the definition untouched at level 0', () => {
    expect(resolveCard(base, 0)).toBe(base);
  });

  it('resolves to exactly the tier the card declares', () => {
    expect(resolveCard(base, 1).effect).toEqual({ kind: 'damage', amount: 9 });
    expect(resolveCard(base, 2).effect).toEqual({ kind: 'damage', amount: 14 });
  });

  it('leaves cost, exhaust and extra effects at the base when a tier does not name them', () => {
    const support: CardDefinition = {
      ...base,
      exhaust: true,
      extraEffects: [{ kind: 'heal', amount: 4 }],
    };
    // Tier 1 names only `effect`, so everything else is inherited...
    expect(resolveCard(support, 1)).toMatchObject({
      cost: 1,
      exhaust: true,
      extraEffects: [{ kind: 'heal', amount: 4 }],
    });
    // ...while tier 2 names a cost, and only that changes.
    expect(resolveCard(support, 2)).toMatchObject({
      cost: 0,
      exhaust: true,
      extraEffects: [{ kind: 'heal', amount: 4 }],
    });
  });

  it('lets a tier grow an extra effect when it declares one', () => {
    const grower: CardDefinition = {
      ...base,
      extraEffects: [{ kind: 'heal', amount: 4 }],
      upgrades: [
        { effect: { kind: 'damage', amount: 8 }, extraEffects: [{ kind: 'heal', amount: 6 }] },
        { effect: { kind: 'damage', amount: 10 }, extraEffects: [{ kind: 'heal', amount: 8 }] },
      ],
    };
    expect(resolveCard(grower, 2).extraEffects).toEqual([{ kind: 'heal', amount: 8 }]);
  });

  it('carries the non-amount fields a tier declares, like weaken duration', () => {
    const weaken: CardDefinition = {
      ...base,
      effect: { kind: 'weaken', amount: 3, duration: 2 },
      upgrades: [
        { effect: { kind: 'weaken', amount: 4, duration: 2 } },
        { effect: { kind: 'weaken', amount: 4, duration: 4 } },
      ],
    };
    expect(resolveCard(weaken, 1).effect).toEqual({ kind: 'weaken', amount: 4, duration: 2 });
    // A tier is free to buy duration instead of amount — the formula could not.
    expect(resolveCard(weaken, 2).effect).toEqual({ kind: 'weaken', amount: 4, duration: 4 });
  });

  it('never mutates the base definition', () => {
    const snapshot = structuredClone(base);
    resolveCard(base, 2);
    expect(base).toEqual(snapshot);
  });

  it('never lets a tier drive cost below zero', () => {
    const silly: CardDefinition = {
      ...base,
      upgrades: [
        { effect: base.effect, cost: -5 },
        { effect: base.effect, cost: -5 },
      ],
    };
    expect(resolveCard(silly, 1).cost).toBe(0);
  });

  it('lets a tier drop exhaust', () => {
    const oneShot: CardDefinition = {
      ...base,
      exhaust: true,
      upgrades: [
        { effect: base.effect, exhaust: false },
        { effect: base.effect, exhaust: false },
      ],
    };
    expect(resolveCard(oneShot, 0).exhaust).toBe(true);
    expect(resolveCard(oneShot, 1).exhaust).toBe(false);
  });

  it('produces a valid upgrade for every shipped card at both tiers', () => {
    for (const def of Object.values(cardDefinitions)) {
      for (const level of [1, 2] as UpgradeLevel[]) {
        const up = resolveCard(def, level);
        expect(up.effect.kind, def.id).toBe(def.effect.kind);
        expect(up.effect.amount, def.id).toBeGreaterThan(def.effect.amount);
        expect(up.cost, def.id).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('makes each tier strictly better than the one before it', () => {
    for (const def of Object.values(cardDefinitions)) {
      const [t1, t2] = [resolveCard(def, 1), resolveCard(def, 2)];
      expect(t2.effect.amount, def.id).toBeGreaterThan(t1.effect.amount);
    }
  });

  /**
   * The numbers now live in the data, so a fat-fingered tier is a balance bug rather
   * than a compile error. These four cover the shapes the old formula got wrong:
   * a plain weapon, a multi-hit (the step used to land once per hit), a card whose
   * extras must not move, and one that exhausts.
   */
  it.each([
    ['flak-burst', [4, 6, 8], 1],
    ['siege-cannon', [20, 22, 24], 3],
    ['needle-volley', [3, 5, 7], 1],
    ['failsafe-screen', [10, 12, 14], 0],
  ] as const)('%s reads %s across its three tiers', (id, amounts, cost) => {
    const def = cardDefinitions[id];
    amounts.forEach((amount, level) => {
      const card = resolveCard(def, level as UpgradeLevel);
      expect(card.effect.amount).toBe(amount);
      expect(card.cost).toBe(cost);
    });
  });

  it('keeps a multi-hit card hitting the same number of times as it upgrades', () => {
    const volley = cardDefinitions['needle-volley'];
    for (const level of [0, 1, 2] as UpgradeLevel[]) {
      const effect = resolveCard(volley, level).effect;
      expect(effect.kind === 'damage' && effect.times).toBe(3);
    }
  });

  it('leaves Master Gunner’s draw alone while its calibration grows', () => {
    const gunner = cardDefinitions['master-gunner'];
    expect(resolveCard(gunner, 2).effect).toEqual({ kind: 'calibration', amount: 6 });
    expect(resolveCard(gunner, 2).extraEffects).toEqual([{ kind: 'draw', amount: 1 }]);
  });
});

describe('nextLevel', () => {
  it('steps up one tier and stops at the cap', () => {
    expect(nextLevel(0)).toBe(1);
    expect(nextLevel(1)).toBe(2);
    expect(nextLevel(MAX_UPGRADE_LEVEL)).toBe(MAX_UPGRADE_LEVEL);
  });
});
