/**
 * The player ship's art, if it has been drawn yet.
 *
 * A glob rather than a plain import so the file is genuinely optional: with no PNG
 * present this is `undefined` and `HeroShip` keeps drawing its vector ship. Same reason
 * as the crew registry — assets land one at a time.
 *
 * Lives in `src/assets/` and not `public/` because vite.config.ts sets `base: '/space/'`,
 * which breaks absolute asset paths once deployed.
 */
const files = import.meta.glob('../../assets/ship/hero.png', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

export const shipArt: string | undefined = Object.values(files)[0];
