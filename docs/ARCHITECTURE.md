# Architecture & Development Practices

Status: draft v0.1 — living document.

## 1. Constraints driving these choices

- Solo developer, evenings/weekends pace — optimize for momentum and low ceremony,
  not for a large team.
- Must run entirely in the browser, no required backend, hostable as static files
  (target: GitHub Pages).
- Must be updatable over time without wiping player progress (save data lives in the
  player's browser — updates must not silently corrupt or discard it).
- The game is UI/menu/card-driven (map screens, card battles, dialogue), not
  physics/animation-heavy — it does not need a game engine.

## 2. Tech Stack

- **Language**: TypeScript, `strict: true`. No `any` without a documented reason.
- **Build tool**: Vite. Fast local dev, trivial static build output, first-class GitHub
  Pages support (via `base` config + a deploy workflow).
- **UI**: React, function components + hooks. Rendering only — no game logic lives in
  components (see §3).
- **State management**: Zustand for the thin UI-facing store(s). Zustand holds
  _references_ to engine state and dispatches into engine functions; it does not
  contain game rules itself.
- **Styling**: plain CSS (CSS Modules or a single design-token stylesheet) — the
  minimalist/text-first art direction doesn't need a heavy UI kit or CSS-in-JS.
- **Testing**: Vitest (unit tests, pairs naturally with Vite) + React Testing Library
  for the handful of components worth testing directly. Playwright for a small number
  of end-to-end smoke tests (start a run, win a battle, complete an act) — added once
  there's an actual UI to drive, not from day one.
- **Lint/format**: oxlint (Rust-based, zero-config, ships with the current Vite
  React+TS template, covers React/TS rules) + Prettier for formatting. Swapped in
  from the originally-planned ESLint since it's what `create-vite` scaffolds by
  default now and is materially faster with no config burden — revisit only if a
  rule ESLint has and oxlint doesn't turns out to matter.
- **Persistence**: `localStorage` for v1.0 (simple, synchronous, sufficient size for
  save-shaped data). If save data volume grows past what's comfortable in
  `localStorage`, move to IndexedDB (e.g. via `idb-keyval`) behind the same save
  module interface — nothing above the save module should need to change.
- **Hosting/CI**: GitHub Actions, deploying to GitHub Pages on push to `main`.
- **License**: MIT.

## 3. Project Structure — engine/UI separation

The single most important architectural decision: **game logic is plain TypeScript
with zero dependency on React or the DOM.** This is what makes map generation, combat
resolution, and save/load reliably unit-testable, and it's what will let the game
survive a UI rewrite or framework swap later without touching game rules.

```
space/
  src/
    engine/            # pure TS. No React/DOM imports allowed in this folder.
      rng.ts           # seeded PRNG
      map/
        generate.ts    # layered-graph map generation
        types.ts
      combat/
        resolve.ts     # turn resolution, damage/shield/power math
        enemyAI.ts     # intent selection
        types.ts
      cards/
        effects.ts     # card effect implementations
        types.ts
      crew/
        types.ts
      progression/
        unlocks.ts     # milestone -> pool unlock logic
        endings.ts     # milestone -> ending logic
      save/
        schema.ts      # versioned save shape
        migrate.ts      # vN -> vN+1 migration functions
        serialize.ts
    data/               # content, data-driven, no logic
      cards.ts
      enemies.ts
      events.ts
      crew.ts
      shipSystems.ts
    state/              # Zustand stores; glue between engine and UI, no rules here
      runStore.ts
      metaStore.ts
    ui/
      screens/          # MapScreen, BattleScreen, EventScreen, HubScreen, ...
      components/       # Card, NodeIcon, PortraitDialogue, ...
      App.tsx
    main.tsx
  tests/                 # or colocated *.test.ts next to source — pick one convention early
  public/
  .github/workflows/deploy.yml
  docs/
    GAME_DESIGN.md
    ARCHITECTURE.md
    ROADMAP.md
```

Rule of thumb enforced by convention (and a lint import-boundary rule once the
project is big enough to justify one): `engine/` never imports from `ui/` or `state/`.
`data/` never imports from `ui/`. Everything is data/logic in, data out — easy to
unit test, easy for an AI coding assistant to work on one slice without dragging in
the whole app.

## 4. Data-Driven Content

Cards, enemies, events, crew, and ship systems are defined as typed data objects in
`src/data/`, not hardcoded into engine logic. Example shape (illustrative, refine when
building):

```ts
// src/data/cards.ts
export const cards: CardDefinition[] = [
  {
    id: 'kinetic-cannon',
    name: 'Kinetic Cannon',
    type: 'weapon',
    cost: 1,
    unlockedByDefault: true,
    effect: { kind: 'damage', amount: 6 },
  },
  // ...
];
```

This keeps adding a new card a matter of adding a data entry (+ an effect
implementation if it's a genuinely new mechanic), not a new engine code path each
time — important for solo content velocity, and for keeping content changes
low-risk to review/test.

## 5. Save Data & Forward Compatibility

Because the game will be updated after players have progress saved in their browser,
the save schema must be **versioned from day one**:

```ts
interface SaveDataV1 {
  version: 1;
  meta: {
    unlockedCardIds: string[];
    unlockedCrewIds: string[];
    unlockedShipSystemIds: string[];
    milestones: Record<string, boolean>;
    endingsUnlocked: string[];
    stats: { runsStarted: number; runsWon: number /* ... */ };
  };
  currentRun: RunStateV1 | null;
}
```

- On load, run the save through a `migrate(save)` pipeline that walks
  v1→v2→v3→... sequentially, so an update can add fields/change shape without
  discarding existing player unlocks.
- Write a migration unit test for every version bump: "given a vN fixture save,
  migrating produces valid vN+1 data" — cheap insurance against the worst possible
  bug class for this kind of game (silently wiping someone's unlocks).
- Keep `currentRun` recoverable across a page refresh (autosave after every node
  resolution), but don't be precious about mid-combat-turn granularity for v1.0.

## 6. Testing Strategy ("lightweight but real")

Priorities, roughly in order:

1. **Engine unit tests** — map generation invariants (node/path counts, connectivity,
   no dead ends, difficulty-per-path budget), combat resolution (damage/shield/power
   math, a few full scripted battles asserting final state), save migration.
2. **Save/load round-trip tests** — serialize → deserialize → migrate fixtures.
3. **A handful of component tests** for the trickiest UI logic (e.g. the map screen's
   "which nodes are currently selectable" logic).
4. **A small number of Playwright smoke tests** once there's a real UI: start a run,
   win one battle, reach the hub. These catch "the build is fundamentally broken,"
   not balance/UX issues.

Explicitly _not_ doing for v1.0: enforced coverage percentage gates, strict TDD
discipline, or testing every card's exact numeric balance (balance is a design
iteration problem, not a correctness problem — playtesting, not unit tests, is the
right tool there).

## 7. CI/CD

`.github/workflows/deploy.yml` (shape, refine when scaffolding):

- Trigger: push to `main` (and manually via `workflow_dispatch`).
- Steps: install deps → typecheck → lint → `vitest run` → `vite build` → deploy
  `dist/` to GitHub Pages (via `actions/deploy-pages` or `peaceiris/actions-gh-pages`).
- Failing typecheck/lint/test blocks the deploy step (but doesn't need to block you
  from pushing to `main` directly — solo project, no PR gate required, just don't
  ship a build that fails its own checks).

## 8. Things explicitly deferred past v1.0

Keep these out of scope now; the architecture above shouldn't need to change
fundamentally to add them later, but don't build them preemptively:

- Backend/cloud saves, accounts, cross-device sync, leaderboards.
- Crew-as-separate-combatants battle mode.
- Localization/i18n (all strings currently just live in `data/` — should be movable
  to a translation layer later without an engine rewrite, but no i18n framework now).
- Daily/seeded challenge runs with shared leaderboards (the seeded RNG groundwork is
  already there — this is mostly a UI + backend feature later).
- Accessibility beyond the basics (keyboard navigation, color contrast, reduced-motion)
  — do the basics as part of normal UI work since the minimalist style makes them
  cheap, but don't scope a full audit for v1.0.
