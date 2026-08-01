# Art Prompts — 58 pixel-art assets

Prompts for commissioning the game's art from an image generator. Every asset the game needs is
here: 35 card icons, 16 enemies, 6 crew portraits, 1 player ship.

The hard problem is not any single image — it is making 58 separately-generated images look like one
set. That is what the fixed style block and the locked palette below are for. Do not paraphrase
them.

---

## 1. How to build a prompt

Each entry below gives a **subject line**. The prompt you paste is:

```
{SUBJECT}. {STYLE BLOCK}
```

The style block, verbatim, with two substitutions:

```
16-bit pixel art game sprite, single object centred, hard pixel edges, no antialiasing,
no gradients, no soft shading. Strictly limited palette: cold blue-black metal #0f1524
#1d2942 #3a4a70 #6b82ad with {ACCENT} accents. Strong dark outline, lit from upper left.
Retro sci-fi salvage aesthetic. Flat {BG} background. No text, no labels, no border, no
frame, no UI, no drop shadow.
```

`{ACCENT}` and `{BG}` are fixed per section and stated at the top of each — you never pick them.

### A fully assembled example

> 16-bit pixel art game sprite of a massive siege rail cannon: one long heavy barrel on an armoured
> turret mount, hot energy charging at the muzzle, thick recoil bracing, side view facing right.
> 16-bit pixel art game sprite, single object centred, hard pixel edges, no antialiasing, no
> gradients, no soft shading. Strictly limited palette: cold blue-black metal #0f1524 #1d2942
> #3a4a70 #6b82ad with #ff6f5e accents. Strong dark outline, lit from upper left. Retro sci-fi
> salvage aesthetic. Flat #05070e background. No text, no labels, no border, no frame, no UI, no
> drop shadow.

### Specs

| Section        | Count | `{ACCENT}` | `{BG}`    | Aspect | Save as            |
| -------------- | ----- | ---------- | --------- | ------ | ------------------ |
| Weapon cards   | 11    | `#ff6f5e`  | `#05070e` | 16:9   | `cards/<id>.png`   |
| Maneuver cards | 14    | `#35e0d6`  | `#05070e` | 16:9   | `cards/<id>.png`   |
| System cards   | 10    | `#a98bff`  | `#05070e` | 16:9   | `cards/<id>.png`   |
| Enemies        | 16    | `#ff9052`  | `#FF00FF` | 1:1    | `enemies/<id>.png` |
| Crew           | 6     | `#ecc879`  | `#FF00FF` | 1:1    | `crew/<id>.png`    |
| Player ship    | 1     | `#35e0d6`  | `#FF00FF` | 16:9   | `ship/hero.png`    |

**Filenames must match exactly.** They are the ids the game looks art up by; a renamed file silently
gets no art.

**Generate at whatever resolution your tool likes** — 1000–1700px is typical and fine. Only the
aspect ratio matters here. Run `node scripts/normalize-art.mjs` after dropping files into
`src/assets/`; it downscales each asset to its shipping size, lifts the magenta key, keeps your
full-size originals in `art-masters/`, and refuses to touch anything whose aspect ratio does not
match, rather than silently squashing it. Cards are 16:9 because the card's art window is.

**Why two background colours.** Card icons sit inside a dark inset "screen" that is already `#05070e`,
so a flat dark background blends in and needs no cutout — that is 35 of the 58 images with zero
post-processing. Enemies, crew and the ship sit on varied surfaces, so they need transparency;
`#FF00FF` is the easiest colour to key out cleanly because nothing in the palette is near it.

**Facing.** In a fight the player ship is on the **left** and the enemy on the **right**, so the ship
faces **right** and every enemy faces **left**. Getting this backwards means every enemy appears to
be fleeing.

---

## 2. Adapting to your tool

The subject lines are tool-agnostic. Add whichever applies:

