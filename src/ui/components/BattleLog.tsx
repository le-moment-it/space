import { useEffect, useRef } from 'react';
import type { CombatLogEntry } from '../../engine/combat/types';
import { useTranslation, type Translator } from '../../i18n';
import './BattleLog.css';

type Side = 'player' | 'enemy' | 'system';
type LineRow = { kind: 'line'; side: Side; played: boolean; text: string };
type Row = { kind: 'turn'; turn: number } | LineRow;

/** Formats one structured log event into a translated, side-tagged line. */
function formatEntry(entry: Exclude<CombatLogEntry, { t: 'endTurn' }>, tr: Translator): LineRow {
  const { t, cardName, enemyName } = tr;
  const line = (side: Side, text: string, played = false): LineRow => ({
    kind: 'line',
    side,
    played,
    text,
  });

  switch (entry.t) {
    case 'contact':
      return line('system', t('log.contact', { name: enemyName(entry.enemyId), hull: entry.hull }));
    case 'notEnoughPower':
      return line('system', t('log.notEnoughPower', { name: cardName(entry.cardId) }));
    case 'played':
      return line('player', t('log.played', { name: cardName(entry.cardId) }), true);
    case 'damage':
      return line(
        'player',
        t('log.damage', {
          name: cardName(entry.cardId),
          amount: entry.amount,
          suffix: entry.absorbed > 0 ? t('log.absorbedEnemy', { absorbed: entry.absorbed }) : '',
        }),
      );
    case 'shield':
      return line('player', t('log.shield', { amount: entry.amount }));
    case 'heal':
      return line('player', t('log.heal', { amount: entry.amount }));
    case 'power':
      return line('player', t('log.power', { amount: entry.amount }));
    case 'weaken':
      return line(
        'player',
        t('log.weaken', {
          name: enemyName(entry.enemyId),
          amount: entry.amount,
          duration: entry.duration,
        }),
      );
    case 'draw':
      return line(
        'player',
        t(entry.amount === 1 ? 'log.drawOne' : 'log.drawMany', { amount: entry.amount }),
      );
    case 'reshuffle':
      return line('system', t('log.reshuffle'));
    case 'enemyAttack':
      return line(
        'enemy',
        t('log.enemyAttack', {
          name: enemyName(entry.enemyId),
          amount: entry.amount,
          suffix: entry.absorbed > 0 ? t('log.absorbedSelf', { absorbed: entry.absorbed }) : '',
        }),
      );
    case 'enemyShield':
      return line(
        'enemy',
        t('log.enemyShield', { name: enemyName(entry.enemyId), amount: entry.amount }),
      );
    case 'enemyDestroyed':
      return line('enemy', t('log.enemyDestroyed', { name: enemyName(entry.enemyId) }));
    default: {
      const exhaustive: never = entry;
      return line('system', String(exhaustive));
    }
  }
}

/** Expands the flat event list into rows, inserting a turn divider for each end-of-turn. */
function toRows(log: CombatLogEntry[], tr: Translator): Row[] {
  const rows: Row[] = [{ kind: 'turn', turn: 1 }];
  let turn = 1;
  for (const entry of log) {
    // Defensive: a combat saved by an older build may hold plain strings.
    if (typeof entry === 'string') {
      rows.push({ kind: 'line', side: 'system', played: false, text: entry });
      continue;
    }
    if (entry.t === 'endTurn') {
      turn += 1;
      rows.push({ kind: 'turn', turn });
      continue;
    }
    rows.push(formatEntry(entry, tr));
  }
  return rows;
}

/** A persistent, always-visible combat history — inspired by Master Duel's action log. */
export function BattleLog({ log }: { log: CombatLogEntry[] }) {
  const tr = useTranslation();
  const feedRef = useRef<HTMLDivElement>(null);
  const rows = toRows(log, tr);

  // Keep the newest action in view, the way a live duel log does.
  useEffect(() => {
    const el = feedRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [log.length]);

  return (
    <aside className="battlelog" aria-label={tr.t('battlelog.title')}>
      <p className="battlelog__title eyebrow">{tr.t('battlelog.title')}</p>
      <div className="battlelog__feed" ref={feedRef}>
        {rows.map((row, i) =>
          row.kind === 'turn' ? (
            <div key={i} className="battlelog__turn">
              <span>{tr.t('log.turn', { turn: row.turn })}</span>
            </div>
          ) : (
            <div
              key={i}
              className={`battlelog__line battlelog__line--${row.side}${
                row.played ? ' battlelog__line--played' : ''
              }`}
            >
              {row.played && <span className="battlelog__marker">▸</span>}
              <span className="battlelog__text">{row.text}</span>
            </div>
          ),
        )}
      </div>
    </aside>
  );
}
