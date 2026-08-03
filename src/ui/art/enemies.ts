/**
 * Enemy art, keyed by *design* id.
 *
 * Later acts reuse the same sixteen designs at higher stats, and `scaleForAct` in
 * data/enemies.ts renames those copies to `gunship-act2` / `gunship-act3`. So the id on
 * a live combat enemy is not always the id the art is filed under — everything goes
 * through `baseEnemyId` first. Bosses are never suffixed, and the same strip is a no-op
 * for them.
 *
 * Assets live in `src/assets/` and never `public/`: vite sets `base: '/space/'`, which
 * breaks absolute asset paths once deployed.
 */
const files = import.meta.glob('../../assets/enemies/*.png', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

/** design id -> sprite URL, keyed off the filename. */
export const enemyArt: Record<string, string> = Object.fromEntries(
  Object.entries(files).map(([path, url]) => [
    path.slice(path.lastIndexOf('/') + 1, -'.png'.length),
    url,
  ]),
);

/** `gunship-act2` -> `gunship`. Leaves unsuffixed ids (every boss) untouched. */
export function baseEnemyId(id: string): string {
  return id.replace(/-act\d+$/, '');
}

/** The sprite for a live combat enemy, or undefined if that design has no art yet. */
export function enemyArtFor(id: string): string | undefined {
  return enemyArt[baseEnemyId(id)];
}