| Tool                        | Append / adjust                                                                                                                                                                                       |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Midjourney**              | `--ar 1:1` (`--ar 16:9` for the ship) `--style raw`. Generate **one** image first, then reuse it as `--sref <url>` on all 57 others — this is the single most effective consistency lever available.  |
| **Stable Diffusion / Flux** | Negative prompt: `blurry, antialiased, smooth gradient, soft shading, 3d render, photorealistic, text, watermark, signature, frame, border, jpeg artifacts, extra objects`. Fix the seed per section. |
| **DALL·E 3 / ChatGPT**      | Prefix with `Generate a single game asset image, no caption and no explanation:`. It tends to add borders and captions; restate "no text, no border" if it does.                                      |
| **Nano Banana / Gemini**    | Works from the prompt as written. Ask for one asset per message — batching drifts the style.                                                                                                          |

---

## 3. QA checklist

AI "pixel art" is frequently not real pixel art. Check each image for:

- **Wrong aspect ratio** — the tool often ignores the size you ask for and returns its own default.
  `normalize-art.mjs` will refuse the file rather than distort it, so this is the one to catch first.
- **Off-grid pixels** — blocks that aren't aligned to a consistent grid, or vary in size.
- **Antialiased edges** — soft/blended pixels on outlines, the most common failure.
- **Palette bloat** — hundreds of colours where the prompt asked for a dozen.
- **Added text, borders or frames** — regenerate; these never key out cleanly. (Small hull markings
  are fine — the ship came back stencilled `SIGINT 047` and it reads as greeblies, not a caption.)

**Do not expect the key to be exactly `#FF00FF`.** The ship came back `#f803fb`, close enough to look
right and far enough that a hardcoded key left a faintly visible rectangle. `normalize-art.mjs`
samples the actual corner colour instead of trusting the brief, so any nearby magenta works.

Repair pass for an image that is close but soft, using ImageMagick:

```sh
magick in.png -resize 64x64 -filter point -colors 16 out.png     # cards, crew
magick in.png -resize 128x128 -filter point -colors 20 out.png   # enemies
```

To key out the magenta afterwards:

```sh
magick in.png -fuzz 12% -transparent '#FF00FF' out.png
```

---

## 4. Cards (35)

Card icons are centred objects, not scenes. Each one has to read at a glance at roughly 64px, so
favour a strong silhouette over fine detail.

### 4.1 Weapons — 11 · `{ACCENT}` = `#ff6f5e` · `{BG}` = `#05070e`

| Save as                          | Subject line                                                                                                                                                                                |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `cards/needle-array.png`         | 16-bit pixel art game sprite of a small cluster of thin needle emitters firing a single hair-thin dart, minimal and cheap-looking, side view facing right                                   |
| `cards/flak-burst.png`           | 16-bit pixel art game sprite of a stubby flak cannon firing a short burst of shrapnel, small bright fragments spraying forward, side view facing right                                      |
| `cards/ion-torpedo.png`          | 16-bit pixel art game sprite of a heavy ion torpedo in flight, blunt warhead and tail fins, glowing ion wash streaming behind it, side view facing right                                    |
| `cards/disruptor-cannon.png`     | 16-bit pixel art game sprite of a disruptor cannon discharging a jagged forked energy bolt, electricity arcing along the barrel housing, side view facing right                             |
| `cards/siege-cannon.png`         | 16-bit pixel art game sprite of a massive siege rail cannon: one long heavy barrel on an armoured turret mount, energy charging at the muzzle, thick recoil bracing, side view facing right |
| `cards/needle-volley.png`        | 16-bit pixel art game sprite of a rack of three slender needle missiles launching simultaneously, three thin bright tracer lines behind them, side view facing right                        |
| `cards/corrosive-flak.png`       | 16-bit pixel art game sprite of a flak shell bursting into a spray of acidic shrapnel, corrosive droplets pitting and eating into metal fragments, side view facing right                   |
| `cards/nanite-swarm.png`         | 16-bit pixel art game sprite of a dense swarm of metal-eating nanites, a cloud of tiny glinting specks over a pitted half-dissolved hull plate                                              |
| `cards/hull-cutter.png`          | 16-bit pixel art game sprite of an industrial plasma cutting torch slicing a long glowing seam through a thick hull plate, molten edge, side view facing right                              |
| `cards/siphon-beam.png`          | 16-bit pixel art game sprite of a beam emitter drawing a glowing stream of stolen energy back inward along its own beam, siphoning rather than firing, side view facing right               |
| `cards/overwhelming-barrage.png` | 16-bit pixel art game sprite of a full broadside of four heavy cannons firing at once, four simultaneous muzzle flashes, cracked and straining mount, side view facing right                |

