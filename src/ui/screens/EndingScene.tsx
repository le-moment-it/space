import { useState } from 'react';
import type { EndingDefinition } from '../../engine/progression/endings';
import './EndingScene.css';

/** A short cinematic scene played at the Hub when an ending is unlocked (or replayed). */
export function EndingScene({
  ending,
  onDismiss,
}: {
  ending: EndingDefinition;
  onDismiss: () => void;
}) {
  const [revealed, setRevealed] = useState(1);
  const total = ending.scene.length;
  const done = revealed >= total;

  return (
    <div
      className="ending-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={`Ending: ${ending.title}`}
    >
      <div className="ending">
        <p className="eyebrow ending__eyebrow">Ending</p>
        <h1 className="ending__title">{ending.title}</h1>
        <div className="ending__scene">
          {ending.scene.slice(0, revealed).map((para, i) => (
            <p key={i} className="ending__para">
              {para}
            </p>
          ))}
        </div>
        <button
          className="btn-primary ending__advance"
          onClick={() => (done ? onDismiss() : setRevealed((r) => r + 1))}
        >
          {done ? 'Continue' : 'Next'}
        </button>
      </div>
    </div>
  );
}
