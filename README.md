# Space Roguelike (working title)

A browser-only, single-player deck-building roguelike set in space. Your starship
_is_ a deck of cards — start with a handful of basic weapons and maneuvers, fight
your way through a branching star chart across 3 acts, and unlock more powerful
cards, crew, and ship systems for future runs as you go. Discover the crew's stories
across repeated runs, and eventually unlock one of the game's endings.

Inspired by _Slay the Spire_ (map + card combat + unlock pool), _Hades_ (crew
dialogue driving replay), and _Pokerogue_ (fully browser-based, freely hostable).

**Status**: pre-alpha / planning. No gameplay yet — see the docs below for the full
design and build plan.

## Docs

- [`docs/GAME_DESIGN.md`](docs/GAME_DESIGN.md) — what the game is: map generation,
  combat, meta-progression, crew/lore, endings, content targets.
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — how it's built: tech stack,
  project structure, save data, testing, CI/CD.
- [`docs/ROADMAP.md`](docs/ROADMAP.md) — milestone sequence from empty repo to v1.0.

## Tech stack (short version)

TypeScript + React + Vite, no game engine (the game is menu/card-driven, not
physics/animation-heavy). Game logic lives in a plain-TypeScript `engine/` layer
with no React/DOM dependency, so it's unit-testable independent of the UI.
Save data lives in the browser (`localStorage`), versioned with a migration
pipeline so updates never wipe player progress. Deployed to GitHub Pages via
GitHub Actions on every push to `main`.

## Running locally

Not yet scaffolded — this section will be filled in once the Vite project exists
(see `docs/ROADMAP.md`, milestone M0).

## License

MIT — see [`LICENSE`](LICENSE).
