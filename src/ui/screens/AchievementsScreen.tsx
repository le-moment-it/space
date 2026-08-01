import { useState } from 'react';
import { cardDefinitions } from '../../data/cards';
import { crewDefinitions } from '../../data/crew';
import { endingDefinitions } from '../../data/endings';
import {
  LEVEL_UNLOCKS,
  levelProgress,
  MAX_LEVEL,
  nextUnlock,
} from '../../engine/progression/level';
import { useTranslation } from '../../i18n';
import { useGameStore } from '../../state/gameStore';
import { CrewPortrait } from '../components/CrewPortrait';
import { UpgradePreview } from '../components/UpgradePreview';
import './AchievementsScreen.css';

export function AchievementsScreen() {
  const meta = useGameStore((s) => s.meta);
  const viewEnding = useGameStore((s) => s.viewEnding);
  const tr = useTranslation();
  const { t } = tr;
  const [previewCardId, setPreviewCardId] = useState<string | null>(null);

  const { level, into, span, atMax } = levelProgress(meta.xp);
  const upcoming = nextUnlock(level);
  const unlockedEndings = endingDefinitions.filter((e) =>
    meta.endingsUnlocked.includes(e.id),
  ).length;

  return (
    <section className="screen">
      <header className="screen__head">
        <p className="eyebrow">{t('ach.eyebrow')}</p>
        <h2>{t('ach.title')}</h2>
        <p className="screen__sub">{t('ach.sub')}</p>
      </header>

      <div className="statgrid">
        <Stat label={t('ach.runsStarted')} value={meta.stats.runsStarted} />
        <Stat label={t('ach.runsWon')} value={meta.stats.runsWon} />
        <Stat label={t('ach.runsLost')} value={meta.stats.runsLost} />
        <Stat label={t('ach.elitesDowned')} value={meta.stats.elitesDefeated} />
        <Stat label={t('ach.bossesDowned')} value={meta.stats.bossesDefeated} />
      </div>

      <div className="ach__cols">
        <div className="panel">
          <div className="ach__section-head">
            <p className="eyebrow">{t('ach.milestones')}</p>
            <span className="mono ach__count">
              {level}/{MAX_LEVEL}
            </span>
          </div>

          <p className="ach__level mono">{t('level.short', { level })}</p>
          <p className="ach__level-sub">
            {atMax ? t('level.max') : t('level.progress', { into, span, next: level + 1 })}
          </p>
          {!atMax && (
            <span className="ach__level-bar" aria-hidden="true">
              <span className="ach__level-fill" style={{ width: `${(into / span) * 100}%` }} />
            </span>
          )}
          {upcoming && (
            <p className="ach__level-next">
              {t('level.nextUnlock', {
                level: upcoming.level,
                count: upcoming.cardIds.length,
              })}
            </p>
          )}

          {/* The whole ladder, so the climb is legible rather than a surprise. */}
          <ul className="milestone-list">
            {LEVEL_UNLOCKS.map((unlock) => {
              const done = level >= unlock.level;
              return (
                <li key={unlock.level} className={done ? 'milestone milestone--done' : 'milestone'}>
                  <span className="milestone__mark">{done ? '◆' : '◇'}</span>
                  <span>
                    {t('level.short', { level: unlock.level })} ·{' '}
                    {unlock.cardIds.map((id, i) => (
                      <span key={id}>
                        {i > 0 && ', '}
                        <button className="milestone__card" onClick={() => setPreviewCardId(id)}>
                          {tr.cardName(id)}
                        </button>
                      </span>
                    ))}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="panel">
          <p className="eyebrow">{t('ach.crewCodex')}</p>
          <div className="codex-grid">
            {Object.values(crewDefinitions).map((crew) => {
              const timesRecruited = meta.crew[crew.id]?.timesRecruited ?? 0;
              if (timesRecruited === 0) {
                return (
                  <article key={crew.id} className="codex-card codex-card--unknown">
                    <CrewPortrait crewId={null} size="md" />
                    <div>
                      <h3 className="codex-card__name">{t('ach.unknownDrifter')}</h3>
                      <p className="codex-card__bio">{t('ach.unknownBio')}</p>
                    </div>
                  </article>
                );
              }
              const dialogueCount = crew.dialogues.length;
              const seenCount = Math.min(timesRecruited, dialogueCount);
              return (
                <article key={crew.id} className="codex-card">
                  <div className="codex-card__head">
                    <CrewPortrait crewId={crew.id} size="md" />
                    <div>
                      <h3 className="codex-card__name">{tr.crewName(crew.id)}</h3>
                      <p className="codex-card__role">
                        {t('ach.metTimes', { role: tr.crewRole(crew.id), count: timesRecruited })}
                      </p>
                    </div>
                  </div>
                  <p className="codex-card__bio">{tr.crewBio(crew.id)}</p>
                  <ul className="codex-card__log">
                    {Array.from({ length: seenCount }, (_, i) => (
                      <li key={i}>&ldquo;{tr.crewDialogue(crew.id, i)}&rdquo;</li>
                    ))}
                  </ul>
                  {seenCount < dialogueCount && (
                    <p className="codex-card__more">{t('ach.recruitAgain')}</p>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="ach__section-head">
          <p className="eyebrow">{t('ach.endings')}</p>
          <span className="mono ach__count">
            {unlockedEndings}/{endingDefinitions.length}
          </span>
        </div>
        <div className="endings-grid">
          {endingDefinitions.map((ending) => {
            const unlocked = meta.endingsUnlocked.includes(ending.id);
            if (!unlocked) {
              return (
                <div key={ending.id} className="ending-entry ending-entry--locked">
                  <span className="ending-entry__mark">◇</span>
                  <div>
                    <h3 className="ending-entry__title">{t('ach.lockedEnding')}</h3>
                    <p className="ending-entry__hint">{tr.endingSubtitle(ending.id)}</p>
                  </div>
                </div>
              );
            }
            return (
              <button
                key={ending.id}
                className="ending-entry ending-entry--unlocked"
                onClick={() => viewEnding(ending.id)}
              >
                <span className="ending-entry__mark">◆</span>
                <div>
                  <h3 className="ending-entry__title">{tr.endingTitle(ending.id)}</h3>
                  <p className="ending-entry__hint">
                    {t('ach.endingReplay', { subtitle: tr.endingSubtitle(ending.id) })}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {previewCardId && (
        <UpgradePreview
          card={cardDefinitions[previewCardId]}
          level={0}
          onClose={() => setPreviewCardId(null)}
        />
      )}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="stat">
      <span className="stat__label">{label}</span>
      <span className="stat__value mono">{value}</span>
    </div>
  );
}
