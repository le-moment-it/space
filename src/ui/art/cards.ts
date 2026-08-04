/**
 * Card art, keyed by card id.
 *
 * A card with no file here falls back to the `CardArt` glyph drawn from its effect kind,
 * so art can land one card at a time. Assets live in `src/assets/` and never `public/`:
 * vite sets `base: '/space/'`, which breaks absolute asset paths once deployed.
 */
const files = import.meta.glob('../../assets/cards/*.png', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

/** card id -> art URL, keyed off the filename. */
export const cardArt: Record<string, string> = Object.fromEntries(
  Object.entries(files).map(([path, url]) => [
    path.slice(path.lastIndexOf('/') + 1, -'.png'.length),
    url,
  ]),
);
