import { cardDefinitions } from '../../data/cards';
import type { RunState } from '../../engine/run/types';
import { useGameStore } from '../../state/gameStore';

export function TreasureScreen({ run }: { run: RunState }) {
  const leaveNode = useGameStore((s) => s.leaveNode);
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
