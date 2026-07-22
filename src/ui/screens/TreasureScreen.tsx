import { cardDefinitions } from '../../data/cards';
import { useRunStore } from '../../state/runStore';

export function TreasureScreen() {
  const run = useRunStore((s) => s.run);
  const leaveNode = useRunStore((s) => s.leaveNode);
  const reward = run.pendingReward;

  return (
    <section>
      <h2>Derelict Cache</h2>
      {reward && (
        <p>
          Found {reward.salvage} salvage
          {reward.cardId ? ` and a ${cardDefinitions[reward.cardId].name} schematic` : ''}.
        </p>
      )}
      <button onClick={leaveNode}>Continue</button>
    </section>
  );
}
