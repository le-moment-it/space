import type { StatusId } from '../../engine/combat/status';
import type { UiKey } from '../../i18n';
import type { KeywordId } from './Keyword';

/**
 * i18n keys per status, in one compile-checked place.
 *
 * Records keyed by StatusId rather than template strings, so adding a status is a
 * type error here until it has a name and a log line — a `status.${id}` template
 * would silently render the raw key instead.
 */
export const STATUS_LABEL_KEY: Record<StatusId, UiKey> = {
  weaken: 'status.weaken',
  corrosion: 'status.corrosion',
  breach: 'status.breach',
  calibration: 'status.calibration',
  deflector: 'status.deflector',
  chargeDamage: 'status.chargeDamage',
  chargeShield: 'status.chargeShield',
  chargeHeal: 'status.chargeHeal',
};

export const STATUS_APPLIED_KEY: Record<StatusId, UiKey> = {
  weaken: 'status.weaken.applied',
  corrosion: 'status.corrosion.applied',
  breach: 'status.breach.applied',
  calibration: 'status.calibration.applied',
  deflector: 'status.deflector.applied',
  chargeDamage: 'status.chargeDamage.applied',
  chargeShield: 'status.chargeShield.applied',
  chargeHeal: 'status.chargeHeal.applied',
};

/** Only damage-over-time statuses ever tick, but the map keeps lookups total. */
export const STATUS_TICK_KEY: Record<StatusId, UiKey> = {
  weaken: 'status.weaken',
  corrosion: 'status.corrosion.tick',
  breach: 'status.breach',
  calibration: 'status.calibration',
  deflector: 'status.deflector',
  chargeDamage: 'status.chargeDamage',
  chargeShield: 'status.chargeShield',
  chargeHeal: 'status.chargeHeal',
};

/** Whether the status helps its bearer — drives the chip colour. */
export const STATUS_IS_BUFF: Record<StatusId, boolean> = {
  weaken: false,
  corrosion: false,
  breach: false,
  calibration: true,
  deflector: true,
  chargeDamage: true,
  chargeShield: true,
  chargeHeal: true,
};

/**
 * The keyword explainer behind each status chip, so a status you meet mid-fight is
 * as interrogable as one printed on a card. The three charges share one rule.
 */
export const STATUS_KEYWORD: Record<StatusId, KeywordId> = {
  weaken: 'weaken',
  corrosion: 'corrosion',
  breach: 'breach',
  calibration: 'calibration',
  deflector: 'deflector',
  chargeDamage: 'charge',
  chargeShield: 'charge',
  chargeHeal: 'charge',
};
