import { useState } from 'react';
import type { EndingDefinition } from '../../engine/progression/endings';
import { useTranslation } from '../../i18n';
import './EndingScene.css';

/** A short cinematic scene played at the Hub when an ending is unlocked (or replayed). */
export function EndingScene({
  ending,
  onDismiss,
}: {
  ending: EndingDefinition;
  onDismiss: () => void;
}) {
  const { t, endingTitle, endingScene } = useTranslation();
  const [revealed, setRevealed] = useState(1);
  const title = endingTitle(ending.id);
  const scene = endingScene(ending.id);
  const total = scene.length;
  const done = revealed >= total;

  return (
    <div
      className="ending-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={t('ending.label', { title })}
    >
      <div className="ending">
        <p className="eyebrow ending__eyebrow">{t('ending.eyebrow')}</p>
        <h1 className="ending__title">{title}</h1>
        <div className="ending__scene">
          {scene.slice(0, revealed).map((para, i) => (
            <p key={i} className="ending__para">
              {para}
            </p>
          ))}
        </div>
        <button
          className="btn-primary ending__advance"
          onClick={() => (done ? onDismiss() : setRevealed((r) => r + 1))}
        >
          {done ? t('common.continue') : t('ending.next')}
        </button>
      </div>
    </div>
  );
}
