import { useEffect, useRef } from 'react';
import './BattleLog.css';

type Entry =
  | { kind: 'turn'; turn: number }
  | { kind: 'line'; side: 'player' | 'enemy' | 'system'; played: boolean; text: string };

/** Classify a raw log string so the rail can tint and mark it like a duel history. */
function classify(text: string): Exclude<Entry, { kind: 'turn' }> {
  const played = text.startsWith('Played ');
  if (
    played ||
    /^(Shields raised|Hull repaired|Reactor overcharged|Drew |You )/.test(text) ||
    /\bdeal(s)?\b/.test(text)
  ) {
    return { kind: 'line', side: 'player', played, text };
  }
  // Enemy actions name the enemy first ("Rustclaw attacks…", "… raises shields", "… destroyed!").
  if (/(attacks|raises shields|destroyed!)/.test(text)) {
    return { kind: 'line', side: 'enemy', played: false, text };
  }
  return { kind: 'line', side: 'system', played: false, text };
}

/** Turn the flat log into entries, folding the "--- End of turn ---" markers into dividers. */
function toEntries(log: string[]): Entry[] {
  const entries: Entry[] = [{ kind: 'turn', turn: 1 }];
  let turn = 1;
  for (const raw of log) {
    if (raw.startsWith('---')) {
      turn += 1;
      entries.push({ kind: 'turn', turn });
      continue;
    }
    entries.push(classify(raw));
  }
  return entries;
}

/** A persistent, always-visible combat history — inspired by Master Duel's action log. */
export function BattleLog({ log }: { log: string[] }) {
  const feedRef = useRef<HTMLDivElement>(null);
  const entries = toEntries(log);

  // Keep the newest action in view, the way a live duel log does.
  useEffect(() => {
    const el = feedRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [log.length]);

  return (
    <aside className="battlelog" aria-label="Combat log">
      <p className="battlelog__title eyebrow">Combat log</p>
      <div className="battlelog__feed" ref={feedRef}>
        {entries.map((entry, i) =>
          entry.kind === 'turn' ? (
            <div key={i} className="battlelog__turn">
              <span>Turn {entry.turn}</span>
            </div>
          ) : (
            <div
              key={i}
              className={`battlelog__line battlelog__line--${entry.side}${
                entry.played ? ' battlelog__line--played' : ''
              }`}
            >
              {entry.played && <span className="battlelog__marker">▸</span>}
              <span className="battlelog__text">{entry.text}</span>
            </div>
          ),
        )}
      </div>
    </aside>
  );
}
