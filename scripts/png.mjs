import zlib from 'node:zlib';

/**
 * Minimal PNG decode/encode/resize for 8-bit RGB and RGBA, non-interlaced.
 *
 * Hand-rolled rather than pulling in sharp or pngjs: this runs on generated art before
 * it is committed, never at build or run time, so a dependency the app does not need is
 * a poor trade for ~120 lines of well-understood format handling.
 */
export function decode(buf) {
  const w = buf.readUInt32BE(16);
  const h = buf.readUInt32BE(20);
  const depth = buf[24];
  const type = buf[25];
  if (depth !== 8 || (type !== 2 && type !== 6)) {
    throw new Error(`unsupported PNG: bit depth ${depth}, colour type ${type}`);
  }
  if (buf[28]) throw new Error('interlaced PNG unsupported');
  const ch = type === 6 ? 4 : 3;

  const idat = [];
  let p = 8;
  while (p < buf.length) {
    const len = buf.readUInt32BE(p);
    const tag = buf.toString('ascii', p + 4, p + 8);
    if (tag === 'IDAT') idat.push(buf.subarray(p + 8, p + 8 + len));
    if (tag === 'IEND') break;
    p += 12 + len;
  }

  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = w * ch;
  const out = Buffer.alloc(w * h * ch);
  let pos = 0;
  for (let y = 0; y < h; y++) {
    const filter = raw[pos++];
    const line = raw.subarray(pos, pos + stride);
    pos += stride;
    const cur = out.subarray(y * stride, (y + 1) * stride);
    const prev = y ? out.subarray((y - 1) * stride, y * stride) : null;
    for (let i = 0; i < stride; i++) {
      const a = i >= ch ? cur[i - ch] : 0;
      const b = prev ? prev[i] : 0;
      const c = prev && i >= ch ? prev[i - ch] : 0;
      let v = line[i];
      if (filter === 1) v += a;
      else if (filter === 2) v += b;
      else if (filter === 3) v += (a + b) >> 1;
      else if (filter === 4) {
        const pp = a + b - c;
        const pa = Math.abs(pp - a);
        const pb = Math.abs(pp - b);
        const pc = Math.abs(pp - c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      cur[i] = v & 0xff;
    }
  }
  return { w, h, ch, data: out };
}

const crc32 = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return (bytes) => {
    let c = -1;
    for (const b of bytes) c = table[(c ^ b) & 0xff] ^ (c >>> 8);
    return (c ^ -1) >>> 0;
  };
})();

function chunk(tag, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(tag, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

export function encode({ w, h, ch, data }) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = ch === 4 ? 6 : 2;
  const stride = w * ch;
  const raw = Buffer.alloc((stride + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (stride + 1)] = 0; // filter: None
    data.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/**
 * Area-averaged downscale. The right filter for the detailed illustration the generator
 * returns — nearest-neighbour would drop most source pixels and alias badly. True chunky
 * sprites authored at their display size would want the opposite.
 */
export function resize(img, tw, th) {
  const { w, h, ch, data } = img;
  const out = Buffer.alloc(tw * th * ch);
  const sx = w / tw;
  const sy = h / th;
  for (let y = 0; y < th; y++) {
    const y0 = Math.floor(y * sy);
    const y1 = Math.min(h, Math.ceil((y + 1) * sy));
    for (let x = 0; x < tw; x++) {
      const x0 = Math.floor(x * sx);
      const x1 = Math.min(w, Math.ceil((x + 1) * sx));
      const acc = new Array(ch).fill(0);
      let n = 0;
      for (let yy = y0; yy < y1; yy++) {
        for (let xx = x0; xx < x1; xx++) {
          const i = (yy * w + xx) * ch;
          for (let c = 0; c < ch; c++) acc[c] += data[i + c];
          n++;
        }
      }
      const o = (y * tw + x) * ch;
      for (let c = 0; c < ch; c++) out[o + c] = Math.round(acc[c] / n);
    }
  }
  return { w: tw, h: th, ch, data: out };
}
