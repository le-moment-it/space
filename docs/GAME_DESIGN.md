# Game Design Document — "Space Roguelike" (working title)

Status: draft v0.1 — living document, update as design decisions change.

## 1. Pitch

A browser-only, single-player deck-building roguelike set in space. The player commands
a starship represented as a deck of cards. Each run generates a 3-act star map; each act
is a branching network of at least 30 encounter nodes across 3 crossable paths, ending in
a boss. Combat is turn-based, one ship vs one hostile, resolved entirely through cards.
Between runs, permanent unlocks expand the pool of cards, crew, and events available to
future runs — the ship never gets permanently stronger, but its possibility space grows.
Across many runs, the player uncovers crew backstories through in-run dialogue and
eventually unlocks one of several endings.

Primary references: Slay the Spire (map structure, card combat, run-based unlock pool),
Hades (crew dialogue/relationships driving repeat play, milestone-gated endings),
Pokerogue (browser-only, freely hostable, updated over time).

## 2. Core Loop

1. Start a run: pick/confirm starting deck (fixed for v1.0, no character select) and hull.
2. Traverse Act 1's map node by node, choosing between up to 3 available paths.
3. Resolve whatever node you land on (combat, event, rest, shop, treasure).
4. Defeat the Act boss → choose 1 of 3 ship system rewards (permanent-for-this-run).
5. Repeat for Act 2 and Act 3.
6. Run ends in victory (Act 3 boss defeated) or defeat (hull reaches 0).
7. Return to the Hub screen: see run summary, any newly unlocked codex/dialogue,
   any newly unlocked cards/crew/events added to the pool for future runs, ending
   status if a milestone was newly met.
8. Start a new run — deck starts back at the basic pool, but that pool is bigger and the
   map can now spawn crew/events/cards unlocked so far.

## 3. Map Generation

- 3 acts per run. Each act is an directed layered graph, not a simple line:
  - ~7–9 "layers" (columns) deep, each layer has 3–5 nodes.
  - Every node connects to 1–2 nodes in the next layer; edges are allowed to cross
    (a node in the left path can connect to a node under the middle path and vice versa),
    matching the Slay the Spire look where paths braid together rather than staying parallel.
  - Total node count per act: **30+** (tune per act if needed, e.g. more in later acts).
  - Exactly 3 paths are "enterable" from the start node — i.e. 3 outgoing edges from the
    act's entry point — satisfying "3 possible paths that can be crossed."
  - The final layer converges to a single Boss node.
- Node types (theming in parentheses, mechanics-first naming in code):
  - **Combat** (Hostile Contact) — standard single enemy fight.
  - **Elite** (Elite Hostile) — harder fight, better guaranteed reward (rare card / ship system).
  - **Event** (Anomaly / Distress Signal) — text-based choice event, may reward/cost hull,
    cards, crew, or ship systems; this is also where crew are recruited and where crew
    dialogue/lore triggers.
  - **Rest** (Repair Bay) — heal hull or upgrade one card (STS-style rest-site choice).
  - **Shop** (Salvage Trader) — spend a run-currency (salvage/scrap) to buy cards, ship
    systems, or remove a card from the deck.
  - **Treasure** (Derelict Cache) — guaranteed free reward, no fight.
  - **Boss** — one per act, end of the layered graph.
- Distribution is weighted and constrained by generation rules (e.g. no two Rest nodes
  back-to-back reachable in a row, Elite nodes not reachable in the first 1–2 layers,
  every path from start to boss has a comparable total difficulty/reward budget so no
  path is a strictly "easy" or "trap" choice).
- Generation is driven by a **seeded PRNG** — every run has a seed; same seed + same
  unlock-state reproduces the same map. This is mainly for debugging/testing now, and
  keeps the door open for a "daily challenge seed" feature later.
- Map generation is pure logic with no rendering dependency — it must be unit-testable
  in isolation (node count, path count, connectivity, no dead ends, difficulty budget
  per path all assertable in tests without touching React).

## 4. Combat System — "the ship is a deck"

- **1 ship vs 1 enemy**, turn-based, resolved through cards. No party/multi-combatant
  system for v1.0.
- Resources per turn:
  - **Hull** — the ship's HP. Reaching 0 ends the run.
  - **Shields** — like Slay the Spire's Block: absorbs damage, resets at the start of the
    player's turn (standard subject-to-balance decision).
  - **Power** (reactor power / energy) — spent per turn to play cards, refills each turn.
- Card types:
  - **Weapon** (Attack) — deal damage, may have secondary effects (pierce shields, etc.).
  - **Maneuver** (Skill) — shields, evasion, draw, repair, debuffs on enemy, buffs on self.
  - **Ship System** (Power) — played once per turn or has a persistent passive effect for
    the rest of combat (mirrors STS "Power" cards).
  - **Crew** — cards tied to a specific recruited crew member; only enter the deck pool
    once that crew member has been recruited in the current run (or permanently unlocked
    into the pool via meta-progression — see §5).
- Enemies telegraph their next action ("intent" — attack + amount, defend, buff, etc.)
  before the player acts, same convention as Slay the Spire, so decisions are informed
  rather than guessing.
