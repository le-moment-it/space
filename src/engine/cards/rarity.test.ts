import { describe, expect, it } from 'vitest';
import {
  cardDefinitions,
  defaultLoadoutCardIds,
  defaultUnlockedCardIds,
  eliteRewardCardIds,
} from '../../data/cards';
import { LEVEL_UNLOCKS, MAX_LEVEL, unlocksUpTo } from '../progression/level';
import { rarityWeightsFor } from './rarityOdds';
import { CARD_RARITIES, rarityOf, type CardDefinition } from './types';

describe('card rarity', () => {
  it('defaults to common when a card declares no rarity', () => {
    expect(rarityOf({})).toBe('common');
    expect(rarityOf({ rarity: undefined })).toBe('common');
  });

  it('returns the declared rarity when present', () => {
    for (const rarity of CARD_RARITIES) {
      expect(rarityOf({ rarity })).toBe(rarity);
    }
  });

  it('resolves every shipped card to a known rarity', () => {
    for (const card of Object.values(cardDefinitions)) {
      expect(CARD_RARITIES).toContain(rarityOf(card));
    }
  });

  it('treats cards that declare no rarity as common', () => {
    const undeclared = Object.values(cardDefinitions).filter((c) => c.rarity === undefined);
    expect(undeclared.length).toBeGreaterThan(0);
    for (const card of undeclared) {
      expect(rarityOf(card)).toBe('common');
    }
  });
});

/** Total output per effect kind, so two cards can be compared line by line. */
function payload(card: CardDefinition): Record<string, number> {
  const out: Record<string, number> = {};
  const add = (key: string, n: number) => (out[key] = (out[key] ?? 0) + n);
  for (const e of [card.effect, ...(card.extraEffects ?? [])]) {
    switch (e.kind) {
      case 'damage':
        add('damage', e.amount * (e.times ?? 1));
        if ((e.times ?? 1) > 1) add('hits', e.times ?? 1);
        break;
      case 'charge':
        add(`charge:${e.target}`, e.amount);
        break;
      case 'weaken':
      case 'breach':
        add(e.kind, e.amount);
        add(`${e.kind}:turns`, 'duration' in e ? e.duration : e.amount);
        break;
      default:
        add(e.kind, e.amount);
    }
  }
  return out;
}

/**
 * True when `a` costs the same, does everything `b` does at least as well, and beats
 * it somewhere — i.e. `b` is a card no one would ever pick.
 *
 * Rarity is part of the comparison, not a loophole: a Legendary is *supposed* to beat
 * a Common at equal cost, and only same-rarity pairs are a balance mistake. Multi-hit
 * is treated as a difference rather than an upgrade, since splitting a total across
 * several hits is worse against enemy shields.
 */
function strictlyBetter(a: CardDefinition, b: CardDefinition): boolean {
  if (a.cost !== b.cost || a.type !== b.type || rarityOf(a) !== rarityOf(b)) return false;
  if (a.exhaust && !b.exhaust) return false;

  const pa = payload(a);
  const pb = payload(b);
  if (Object.keys(pb).some((k) => !(k in pa))) return false;
  if ((pa.hits ?? 0) !== (pb.hits ?? 0)) return false;

  let better = Object.keys(pa).some((k) => !(k in pb)) || (!a.exhaust && !!b.exhaust);
  for (const [k, v] of Object.entries(pb)) {
    if (pa[k] < v) return false;
    if (pa[k] > v) better = true;
  }
  return better;
}

/**
 * A fresh profile builds its first deck out of the default-unlocked list, so anything
 * above Common in there is handed to a brand-new player for free — which is exactly
 * how every Rare, Epic and Legendary once ended up available at game start.
 */
describe('unlock curve', () => {
  it('unlocks only common cards by default', () => {
    const notCommon = defaultUnlockedCardIds.filter(
      (id) => rarityOf(cardDefinitions[id]) !== 'common',
    );
    expect(notCommon).toEqual([]);
  });

  it('starts every player on a loadout they have actually unlocked', () => {
    const unlocked = new Set(defaultUnlockedCardIds);
    expect(defaultLoadoutCardIds.filter((id) => !unlocked.has(id))).toEqual([]);
  });

  it('names a real card in every default and level unlock list', () => {
    const ids = [...defaultUnlockedCardIds, ...LEVEL_UNLOCKS.flatMap((u) => u.cardIds)];
    expect(ids.filter((id) => !cardDefinitions[id])).toEqual([]);
  });

  it('makes every card buildable by the level cap — none is stranded', () => {
    const reachable = new Set([...defaultUnlockedCardIds, ...unlocksUpTo(MAX_LEVEL).cardIds]);
    const stranded = Object.keys(cardDefinitions).filter((id) => !reachable.has(id));
    expect(stranded).toEqual([]);
  });

  it('offers no card that is strictly worse than another at the same cost', () => {
    const comparable = Object.values(cardDefinitions);

    const dominated: string[] = [];
    for (const a of comparable) {
      for (const b of comparable) {
        if (a.id !== b.id && strictlyBetter(a, b)) dominated.push(`${a.name} > ${b.name}`);
      }
    }
    expect(dominated).toEqual([]);
  });

  /**
   * The elite pool was once entirely Common, which silently renormalised the elite
   * odds to 100% Common and made an elite reward *worse* than a normal fight's — a
   * normal win draws from the whole unlocked pool and can roll a Legendary.
   */
  it('stocks the elite reward pool with every rarity its odds promise', () => {
    const promised = CARD_RARITIES.filter((r) => rarityWeightsFor(MAX_LEVEL, 'elite')[r] > 0);
    const stocked = new Set(eliteRewardCardIds.map((id) => rarityOf(cardDefinitions[id])));
    expect(promised.filter((r) => !stocked.has(r))).toEqual([]);
  });

  it('gates the strongest cards behind the highest levels', () => {
    for (const unlock of LEVEL_UNLOCKS) {
      const hasLegendary = unlock.cardIds.some(
        (id) => rarityOf(cardDefinitions[id]) === 'legendary',
      );
      if (hasLegendary) expect(unlock.level).toBeGreaterThanOrEqual(MAX_LEVEL - 2);
    }
    // And they are reachable at all.
    const buildable = new Set(unlocksUpTo(MAX_LEVEL).cardIds);
    const legendaries = Object.values(cardDefinitions).filter((c) => rarityOf(c) === 'legendary');
    expect(legendaries.every((c) => buildable.has(c.id))).toBe(true);
  });
});
