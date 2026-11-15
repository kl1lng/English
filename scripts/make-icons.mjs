// Draws the app icon (a compass on navy) as PNG files, with no dependencies.
// Usage: node scripts/make-icons.mjs   -> public/icons/icon-192.png and icon-512.png
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const NAVY = [0x15, 0x2a, 0x41];
const PAPER = [0xf5, 0xf8, 0xfc];
const ORANGE = [0xf6, 0x9a, 0x62];

// Colour of the icon at (x, y) in a 512 x 512 design space, or null for transparent.
function sample(x, y) {
  // rounded square, radius 96
  const r = 96;
  const cx = Math.min(Math.max(x, r), 512 - r);
  const cy = Math.min(Math.max(y, r), 512 - r);
  if ((x - cx) ** 2 + (y - cy) ** 2 > r * r) return null;
  // needle (rotated 45 degrees around the centre): orange half on top, paper half below
  const dx = x - 256;
  const dy = y - 256;
  const a = Math.PI / 4;
  const u = dx * Math.cos(a) + dy * Math.sin(a); // across the needle
  const v = -dx * Math.sin(a) + dy * Math.cos(a); // along the needle (negative = tip up)
  const half = 34 * (1 - Math.abs(v) / 118);
  if (Math.abs(v) <= 118 && Math.abs(u) <= half) return v < 0 ? ORANGE : PAPER;
  if (dx * dx + dy * dy <= 12 * 12) return NAVY;
  // ring, centre radius 150, thickness 28
  const d = Math.sqrt(dx * dx + dy * dy);
  if (Math.abs(d - 150) <= 14) return PAPER;
  return NAVY;
}

function png(size) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  const scale = 512 / size;
  for (let py = 0; py < size; py++) {
    raw[py * (size * 4 + 1)] = 0; // filter type none
    for (let px = 0; px < size; px++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < 2; sy++)
        for (let sx = 0; sx < 2; sx++) {
          const c = sample((px + (sx + 0.5) / 2) * scale, (py + (sy + 0.5) / 2) * scale);
          if (c) {
            r += c[0]; g += c[1]; b += c[2]; a += 1;
          }
        }
      const o = py * (size * 4 + 1) + 1 + px * 4;
      raw[o] = a ? Math.round(r / a) : 0;
      raw[o + 1] = a ? Math.round(g / a) : 0;
      raw[o + 2] = a ? Math.round(b / a) : 0;
      raw[o + 3] = Math.round((a / 4) * 255);
    }
  }
  const crcTable = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  const crc = (buf) => {
    let c = 0xffffffff;
    for (const byte of buf) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const chunk = (type, data) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type), data]);
    const sum = Buffer.alloc(4);
    sum.writeUInt32BE(crc(body));
    return Buffer.concat([len, body, sum]);
  };
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8; // bit depth
  header[9] = 6; // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", header),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const dir = path.resolve(import.meta.dirname, "../public/icons");
fs.mkdirSync(dir, { recursive: true });
for (const size of [192, 512]) {
  fs.writeFileSync(path.join(dir, `icon-${size}.png`), png(size));
  console.log(`icon-${size}.png written`);
}
