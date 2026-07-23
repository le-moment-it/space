import { runCardPool } from '../../data/cards';
import { crewDefinitions } from '../../data/crew';
import { milestoneDefinitions } from '../../data/milestones';
import { shipSystemDefinitions } from '../../data/shipSystems';
import { useGameStore } from '../../state/gameStore';

// Crew cards are excluded: they join via recruitment, not the unlock pool.
const TOTAL_UNLOCKABLE_CARDS = runCardPool.length;
const TOTAL_SHIP_SYSTEMS = Object.keys(shipSystemDefinitions).length;

export function HubScreen() {
  const meta = useGameStore((s) => s.meta);
  const startNewRun = useGameStore((s) => s.startNewRun);

  return (
    <section>
      <h2>Hub</h2>
      <p>Runs started: {meta.stats.runsStarted}</p>
      <p>Runs won: {meta.stats.runsWon}</p>
      <p>Runs lost: {meta.stats.runsLost}</p>
      <p>Elites defeated: {meta.stats.elitesDefeated}</p>
      <p>
        Cards unlocked: {meta.unlockedCardIds.length}/{TOTAL_UNLOCKABLE_CARDS}
      </p>
      <p>
        Ship systems unlocked: {meta.unlockedShipSystemIds.length}/{TOTAL_SHIP_SYSTEMS}
      </p>

      <h3>Milestones</h3>
      <ul>
        {milestoneDefinitions.map((milestone) => (
          <li key={milestone.id}>
            {meta.milestones[milestone.id] ? '✅' : '⬜'} {milestone.description}
          </li>
        ))}
      </ul>

      <h3>Crew Codex</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {Object.values(crewDefinitions).map((crew) => {
          const timesRecruited = meta.crew[crew.id]?.timesRecruited ?? 0;
          if (timesRecruited === 0) {
            return (
              <div key={crew.id}>
                <strong>❔ Unknown drifter</strong>
                <p>Someone is out there among the wrecks. Recruit them to learn their story.</p>
              </div>
            );
          }
          const seenDialogues = crew.dialogues.slice(
            0,
            Math.min(timesRecruited, crew.dialogues.length),
          );
          return (
            <div key={crew.id}>
              <strong>
                {crew.portrait} {crew.name}
              </strong>{' '}
              — <em>{crew.role}</em> (recruited {timesRecruited}×)
              <p>{crew.bio}</p>
              <ul>
                {seenDialogues.map((line, index) => (
                  <li key={index}>“{line}”</li>
                ))}
              </ul>
              {seenDialogues.length < crew.dialogues.length && (
                <p>
                  <em>Recruit again to hear more…</em>
                </p>
              )}
            </div>
          );
        })}
      </div>

      <button onClick={startNewRun}>Launch new run</button>
    </section>
  );
}