- Starting deck (v1.0 target, tune during build): ~10 cards — basic Weapon (e.g. "Kinetic
  Cannon"), basic Maneuver (e.g. "Raise Shields"), a couple of situational basics. Simple
  and weak on purpose — this is the "basic cards at the start" baseline the player asked for.

## 5. Meta-Progression — "unlock pool, ship grows over many runs"

- Chosen model: the ship's starting deck for a _fresh run_ never gets permanently
  stronger in terms of base stats. What grows over time is the **pool** of cards, crew,
  events, and ship systems that _can_ appear:
  - Beating milestones (defeating an act boss for the first time, defeating the Act 3
    boss, recruiting a specific crew member, certain event outcomes) unlocks new cards,
    new crew, and new event content into the pool for all future runs.
  - Within a single run, the deck grows through normal roguelike means: rewards from
    combat/elites/treasure/shops/rest-upgrades — but all of that resets at the start of
    the next run except that it's now possible to draw from a bigger pool.
  - This mirrors Slay the Spire's unlock model rather than Hades' permanent-boon-currency
    model, per your steer: "our starship is a deck of cards... more we play more we unlock
    powerful cards." Concretely: a rare/powerful card doesn't exist in the pool at all
    until unlocked; after that it can show up as a normal in-run reward in any future run.
  - **Ship systems** (the "improvement" won at the end of every act/level, per your
    original spec) are the closest analogue to Slay the Spire relics: a passive,
    for-this-run-only bonus chosen from 3 options after each act boss. Some ship
    systems themselves are pool-gated (only appear as a choice once unlocked).
- This keeps every run fair/comparable in difficulty (no permanent power creep making
  runs trivially easy), while still giving the "number go up" satisfaction of unlocking
  new toys — the target feeling is "I have more interesting choices," not "I am stronger."

## 6. Crew & Lore (Hades-style dialogue)

- Crew are recruited through **Event** nodes (a distress signal, a derelict escape pod,
  a defector from a hostile faction, etc.).
- Once recruited for the run, a crew member:
  - Contributes 1–2 unique cards to the deck for the rest of the run.
  - May grant a small passive effect.
  - Becomes available for **dialogue** at subsequent Event/Rest nodes and at the Hub
    screen between runs — short portrait + text exchanges, similar in spirit to Hades'
    character barks, gated by flags (has this crew been met before across any run, are
    they alive this run, how many runs has the player completed, has a given
    story-flag been triggered).
- Recruiting the same crew member across different runs is expected and desired —
  their dialogue should progress across repeated recruitments/runs (a linear "track" of
  lines per crew member gated by global counters), not require them to survive a single
  run to unlock the next line. This is what turns "play again and again" into "discover
  more of the story."
- **Art note**: crew portraits should use the same minimalist/vector visual language as
  the rest of the UI (flat shapes, strong silhouette, limited palette per character)
  rather than painted/pixel-art illustration — keeps art production tractable for a
  solo dev while still giving each crew member a recognizable face. Revisit if budget
  or scope changes.
- v1.0 target: **5–8 recruitable crew members**, each with a short dialogue track
  (roughly 4–8 lines unlocked progressively) and a one-paragraph codex bio.

## 7. Endings

- v1.0 target: **2 endings**, both gated by meta-progression milestones (not by
  in-run choices, per your steer — simplest to implement, no branching-per-run needed):
  - **Ending A** ("first contact" / working title): unlocked the first time the player
    defeats the Act 3 boss, i.e. the "normal" win condition.
  - **Ending B** ("true ending" / working title): unlocked once a further global
    milestone is met on top of Ending A — e.g. all crew recruited at least once across
    any runs, and/or full codex completion, and/or defeating the Act 3 boss again after
    that milestone. Exact trigger is a content decision to make once crew/lore content
    is written; the _system_ just needs to check a milestone-flags object.
- Both endings play out as a short scene at the Hub after a winning run — text/portrait
  based, consistent with the dialogue system in §6. No separate rendering system needed.
- Post-1.0 idea (not in scope now): additional endings driven by in-run crew survival/
  choices, layered on top of the milestone gate.

## 8. Content Volume Target for v1.0

| Content                        | Target                                       |
| ------------------------------ | -------------------------------------------- |
| Acts                           | 3                                            |
| Nodes per act                  | 30+ across 3 initial paths                   |
| Unique cards (pool, end state) | 40–60                                        |
| Enemy types                    | 8–12                                         |
| Elite encounters               | 2–3 designs, reused across acts with scaling |
| Act bosses                     | 3 (one per act)                              |
| Recruitable crew               | 5–8                                          |
| Endings                        | 2                                            |
| Ship systems ("relics")        | ~15–20                                       |

This is intentionally the "small & complete" target you chose — enough to feel like a
real roguelike with real replay hooks, small enough for one person to actually finish.
Treat every number above as adjustable during development; the roadmap (see
`ROADMAP.md`) sequences things so the loop is fun before content volume is added.

## 9. Terminology Cheat Sheet (theming pass over standard roguelike-deckbuilder terms)

| Generic term      | Space theming                                        |
| ----------------- | ---------------------------------------------------- |
| HP                | Hull Integrity                                       |
| Block/Shield      | Shields                                              |
| Energy            | Reactor Power                                        |
| Relic             | Ship System                                          |
| Potion/consumable | Emergency Device _(stretch goal, may cut from v1.0)_ |
| Gold/currency     | Salvage                                              |
| "?" event node    | Anomaly / Distress Signal                            |
| Rest site         | Repair Bay                                           |
| Shop              | Salvage Trader                                       |
| Map               | Star Chart                                           |

## 10. Open Design Questions To Resolve During Build

These are flagged rather than blocking — resolve them as prototyping surfaces answers:

- Exact shield/block reset rule (STS-style full reset vs partial carryover).
- Whether card upgrades exist (STS "Bonfire" upgrade at Rest) and how they're denoted.
- Whether Emergency Devices/consumables make v1.0 or are cut for scope.
- Exact milestone thresholds gating Ending B.
- Difficulty scaling curve across the 3 acts (enemy stat tables).
