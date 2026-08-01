/**
 * Crew portrait art, discovered from the filesystem rather than listed by hand.
 *
 * Assets live in `src/assets/` and never in `public/`: vite.config.ts sets
 * `base: '/space/'`, so an absolute path like `/crew/torque.png` resolves correctly in
 * dev and 404s once deployed. Imported URLs get rewritten by Vite and survive the base
 * path — which is also why this uses a glob rather than a hand-maintained list, since a
 * list would drift from the folder.
 *
 * A crew member with no file here keeps their emoji (see CrewPortrait), so portraits can
 * land one at a time.
 */
const files = import.meta.glob('../../assets/crew/*.png', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

/** crew id -> portrait URL, keyed off the filename. */
export const crewArt: Record<string, string> = Object.fromEntries(
  Object.entries(files).map(([path, url]) => [
    path.slice(path.lastIndexOf('/') + 1, -'.png'.length),
    url,
  ]),
);
