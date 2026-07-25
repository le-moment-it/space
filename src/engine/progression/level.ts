/**
 * Commander level: the single meta-progression track.
 *
 * Every encounter you win pays XP, and your level quietly raises the rarity weights
 * on every card offer (see cards/rarityOdds). It replaced a milestone system whose
 * unlocks arrived in lumps and left a fresh profile with a flat 0% chance of anything
 * above Common — a curve reads better and means every fight moves the bar.
 */

/** XP for winning one encounter, by the kind of node it was on. */
export const XP_AWARDS = {
  combat: 10,
  elite: 25,
  boss: 60,
} as const;

export type XpSource = keyof typeof XP_AWARDS;

export const MAX_LEVEL = 20;

/**
 * XP to go from `level` to the next one. Linear growth: cheap early so the first few
 * levels land inside the first run or two, ~1140 for the last step. Reaching the cap
 * costs 11,400 in total, about 35-45 completed runs.
 */
export function xpToAdvance(level: number): number {
  return 60 * level;
}

/** Total XP needed to have reached `level` from zero. */
export function xpForLevel(level: number): number {
  const capped = Math.min(Math.max(level, 1), MAX_LEVEL);
  // Sum of 60n for n in [1, capped-1].
  return 30 * capped * (capped - 1);
}

/** The level a given lifetime XP total earns. Clamped to [1, MAX_LEVEL]. */
export function levelFor(xp: number): number {
  if (!Number.isFinite(xp) || xp <= 0) return 1;
  let level = 1;
  while (level < MAX_LEVEL && xp >= xpForLevel(level + 1)) level += 1;
  return level;
}

export interface LevelProgress {
  level: number;
  /** XP earned since reaching the current level. */
  into: number;
  /** XP the current level costs in total; 0 at the cap. */
  span: number;
  atMax: boolean;
}

/** Where the player sits inside their current level, for a progress bar. */
export function levelProgress(xp: number): LevelProgress {
  const level = levelFor(xp);
  if (level >= MAX_LEVEL) return { level, into: 0, span: 0, atMax: true };
  const base = xpForLevel(level);
  return { level, into: Math.max(0, xp - base), span: xpToAdvance(level), atMax: false };
}

/**
 * Content that opens for *deck building* at each level.
 *
 * Distinct from drop odds: every card can drop from run 1, level only changes how
 * likely. This is the other half — what you may put in your starting deck — so the
 * opening deck stays simple and widens as you play.
 *
 * Additive only. `grantLevelUnlocks` unions these in on every load, so a level never
 * takes anything away and a retuned table can only ever grant more.
 */
export interface LevelUnlock {
  level: number;
  cardIds: string[];
  shipSystemIds: string[];
}

export const LEVEL_UNLOCKS: LevelUnlock[] = [
  {
    level: 2,
    cardIds: ['backup-generator', 'overdrive-coils'],
    shipSystemIds: ['deflector-array'],
  },
  {
    level: 3,
    cardIds: ['disruptor-cannon', 'nanite-repair'],
    shipSystemIds: ['expanded-cargo-bay'],
  },
  {
    level: 4,
    cardIds: ['emergency-shield-boost', 'data-uplink'],
    shipSystemIds: ['redundant-systems'],
  },
  {
    level: 5,
    cardIds: ['nanite-swarm', 'triage-primer'],
    shipSystemIds: ['shield-capacitor-array'],
  },
  {
    level: 7,
    cardIds: ['jamming-pulse', 'capacitor-bank'],
    shipSystemIds: ['overcharged-reactor', 'nano-repair-matrix'],
  },
  {
    level: 9,
    cardIds: ['targeting-lock', 'capacitor-brace'],
    shipSystemIds: ['rapid-deployment-bay'],
  },
  {
    level: 11,
    cardIds: ['siege-cannon', 'full-repair-kit'],
    shipSystemIds: ['ablative-plating', 'secondary-reactor'],
  },
  {
    level: 12,
    cardIds: ['siphon-beam', 'aegis-shield'],
    shipSystemIds: ['point-defense-grid'],
  },
  {
    level: 14,
    cardIds: ['corrosive-flak', 'hull-cutter'],
    shipSystemIds: ['hardened-bulkheads', 'tertiary-capacitors'],
  },
  {
    level: 16,
    cardIds: ['gunnery-calibration', 'deflector-tuning'],
    shipSystemIds: ['auxiliary-databanks', 'emergency-cutoff'],
  },
  {
    level: 18,
    cardIds: ['needle-volley'],
    shipSystemIds: ['quantum-buffer'],
  },
  {
    level: 20,
    cardIds: ['overwhelming-barrage', 'master-gunner'],
    shipSystemIds: ['overclocked-thrusters'],
  },
];

/** Everything unlocked at or below `level`. */
export function unlocksUpTo(level: number): { cardIds: string[]; shipSystemIds: string[] } {
  const cardIds: string[] = [];
  const shipSystemIds: string[] = [];
  for (const unlock of LEVEL_UNLOCKS) {
    if (unlock.level > level) continue;
    cardIds.push(...unlock.cardIds);
    shipSystemIds.push(...unlock.shipSystemIds);
  }
  return { cardIds, shipSystemIds };
}

/** The next thing to look forward to, or undefined at the cap. */
export function nextUnlock(level: number): LevelUnlock | undefined {
  return LEVEL_UNLOCKS.find((unlock) => unlock.level > level);
}
