/**
 * Normalises generated art into shippable game assets.
 *
 *   node scripts/normalize-art.mjs [--dry]
 *
 * Generators return ~1500px images: fine as masters, absurd for a browser game whose
 * whole JS bundle is ~370 kB. This downscales each asset to the size it is actually
 * displayed at, and lifts the magenta key where the brief asked for one.
 *
 * Already-normalised files are skipped, so it is safe to re-run as new art lands.
 * Keep your masters somewhere outside src/ — this rewrites in place.
 */
import fs from 'node:fs';
import path from 'node:path';
import { decode, encode, resize } from './png.mjs';

/**
 * Target size per category, and whether the background is a magenta key.
 *
 * Aspect ratios match where each asset is displayed, and must match what the generator
 * actually returns — squashing 16:9 art into a square silently distorts every sprite.
 * Cards are 16:9 because `.card__viewport` is (Card.css), and the ship is 16:9 because
 * the hero stage is.
 */
const TARGETS = {
  crew: { w: 192, h: 192, key: false },
  ship: { w: 512, h: 288, key: true },
  enemies: { w: 256, h: 256, key: true },
  cards: { w: 192, h: 108, key: false },
};

/** Masters are irreplaceable; this rewrites in place, so never process an unsaved one. */
const MASTERS = 'art-masters';

/**
 * Lifts a magenta background to alpha.
 *
 * `min(R,B) - G` is near its maximum on magenta and at or below zero on everything in
 * this game's palette — olive hull, cyan glow, near-black outlines — so it separates
 * subject from background without a hand-tuned threshold.
 *
 * The reference is sampled from the corners rather than assumed to be #FF00FF, because
 * generators do not return the exact colour asked for: this ship came back #f803fb, and
 * against a hardcoded key that left every background pixel ~4% opaque — a faint but
 * clearly visible rectangle once composited on the near-black page.
 *
 * Edge pixels come out part-transparent and are un-matted (recovering the original from
 * `observed = a*fg + (1-a)*bg`), so no magenta fringe survives the downscale.
 */
function unkey(img) {
  const { w, h, ch, data } = img;
  const at = (x, y) => {
    const i = (y * w + x) * ch;
    return { r: data[i], g: data[i + 1], b: data[i + 2] };
  };
  const spillOf = (p) => Math.min(p.r, p.b) - p.g;

  // Corners are background by construction; take the median so one stray corner
  // (a thruster plume bleeding to the edge) cannot skew the calibration.
  const corners = [at(1, 1), at(w - 2, 1), at(1, h - 2), at(w - 2, h - 2)];
  const mid = (k) => [...corners].sort((x, y) => x[k] - y[k])[1][k];
  const bg = { r: mid('r'), g: mid('g'), b: mid('b') };
  const bgSpill = spillOf(bg);
  if (bgSpill < 100) throw new Error(`background ${JSON.stringify(bg)} is not a magenta key`);

  const out = Buffer.alloc(w * h * 4);
  for (let i = 0, o = 0; o < out.length; i += ch, o += 4) {
    const p = { r: data[i], g: data[i + 1], b: data[i + 2] };
    const a = Math.max(0, Math.min(255, Math.round(255 * (1 - spillOf(p) / bgSpill))));
    if (a === 0) {
      out[o] = out[o + 1] = out[o + 2] = out[o + 3] = 0;
      continue;
    }
    const f = a / 255;
    const un = (v, back) => Math.max(0, Math.min(255, Math.round((v - (1 - f) * back) / f)));
    out[o] = un(p.r, bg.r);
    out[o + 1] = un(p.g, bg.g);
    out[o + 2] = un(p.b, bg.b);
    out[o + 3] = ch === 4 ? Math.min(a, data[i + 3]) : a;
  }
  return { w, h, ch: 4, data: out };
}

/** Averaging RGBA must happen in premultiplied space, or transparent pixels tint the edges. */
const premultiply = (img) => {
  const d = Buffer.from(img.data);
  for (let i = 0; i < d.length; i += 4) {
    const a = d[i + 3] / 255;
    d[i] *= a;
    d[i + 1] *= a;
    d[i + 2] *= a;
  }
  return { ...img, data: d };
};

const unpremultiply = (img) => {
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const a = d[i + 3] / 255;
    if (a === 0) continue;
    d[i] = Math.min(255, Math.round(d[i] / a));
    d[i + 1] = Math.min(255, Math.round(d[i + 1] / a));
    d[i + 2] = Math.min(255, Math.round(d[i + 2] / a));
  }
  return img;
};

const dry = process.argv.includes('--dry');
const kb = (n) => (n / 1024).toFixed(0) + 'kB';
let before = 0;
let after = 0;
let done = 0;

for (const [dir, target] of Object.entries(TARGETS)) {
  const folder = path.join('src/assets', dir);
  if (!fs.existsSync(folder)) continue;

  for (const name of fs.readdirSync(folder).sort()) {
    if (!name.endsWith('.png')) continue;
    const file = path.join(folder, name);
    const src = fs.readFileSync(file);
    let img = decode(src);

    if (img.w === target.w && img.h === target.h) {
      console.log(`  skip  ${file} (already ${target.w}x${target.h})`);
      continue;
    }

    // Copy the master aside BEFORE touching the file. Downscaling is lossy and this
    // writes in place, so without this a wrong target size destroys the original.
    const masterDir = path.join(MASTERS, dir);
    const master = path.join(masterDir, name);
    if (!fs.existsSync(master) && !dry) {
      fs.mkdirSync(masterDir, { recursive: true });
      fs.copyFileSync(file, master);
    }

    // A generator that ignores the requested aspect ratio would otherwise be squashed
    // into the target without a word. Better to stop and let a human decide.
    const srcAspect = img.w / img.h;
    const dstAspect = target.w / target.h;
    if (Math.abs(srcAspect - dstAspect) / dstAspect > 0.02) {
      console.log(
        `  SKIP  ${file} — aspect ${srcAspect.toFixed(2)} does not match target ${dstAspect.toFixed(2)}; ` +
          `resizing would distort it. Regenerate at ${target.w}x${target.h}, or change TARGETS.`,
      );
      continue;
    }

    const from = `${img.w}x${img.h}`;
    if (target.key) img = unpremultiply(resize(premultiply(unkey(img)), target.w, target.h));
    else img = resize(img, target.w, target.h);

    const out = encode(img);
    if (!dry) fs.writeFileSync(file, out);
    before += src.length;
    after += out.length;
    done++;
    console.log(
      `  ${dry ? 'would' : 'wrote'} ${file.padEnd(38)} ${from} ${kb(src.length)} -> ${target.w}x${target.h} ${kb(out.length)}${target.key ? ' (keyed)' : ''}`,
    );
  }
}

console.log(
  done
    ? `\n${done} asset(s): ${kb(before)} -> ${kb(after)} (${(before / after).toFixed(0)}x smaller)`
    : '\nnothing to do — all assets already normalised',
);
