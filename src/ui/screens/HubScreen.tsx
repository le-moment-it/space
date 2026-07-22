import { cardDefinitions } from '../../data/cards';
import { milestoneDefinitions } from '../../data/milestones';
import { shipSystemDefinitions } from '../../data/shipSystems';
import { useGameStore } from '../../state/gameStore';

const TOTAL_CARDS = Object.keys(cardDefinitions).length;
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
        Cards unlocked: {meta.unlockedCardIds.length}/{TOTAL_CARDS}
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

      <button onClick={startNewRun}>Launch new run</button>
    </section>
  );
}
