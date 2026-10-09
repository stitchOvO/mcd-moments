/**
 * Generate the extension icons (brand-yellow rounded square + red dot) as PNGs.
 * Run once:  node scripts/gen-icons.mjs
 * Output: src/assets/icon{16,48,128}.png
 */

import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = join(ROOT, 'src/assets');

const YELLOW = [255, 195, 0];
const RED = [218, 41, 28];

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i += 1) {
    c ^= buf[i];
    for (let k = 0; k < 8; k += 1) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crc]);
}

function pixel(size) {
  const r = size * 0.30;
  const corner = size * 0.22;
  const cx = size / 2;
  const cy = size / 2;
  return (x, y) => {
    // rounded corners -> transparent
    const dx = Math.min(x, size - 1 - x);
    const dy = Math.min(y, size - 1 - y);
    if (dx < corner && dy < corner) {
      const ddx = corner - dx;
      const ddy = corner - dy;
      if (ddx * ddx + ddy * ddy > corner * corner) return [0, 0, 0, 0];
    }
    const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
    const color = d <= r ? RED : YELLOW;
    return [color[0], color[1], color[2], 255];
  };
}

function makePng(size) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  const fn = pixel(size);
  let o = 0;
  for (let y = 0; y < size; y += 1) {
    raw[o] = 0; // filter: none
    o += 1;
    for (let x = 0; x < size; x += 1) {
      const [r, g, b, a] = fn(x, y);
      raw[o] = r; raw[o + 1] = g; raw[o + 2] = b; raw[o + 3] = a;
      o += 4;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // color type RGBA
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([signature, chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

mkdirSync(OUT_DIR, { recursive: true });
for (const size of [16, 48, 128]) {
  const file = join(OUT_DIR, `icon${size}.png`);
  writeFileSync(file, makePng(size));
  console.log(`✓ ${file}`);
}
