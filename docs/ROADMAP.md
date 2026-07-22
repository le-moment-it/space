# Roadmap to v1.0

Status: draft v0.1 — living document. Milestones, not dates — solo evenings/weekends
pace makes calendar estimates unreliable; treat each milestone as "done when the
listed acceptance bullets are true," and re-order if reality disagrees with the plan.

## M0 — Scaffolding & pipeline proof

Goal: prove the _boring but critical_ stuff works before writing any game logic —
the plan is worthless if you build a game for months and then discover GitHub Pages
deploy or the save system doesn't work.

- Vite + React + TypeScript project initialized, strict mode on.
- ESLint + Prettier configured.
- Vitest configured with one trivial passing test.
- GitHub Actions workflow deploys a placeholder page to GitHub Pages successfully.
- Basic `engine/`, `data/`, `state/`, `ui/` folder structure in place (empty is fine).

Acceptance: pushing to `main` produces a live, updated GitHub Pages URL automatically.

## M1 — Core engine, ugliest-possible UI

Goal: validate the actual fun of "ship as a deck of cards" before investing in map
generation or content volume. This is the highest-risk assumption in the whole
design — test it first.

- Seeded PRNG implemented + unit tested.
- Combat resolution engine: hull, shields, power/energy, a handful (~8-10) of cards,
  one dummy enemy with a fixed simple AI. Fully unit tested (scripted battles produce
  expected final state).
- Bare-bones UI to actually play a single battle by hand (buttons, no styling).

Acceptance: you can play one full battle start to finish in the browser and it's
mechanically satisfying enough that you want to keep building on it.

## M2 — Single-act vertical slice

Goal: one complete, playable act end to end — proves the map generation +
node-type variety + combat loop work together as a real run, before multiplying by 3
acts of content.

- Map generation: layered graph, 30+ nodes, 3 initial paths, converges to a boss,
  unit tested for structural invariants.
- Node types implemented: Combat, Elite, Event (basic text choices, no crew/lore
  yet), Rest, Shop, Treasure, Boss.
- ~15 cards, 3 enemy types, 1 boss.
- Minimal but real UI: star chart screen, battle screen, event/shop/rest screens.
- Win/loss end-of-run screen (no meta-progression persisted yet).

Acceptance: you can start a run, make real path choices, fight varied encounters,
beat (or lose to) a boss, and it's fun enough to want to play again immediately —
that "one more run" pull is the whole point, sanity check it now.

## M3 — Save system & meta-progression

Goal: turn single runs into an actual roguelike loop across sessions.

- Versioned save schema + migration pipeline (even though it's only v1 today —
  write the plumbing now, not when v2 is first needed).
- localStorage persistence, autosave on node resolution, resume-on-refresh for the
  current run.
- Unlock-pool system: milestones unlock cards/ship-systems into the pool for future
  runs (per GAME_DESIGN.md §5).
- End-of-act reward screen: choose 1 of 3 ship systems.
- Hub screen (minimal): run history/stats, nothing narrative yet.

Acceptance: playing multiple runs across multiple browser sessions visibly grows
the card/ship-system pool, and a browser refresh mid-run doesn't lose progress.

## M4 — Full 3-act structure + content fill

Goal: hit the content volume target from GAME_DESIGN.md §8.

- All 3 acts generating correctly, difficulty/reward scaling tuned per act.
- Card pool filled out to 40–60 cards.
- 8–12 enemy types, 2–3 elite designs (reused/scaled across acts), 3 distinct
  act bosses.
- ~15–20 ship systems.
- First real balance pass (playtest yourself repeatedly, adjust numbers).

Acceptance: a player can complete a full 3-act run to victory or defeat, and the
run-to-run variety (paths, unlocks, rewards) feels meaningfully different each time.

## M5 — Crew & lore

Goal: add the Hades-style hook that makes players want to keep playing to see more
story, per GAME_DESIGN.md §6.

- 5–8 recruitable crew, each with unique card(s) and a passive.
- Dialogue system: portrait + text, gated by simple milestone/flag checks (crew met
  before, runs completed, etc.), triggered at Event/Rest nodes and the Hub.
- Codex/bio entries readable from the Hub.
- Crew portraits produced in the minimalist/vector style established for the rest
  of the UI.

Acceptance: recruiting the same crew member across several runs visibly progresses
their dialogue/codex entry, without needing to keep them alive for a full run.

## M6 — Endings & polish

- Both endings (GAME_DESIGN.md §7) wired to their milestone conditions and tested.
- UI polish pass: animations/transitions for card play, damage, node selection;
  basic sound if/when budget allows (can ship without audio if it doesn't).
- Accessibility basics: keyboard navigation through the star chart and battle
  screen, sufficient color contrast, respects `prefers-reduced-motion`.
- Full balance pass across all 3 acts with the complete content set.
- A small set of Playwright smoke tests covering start-run → win-battle → reach-hub.

Acceptance: a new player can complete a full run, and a returning player who's
unlocked both endings feels like the story had a real payoff.

## M7 — v1.0 release

- Bug bash across a handful of full playthroughs.
- README with how-to-play, screenshots, link to the live GitHub Pages build.
- Tag `v1.0.0` (SemVer from here on for future updates).
- Write down (even briefly) what's explicitly _not_ in v1.0 (see ARCHITECTURE.md §8
  and GAME_DESIGN.md §10) so future-you doesn't relitigate already-made scope calls.

Acceptance: a stranger can open the GitHub Pages link with zero instructions and
successfully play, lose, unlock something, and want to try again.

## Notes on sequencing

- M1 is deliberately before M2's full map — don't build the map generator until you
  know the card combat itself is worth building a map around.
- M3 (save/meta-progression) is deliberately before M4 (content fill) — the
  unlock-pool _system_ should exist and be tested while the pool is still small,
  so debugging it isn't tangled up with balancing 60 cards at the same time.
- M5 (crew/lore) is deliberately after the core loop (M1–M4) is solid — dialogue and
  narrative content is comparatively cheap to add incrementally over a long period
  (it's writing, not systems work), so it's fine to keep expanding crew dialogue
  even after v1.0 ships, as long as the _system_ for it exists by M5.