### 4.2 Maneuvers — 14 · `{ACCENT}` = `#35e0d6` · `{BG}` = `#05070e`

| Save as                            | Subject line                                                                                                                                      |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `cards/shield-capacitor.png`       | 16-bit pixel art game sprite of a small charged capacitor cell feeding a single thin sliver of hexagonal energy shield                            |
| `cards/raise-shields.png`          | 16-bit pixel art game sprite of a hexagonal energy shield panel snapping into place, glowing lattice edges, emitter node at its base              |
| `cards/failsafe-screen.png`        | 16-bit pixel art game sprite of a single-use emergency barrier deploying from a spent canister, one bright screen, canister venting and discarded |
| `cards/emergency-shield-boost.png` | 16-bit pixel art game sprite of a shield emitter flaring at overload, layered hexagonal panels stacking outward, sparks at the emitter            |
| `cards/aegis-shield.png`           | 16-bit pixel art game sprite of a massive layered aegis barrier, three concentric hexagonal shield walls nested one inside the next               |
| `cards/emergency-nanites.png`      | 16-bit pixel art game sprite of a cracked emergency ampoule releasing a small puff of repair nanites                                              |
| `cards/hull-patch.png`             | 16-bit pixel art game sprite of a welded repair plate bolted over a hull breach, fresh glowing weld seam around its edge                          |
| `cards/nanite-repair.png`          | 16-bit pixel art game sprite of a swarm of repair nanites knitting a hull breach closed, a bright mend line sealing across torn metal             |
| `cards/full-repair-kit.png`        | 16-bit pixel art game sprite of an opened engineering repair kit, spilling tools, patch plates and glowing nanite canisters                       |
| `cards/target-scanners.png`        | 16-bit pixel art game sprite of a scanner dish sweeping a targeting reticle onto a dimmed enemy silhouette, scan arc lines                        |
| `cards/disable-targeting.png`      | 16-bit pixel art game sprite of a targeting reticle breaking apart, crosshair fragmenting into pieces and going dark                              |
| `cards/jamming-pulse.png`          | 16-bit pixel art game sprite of a broadcast dish emitting a wide distorting jamming wave, broken and scrambled signal bars                        |
| `cards/adrenaline-shot.png`        | 16-bit pixel art game sprite of a compact single-dose stimulant injector, needle and glowing vial                                                 |
| `cards/data-uplink.png`            | 16-bit pixel art game sprite of an uplink antenna streaming three distinct data packets down a beam                                               |

### 4.3 Ship systems — 10 · `{ACCENT}` = `#a98bff` · `{BG}` = `#05070e`

| Save as                         | Subject line                                                                                                                                                       |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `cards/reactor-surge.png`       | 16-bit pixel art game sprite of a reactor core pulsing with one sudden bright surge of power, containment ring around it                                           |
| `cards/backup-generator.png`    | 16-bit pixel art game sprite of a small auxiliary backup generator unit spinning up, exhaust vents and a lit indicator                                             |
| `cards/overdrive-coils.png`     | 16-bit pixel art game sprite of a pair of overdriven induction coils crackling with arcs of energy between them                                                    |
| `cards/capacitor-bank.png`      | 16-bit pixel art game sprite of a bank of four tall charged capacitors, energy building visibly between their plates                                               |
| `cards/targeting-lock.png`      | 16-bit pixel art game sprite of a fire-control computer locking on, two nested crosshairs doubling over one another                                                |
| `cards/capacitor-brace.png`     | 16-bit pixel art game sprite of a braced shield capacitor doubling its output, two stacked barrier plates and a support strut                                      |
| `cards/triage-primer.png`       | 16-bit pixel art game sprite of a medical triage primer priming a doubled repair charge, two stacked cross symbols on a canister                                   |
| `cards/gunnery-calibration.png` | 16-bit pixel art game sprite of a gunnery calibration gauge, fine adjustment dial with tick marks and a needle                                                     |
| `cards/deflector-tuning.png`    | 16-bit pixel art game sprite of a deflector tuning array, concentric shield arcs with small adjustment nodes along them                                            |
| `cards/master-gunner.png`       | 16-bit pixel art game sprite of an ornate master gunner's fire-control console, several targeting screens and a firing grip, the most elaborate console of the set |

