import { describe, expect, it } from 'vitest';
import { cardDefinitions, defaultLoadoutCardIds, defaultUnlockedCardIds } from '../../data/cards';
import { milestoneDefinitions } from '../../data/milestones';
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

  it('names a real card in every default and milestone unlock list', () => {
    const ids = [
      ...defaultUnlockedCardIds,
      ...milestoneDefinitions.flatMap((m) => m.unlocksCardIds),
    ];
    expect(ids.filter((id) => !cardDefinitions[id])).toEqual([]);
  });

  it('leaves no card above common unreachable', () => {
    const reachable = new Set([
      ...defaultUnlockedCardIds,
      ...milestoneDefinitions.flatMap((m) => m.unlocksCardIds),
    ]);
    const stranded = Object.values(cardDefinitions)
      .filter((c) => rarityOf(c) !== 'common' && c.type !== 'crew')
      .map((c) => c.id)
      .filter((id) => !reachable.has(id));
    expect(stranded).toEqual([]);
  });

  it('offers no card that is strictly worse than another at the same cost', () => {
    // Crew cards are exempt: they arrive bundled with the crew member you recruited,
    // so two of them are never alternatives the player picks between.
    const comparable = Object.values(cardDefinitions).filter((c) => c.type !== 'crew');

    const dominated: string[] = [];
    for (const a of comparable) {
      for (const b of comparable) {
        if (a.id !== b.id && strictlyBetter(a, b)) dominated.push(`${a.name} > ${b.name}`);
      }
    }
    expect(dominated).toEqual([]);
  });

  it('gates the strongest cards behind the latest milestones', () => {
    const legendaries = milestoneDefinitions.filter((m) =>
      m.unlocksCardIds.some((id) => rarityOf(cardDefinitions[id]) === 'legendary'),
    );
    expect(legendaries.length).toBeGreaterThan(0);
    // Milestones are listed in rough order of effort; Legendaries belong at the end.
    for (const milestone of legendaries) {
      expect(milestoneDefinitions.indexOf(milestone)).toBeGreaterThanOrEqual(
        milestoneDefinitions.length - 2,
      );
    }
  });
});
