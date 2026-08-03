import { enemyArtFor } from '../art/enemies';

/**
 * The thing you are fighting, facing left across the arena at your ship.
 *
 * Renders nothing when a design has no sprite yet — unlike the ship there is no vector
 * fallback to draw, and the panel's name, intent and hull bar already stand on their own.
 * That is what lets art land one design at a time.
 *
 * `alt=""`: the enemy's name is printed directly above it, so describing the sprite would
 * only make a screen reader say the name twice.
 */
export function EnemyArt({ enemyId }: { enemyId: string }) {
  const art = enemyArtFor(enemyId);
  if (!art) return null;

  return (
    <div className="combatant__art combatant__art--enemy">
      <img className="combatant__sprite" src={art} alt="" data-enemy={enemyId} />
    </div>
  );
}