---

## 5. Enemies (16)

`{ACCENT}` = `#ff9052` · `{BG}` = `#FF00FF` · 128×128 · **all facing left**

These appear side by side with your ship, so they must be distinguishable from one another as
silhouettes. Hull values are given to calibrate how big and armoured each should look.

### 5.1 Combat enemies — 10

| Save as                       | Hull | Subject line                                                                                                                                                 |
| ----------------------------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `enemies/interceptor.png`     | 28   | 16-bit pixel art game sprite of a needle-thin high-speed interceptor, swept wings and one oversized engine, almost no armour, side view facing left          |
| `enemies/sensor-drone.png`    | 30   | 16-bit pixel art game sprite of a small fragile sensor drone, oversized dish on a spindly frame, barely armed, side view facing left                         |
| `enemies/mine-layer.png`      | 32   | 16-bit pixel art game sprite of a bulbous mine-laying craft, external rack of spherical spiked mines, slow and ungainly, side view facing left               |
| `enemies/void-drifter.png`    | 36   | 16-bit pixel art game sprite of a derelict-looking drifting hulk running dark, scarred hull, no lights except one dim glow, side view facing left            |
| `enemies/raider-skiff.png`    | 38   | 16-bit pixel art game sprite of a fast light raider skiff, open exposed frame, jury-rigged gun bolted to the nose, side view facing left                     |
| `enemies/boarding-pod.png`    | 40   | 16-bit pixel art game sprite of a blunt armoured boarding pod, heavy breaching drill at the nose and grapple clamps, side view facing left                   |
| `enemies/plasma-skiff.png`    | 42   | 16-bit pixel art game sprite of a skiff dominated by an oversized plasma projector, glowing containment tanks flanking it, side view facing left             |
| `enemies/scavenger-drone.png` | 45   | 16-bit pixel art game sprite of a scrappy salvage drone assembled from mismatched scavenged parts, grabber claws, patchwork plating, side view facing left   |
| `enemies/gunship.png`         | 55   | 16-bit pixel art game sprite of an armoured attack gunship, blocky angular hull, twin forward-facing cannons, battle-scarred plating, side view facing left  |
| `enemies/salvage-hauler.png`  | 60   | 16-bit pixel art game sprite of a heavy slow salvage hauler, thick armour plating and cargo claws, built to endure rather than attack, side view facing left |

### 5.2 Elites — 3

Visibly a tier above the common enemies: cleaner, deadlier, more deliberate.

| Save as                      | Hull | Subject line                                                                                                                                      |
| ---------------------------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `enemies/reaper-drone.png`   | 65   | 16-bit pixel art game sprite of an aggressive reaper drone bristling with cutting blades, hunched predatory posture, side view facing left        |
| `enemies/corsair-cutter.png` | 70   | 16-bit pixel art game sprite of a sleek predatory corsair cutter, blade-like prow and boarding rams, elegant and lethal, side view facing left    |
| `enemies/void-sentinel.png`  | 85   | 16-bit pixel art game sprite of a monolithic sentinel construct, ancient and geometric, heavy shield emitters on each face, side view facing left |

### 5.3 Bosses — 3

One per act, escalating. These should feel like a different category of thing, not a bigger ship.

