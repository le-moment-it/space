import { crewDefinitions } from '../../data/crew';
import { endingDefinitions } from '../../data/endings';
import { milestoneDefinitions } from '../../data/milestones';
import { useGameStore } from '../../state/gameStore';
import './AchievementsScreen.css';

export function AchievementsScreen() {
  const meta = useGameStore((s) => s.meta);
  const viewEnding = useGameStore((s) => s.viewEnding);

  const completedMilestones = milestoneDefinitions.filter((m) => meta.milestones[m.id]).length;
  const unlockedEndings = endingDefinitions.filter((e) =>
    meta.endingsUnlocked.includes(e.id),
  ).length;

  return (
    <section className="screen">
      <header className="screen__head">
        <p className="eyebrow">Log</p>
        <h2>Achievements</h2>
        <p className="screen__sub">
          The crew you&rsquo;ve met, the milestones you&rsquo;ve hit, the endings you&rsquo;ve
          reached.
        </p>
      </header>

      <div className="statgrid">
        <Stat label="Runs started" value={meta.stats.runsStarted} />
        <Stat label="Runs won" value={meta.stats.runsWon} />
        <Stat label="Runs lost" value={meta.stats.runsLost} />
        <Stat label="Elites downed" value={meta.stats.elitesDefeated} />
        <Stat label="Bosses downed" value={meta.stats.bossesDefeated} />
      </div>

      <div className="ach__cols">
        <div className="panel">
          <div className="ach__section-head">
            <p className="eyebrow">Milestones</p>
            <span className="mono ach__count">
              {completedMilestones}/{milestoneDefinitions.length}
            </span>
          </div>
          <ul className="milestone-list">
            {milestoneDefinitions.map((m) => {
              const done = Boolean(meta.milestones[m.id]);
              return (
                <li key={m.id} className={done ? 'milestone milestone--done' : 'milestone'}>
                  <span className="milestone__mark">{done ? '◆' : '◇'}</span>
                  <span>{m.description}</span>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="panel">
          <p className="eyebrow">Crew codex</p>
          <div className="codex-grid">
            {Object.values(crewDefinitions).map((crew) => {
              const timesRecruited = meta.crew[crew.id]?.timesRecruited ?? 0;
              if (timesRecruited === 0) {
                return (
                  <article key={crew.id} className="codex-card codex-card--unknown">
                    <div className="codex-card__portrait">?</div>
                    <div>
                      <h3 className="codex-card__name">Unknown drifter</h3>
                      <p className="codex-card__bio">
                        Somewhere among the wrecks. Recruit to learn more.
                      </p>
                    </div>
                  </article>
                );
              }
              const seen = crew.dialogues.slice(0, Math.min(timesRecruited, crew.dialogues.length));
              return (
                <article key={crew.id} className="codex-card">
                  <div className="codex-card__head">
                    <span className="codex-card__portrait">{crew.portrait}</span>
                    <div>
                      <h3 className="codex-card__name">{crew.name}</h3>
                      <p className="codex-card__role">
                        {crew.role} · met {timesRecruited}×
                      </p>
                    </div>
                  </div>
                  <p className="codex-card__bio">{crew.bio}</p>
                  <ul className="codex-card__log">
                    {seen.map((line, i) => (
                      <li key={i}>&ldquo;{line}&rdquo;</li>
                    ))}
                  </ul>
                  {seen.length < crew.dialogues.length && (
                    <p className="codex-card__more">Recruit again to hear more…</p>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="ach__section-head">
          <p className="eyebrow">Endings</p>
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
                    <h3 className="ending-entry__title">Locked ending</h3>
                    <p className="ending-entry__hint">{ending.subtitle}</p>
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
                  <h3 className="ending-entry__title">{ending.title}</h3>
                  <p className="ending-entry__hint">{ending.subtitle} · replay</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
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
