/**
 * Combat status effects.
 *
 * One container per combatant instead of bespoke fields, so a new status is a table
 * entry rather than new plumbing through the whole turn lifecycle. Everything about
 * how a status behaves over time lives in STATUS_DEFINITIONS.
 */

export type StatusId =
  // On the enemy
  | 'weaken' // its attacks deal `amount` less
  | 'corrosion' // ticks `amount` damage at end of your turn, then decays by 1
  | 'breach' // takes BREACH_MULTIPLIER times damage
  // On the player, for the rest of the combat
  | 'calibration' // every attack deals `amount` more
  | 'deflector' // every shield gain is `amount` larger
  // On the player, spent on the next matching card
  | 'chargeDamage'
  | 'chargeShield'
  | 'chargeHeal';

/** `turns` is only meaningful for 'duration' statuses; the others ignore it. */
export interface StatusState {
  amount: number;
  turns?: number;
}

export type Statuses = Partial<Record<StatusId, StatusState>>;

type Decay =
  /** Fixed amount for `turns` turns, then gone. */
  | 'duration'
  /** Ticks damage, then the amount itself drops by 1 — long-tail damage. */
  | 'stackDown'
  /** Lasts the whole combat. */
  | 'none'
  /** Spent when the matching effect resolves. */
  | 'consumed';

interface StatusDefinition {
  decay: Decay;
  /** Deals its `amount` as damage to its bearer at end of the player's turn. */
  ticksDamage?: boolean;
}

export const STATUS_DEFINITIONS: Record<StatusId, StatusDefinition> = {
  weaken: { decay: 'duration' },
  corrosion: { decay: 'stackDown', ticksDamage: true },
  breach: { decay: 'duration' },
  calibration: { decay: 'none' },
  deflector: { decay: 'none' },
  chargeDamage: { decay: 'consumed' },
  chargeShield: { decay: 'consumed' },
  chargeHeal: { decay: 'consumed' },
};

/** How much extra damage a Breached target takes. */
export const BREACH_MULTIPLIER = 1.5;

/** What a Charge multiplies its effect by. */
export const CHARGE_MULTIPLIER = 2;

export function statusAmount(statuses: Statuses, id: StatusId): number {
  return statuses[id]?.amount ?? 0;
}

export function hasStatus(statuses: Statuses, id: StatusId): boolean {
  return statusAmount(statuses, id) > 0;
}

/**
 * Adds to a status rather than replacing it.
 *
 * Stacking is deliberate: the old bespoke weaken *overwrote*, so playing Weaken-2
 * after Weaken-6 downgraded the debuff — a trap with no way for the player to see it.
 * For 'duration' statuses the longer remaining duration wins.
 */
export function applyStatus(
  statuses: Statuses,
  id: StatusId,
  amount: number,
  turns?: number,
): Statuses {
  if (amount <= 0) return statuses;
  const current = statuses[id];
  const next: StatusState = { amount: (current?.amount ?? 0) + amount };
  if (turns !== undefined) next.turns = Math.max(current?.turns ?? 0, turns);
  return { ...statuses, [id]: next };
}

/** Spends one charge-style status, returning the multiplier to apply and the rest. */
export function consumeStatus(
  statuses: Statuses,
  id: StatusId,
): { multiplier: number; statuses: Statuses } {
  if (!hasStatus(statuses, id)) return { multiplier: 1, statuses };
  const remaining = statusAmount(statuses, id) - 1;
  const next = { ...statuses };
  if (remaining > 0) next[id] = { amount: remaining };
  else delete next[id];
  return { multiplier: CHARGE_MULTIPLIER, statuses: next };
}

/** Total damage a status tick deals to its bearer this turn (currently just Corrosion). */
export function tickDamage(statuses: Statuses): number {
  let total = 0;
  for (const id of Object.keys(statuses) as StatusId[]) {
    if (STATUS_DEFINITIONS[id].ticksDamage) total += statusAmount(statuses, id);
  }
  return total;
}

/**
 * Ages every status by one turn: durations count down, stackDown amounts erode,
 * and anything that runs out is dropped so `hasStatus` stays honest. 'none' and
 * 'consumed' statuses are untouched — they end when the combat or the card does.
 */
export function decayStatuses(statuses: Statuses): Statuses {
  const next: Statuses = {};
  for (const id of Object.keys(statuses) as StatusId[]) {
    const state = statuses[id];
    if (!state) continue;
    const { decay } = STATUS_DEFINITIONS[id];

    if (decay === 'duration') {
      const turns = (state.turns ?? 0) - 1;
      if (turns > 0) next[id] = { amount: state.amount, turns };
      continue;
    }
    if (decay === 'stackDown') {
      const amount = state.amount - 1;
      if (amount > 0) next[id] = { amount };
      continue;
    }
    next[id] = state;
  }
  return next;
}