| Save as                        | Hull | Subject line                                                                                                                                                                                              |
| ------------------------------ | ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `enemies/void-reaver.png`      | 120  | 16-bit pixel art game sprite of a large predatory raider flagship, trophy hull plates from destroyed ships welded to its flanks, brutal and improvised, side view facing left                             |
| `enemies/dreadnought-core.png` | 190  | 16-bit pixel art game sprite of an immense dreadnought's exposed reactor core, concentric layered armour rings peeled open around a burning heart, industrial and vast, side view facing left             |
| `enemies/the-harbinger.png`    | 260  | 16-bit pixel art game sprite of a vast geometric void entity, silhouette subtly wrong and hard to resolve, starlight bending and rearranging around its edges, no engines and no hull plating, not a ship |

> **The Harbinger** is the Act 3 boss and the thing the whole crew story is about — the dialogues
> describe it as a census that counts every ship that hears it, and "an appetite, structured". It
> should read as something the setting has no vocabulary for. Resist making it a spaceship.

---

## 6. Crew (6)

`{ACCENT}` = `#ecc879` · `{BG}` = `#FF00FF` · 64×64 · **bust portraits, three-quarter view facing
left**, shoulders up, framed to sit inside a circular mask.

| Save as                   | Subject line                                                                                                                                                                                                                |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `crew/jax-korrin.png`     | 16-bit pixel art bust portrait of a grizzled veteran gunnery sergeant, scarred face, military crew cut, worn fleet jacket with the insignia stripped off, gun sling over one shoulder, three-quarter view facing left       |
| `crew/dr-elara-voss.png`  | 16-bit pixel art bust portrait of a composed trauma surgeon, hair tied back, surgical scrubs under a worn field coat, tired steady eyes, three-quarter view facing left                                                     |
| `crew/torque.png`         | 16-bit pixel art bust portrait of a squat refurbished mining automaton: boxy riveted metal chassis, one large glowing optical sensor, mismatched welded repair plates, faded hazard stripes, three-quarter view facing left |
| `crew/sable-nyx.png`      | 16-bit pixel art bust portrait of a sharp confident smuggler pilot, dark undercut hair, worn flight jacket, pilot's headset around the neck, half-smirking, three-quarter view facing left                                  |
| `crew/whisper.png`        | 16-bit pixel art bust portrait of a gaunt hollow-eyed signals analyst, oversized headphones never taken off, thousand-yard stare, threadbare uniform, three-quarter view facing left                                        |
| `crew/brother-anchor.png` | 16-bit pixel art bust portrait of a serene robed monastic void navigator, deep hood shadowing a weathered aged face, brass astrolabe held at the chest, three-quarter view facing left                                      |

> **Torque is a robot**, not a person — a refurbished mining automaton that became self-aware. Do not
> let the generator make it a human mechanic.

> The crew are survivors of a disaster at the Vellborn Reach, not clean military portraits. Worn,
> weathered, lived-in. Five humans and one machine — keep them clearly distinct from each other,
> since they appear side by side in the roster.

---

## 7. Player ship (1)

`{ACCENT}` = `#35e0d6` · `{BG}` = `#FF00FF` · 128×72 · **facing right**

| Save as         | Subject line                                                                                                                                                                                                                                                                          |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ship/hero.png` | 16-bit pixel art game sprite of a mid-sized salvage vessel seen from the side facing right: blunt utilitarian hull, patched and welded plating in mismatched shades, twin rear engine ports glowing, a sensor dish on a short mast, cockpit wedge at the bow, one small running light |

> This is the player's ship and the most-seen asset in the game — it appears on the title screen, the
> loadout screen and in every fight. It is a working salvage vessel, not a warship: scavenged,
> repaired many times, and still flying.

---

## 8. Checklist

- [ ] 11 weapon cards
- [ ] 14 maneuver cards
- [ ] 10 ship-system cards
- [ ] 10 combat enemies
- [ ] 3 elites
- [ ] 3 bosses
- [ ] 6 crew portraits
- [ ] 1 player ship

**58 total.** Filenames exactly as listed — they are the ids the game looks up.
