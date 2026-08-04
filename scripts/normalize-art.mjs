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
  ship: { w: 512, h: 288, key: true, fit: true },
  // `scale`: shrink to fit the box, keep the aspect, touch nothing else. Card art is
  // drawn on its own near-black background rather than a key, so there is nothing to
  // lift and nothing to crop to — and the generator returned four different aspect
  // ratios, so a fixed box would distort most of them. CSS contains the result.
  cards: { w: 192, h: 192, scale: true },
  // `fit`: crop away the transparent margin, then scale to fit the box. The generator
  // framed every subject differently and returned three different aspect ratios, so the
  // framing carries no usable information — and the leftover padding is what stops CSS
  // from standing two combatants on the same floor. See fitWithin.
  enemies: { w: 256, h: 256, key: true, fit: true },
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

  /*
   * How close to the background counts as background.
   *
   * The key is never a perfectly flat colour — these masters carry compression noise
   * across it, so a straight ratio leaves every background pixel a few percent opaque.
   * That is invisible per pixel and ruinous in aggregate: a faint haze over the whole
   * frame, and a content box the size of the entire canvas rather than the subject.
   */
  const TOLERANCE = 0.12;

  const out = Buffer.alloc(w * h * 4);
  for (let i = 0, o = 0; o < out.length; i += ch, o += 4) {
    const p = { r: data[i], g: data[i + 1], b: data[i + 2] };
    const t = spillOf(p) / bgSpill;
    const a = Math.max(0, Math.min(255, Math.round(255 * (1 - t / (1 - TOLERANCE)))));
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

/**
 * Tightest box containing the subject.
 *
 * A row counts as content only if several pixels in it survive the key, not one. The
 * masters carry sparse specks of noise well outside the subject; a single stray pixel
 * would stretch the box to the full canvas, and since those specks then average away on
 * downscale the result is an image padded with transparency that nothing can be aligned
 * against. `minRun` is a handful of pixels at master resolution, far below the width of
 * any real detail like an antenna or a thruster plume.
 */
function contentBox(img, { alpha = 24, minRun = 3 } = {}) {
  const { w, h, data } = img;
  const rows = new Uint32Array(h);
  const cols = new Uint32Array(w);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3] <= alpha) continue;
      rows[y]++;
      cols[x]++;
    }
  }
  const span = (counts) => {
    let lo = -1;
    let hi = -1;
    for (let i = 0; i < counts.length; i++) {
      if (counts[i] < minRun) continue;
      if (lo < 0) lo = i;
      hi = i;
    }
    return [lo, hi];
  };
  const [y0, y1] = span(rows);
  const [x0, x1] = span(cols);
  if (x1 < 0 || y1 < 0) throw new Error('no subject found after keying');
  return { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

function crop(img, box) {
  const out = Buffer.alloc(box.w * box.h * 4);
  for (let y = 0; y < box.h; y++) {
    const from = ((box.y + y) * img.w + box.x) * 4;
    img.data.copy(out, y * box.w * 4, from, from + box.w * 4);
  }
  return { w: box.w, h: box.h, ch: 4, data: out };
}

/**
 * Scales to fit inside the box without distortion and **without padding** — the file
 * ends up exactly as big as the artwork.
 *
 * Padding is deliberately not added back. Every generated image frames its subject
 * differently, so letterboxing to a fixed box leaves a different amount of empty space
 * under each one (13% below the ship, 35% below the interceptor). CSS can only align the
 * boxes, so the artwork inside them ends up at visibly different heights. Cropping to
 * content makes the image and the artwork the same thing, and then bottom-aligning the
 * boxes really does stand both combatants on one floor.
 */
function fitWithin(img, tw, th) {
  const scale = Math.min(tw / img.w, th / img.h, 1);
  const iw = Math.max(1, Math.round(img.w * scale));
  const ih = Math.max(1, Math.round(img.h * scale));
  // Premultiplying is only meaningful — and only safe to index — with an alpha channel.
  // Card art arrives as opaque RGB and would be read four bytes at a time out of a
  // three-byte-per-pixel buffer, which corrupts every colour in the image.
  if (img.ch !== 4) return resize(img, iw, ih);
  return unpremultiply(resize(premultiply(img), iw, ih));
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

    // `fit` output is content-sized, so it never equals the box exactly; "already
    // within the box" is what idempotency means for those.
    const boxed = target.fit || target.scale;
    const normalised = boxed
      ? img.w <= target.w && img.h <= target.h
      : img.w === target.w && img.h === target.h;
    if (normalised) {
      console.log(`  skip  ${file} (already ${img.w}x${img.h})`);
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
    // into the target without a word. Better to stop and let a human decide — unless
    // the category letterboxes, which handles any input shape by construction.
    const srcAspect = img.w / img.h;
    const dstAspect = target.w / target.h;
    if (!boxed && Math.abs(srcAspect - dstAspect) / dstAspect > 0.02) {
      console.log(
        `  SKIP  ${file} — aspect ${srcAspect.toFixed(2)} does not match target ${dstAspect.toFixed(2)}; ` +
          `resizing would distort it. Regenerate at ${target.w}x${target.h}, or change TARGETS.`,
      );
      continue;
    }

    const from = `${img.w}x${img.h}`;
    if (target.scale) {
      img = fitWithin(img, target.w, target.h);
    } else if (target.fit) {
      const keyed = unkey(img);
      img = fitWithin(crop(keyed, contentBox(keyed)), target.w, target.h);
    } else if (target.key) {
      img = unpremultiply(resize(premultiply(unkey(img)), target.w, target.h));
    } else {
      img = resize(img, target.w, target.h);
    }

    const out = encode(img);
    if (!dry) fs.writeFileSync(file, out);
    before += src.length;
    after += out.length;
    done++;
    console.log(
      `  ${dry ? 'would' : 'wrote'} ${file.padEnd(38)} ${from} ${kb(src.length)} -> ${img.w}x${img.h} ${kb(out.length)}${target.key ? ' (keyed)' : ''}`,
    );
  }
}

console.log(
  done
    ? `\n${done} asset(s): ${kb(before)} -> ${kb(after)} (${(before / after).toFixed(0)}x smaller)`
    : '\nnothing to do — all assets already normalised',
);
