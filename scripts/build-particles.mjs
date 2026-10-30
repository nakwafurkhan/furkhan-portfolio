// Builds public/particles.bin (face → globe → India point clouds) and public/noise.png.
// Run with `npm run particles`. Inputs: assets/portrait.jpg (gitignored), world-atlas (globe),
// scripts/data/india-official.geojson (India outline per India's official boundaries,
// extracted from Natural Earth's India point-of-view countries file).
//
// particles.bin layout (little-endian):
//   0  char[4]  "PTCL"
//   4  uint32   count
//   8  float32  scale        (int16 * scale = world units)
//   12 per point, 20 bytes:
//        int16 x3  face
//        int16 x3  globe
//        int16 x3  india
//        uint8     luma      (face brightness, 0–255)
//        uint8     pin       (255 near Udupi, else 0)

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { feature } from "topojson-client";
import { geoContains } from "d3-geo";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = (await import("node:module")).createRequire(import.meta.url);

const COUNT = 20000;
const SCALE = 1 / 8000; // int16 range covers ±4 world units
const PORTRAIT = path.join(root, "assets/portrait.jpg");
const UDUPI = [74.7421, 13.3409]; // lon, lat
const INDIA_GEOJSON = path.join(root, "scripts/data/india-official.geojson");

// Seeded PRNG so rebuilds are stable and diffs stay small.
let seed = 1337;
const rand = () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const jitter = (a) => (rand() - 0.5) * a;

// --- Face -------------------------------------------------------------------

async function buildFace() {
  if (!fs.existsSync(PORTRAIT)) {
    console.warn("assets/portrait.jpg missing, using a placeholder sphere for the face");
    return Array.from({ length: COUNT }, () => {
      const u = rand() * 2 - 1;
      const t = rand() * Math.PI * 2;
      const r = Math.sqrt(1 - u * u) * 0.8;
      return { x: r * Math.cos(t), y: u * 0.8, z: r * Math.sin(t), luma: 0.6 };
    });
  }

  // Crop to head and shoulders; window frames and the chair sit outside this box.
  const meta = await sharp(PORTRAIT).metadata();
  const crop = {
    left: Math.round(meta.width * 0.29),
    top: 0,
    width: Math.round(meta.width * 0.44),
    height: Math.round(meta.height * 0.86),
  };
  const W = 200;
  const { data, info } = await sharp(PORTRAIT)
    .extract(crop)
    .resize({ width: W })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const H = info.height;

  const luma = new Float32Array(W * H);
  const bgLike = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) {
    const r = data[i * 3] / 255, g = data[i * 3 + 1] / 255, b = data[i * 3 + 2] / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    luma[i] = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    // Pale, unsaturated pixels = the white wall.
    bgLike[i] = luma[i] > 0.68 && max - min < 0.09 ? 1 : 0;
  }

  // Flood-fill the wall from the image edges so bright skin inside the head stays.
  const bg = new Uint8Array(W * H);
  const stack = [];
  for (let x = 0; x < W; x++) stack.push(x, (H - 1) * W + x);
  for (let y = 0; y < H; y++) stack.push(y * W, y * W + W - 1);
  while (stack.length) {
    const i = stack.pop();
    if (bg[i] || !bgLike[i]) continue;
    bg[i] = 1;
    const x = i % W, y = (i / W) | 0;
    if (x > 0) stack.push(i - 1);
    if (x < W - 1) stack.push(i + 1);
    if (y > 0) stack.push(i - W);
    if (y < H - 1) stack.push(i + W);
  }

  // Stretch foreground contrast (2nd–98th percentile) so features separate.
  const fg = [];
  for (let i = 0; i < W * H; i++) if (!bg[i]) fg.push(luma[i]);
  fg.sort((a, b) => a - b);
  const lo = fg[Math.floor(fg.length * 0.02)], hi = fg[Math.floor(fg.length * 0.98)];
  for (let i = 0; i < W * H; i++) luma[i] = Math.min(1, Math.max(0, (luma[i] - lo) / (hi - lo)));

  // Stipple: point density follows brightness, so lit skin is dense and eyes,
  // brows and beard stay sparse. The bottom fades so shoulders dissolve.
  const cells = [], cumulative = [];
  let total = 0;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (bg[i]) continue;
      const fade = y / H > 0.72 ? Math.max(0, 1 - (y / H - 0.72) / 0.28) : 1;
      total += (0.06 + Math.pow(luma[i], 1.8)) * fade;
      cells.push(i);
      cumulative.push(total);
    }
  }
  const sampleCell = () => {
    const r = rand() * total;
    let a = 0, b = cumulative.length - 1;
    while (a < b) {
      const m = (a + b) >> 1;
      if (cumulative[m] < r) a = m + 1;
      else b = m;
    }
    return cells[a];
  };

  // Head roundness: an ellipsoid bulge centred on the face, plus brightness relief.
  const cx = W * 0.5, cy = H * 0.42, rx = W * 0.32, ry = H * 0.42;
  const unit = 1.7 / H; // face ~1.7 world units tall
  return Array.from({ length: COUNT }, () => {
    const i = sampleCell();
    const px = (i % W) + rand(), py = ((i / W) | 0) + rand();
    const dx = (px - cx) / rx, dy = (py - cy) / ry;
    const bulge = Math.sqrt(Math.max(0, 1 - dx * dx - dy * dy)) * 0.32;
    const l = luma[i];
    return {
      x: (px - W / 2) * unit,
      y: -(py - H / 2) * unit,
      z: bulge + (l - 0.5) * 0.12 + jitter(0.02),
      // Hair and shirt are near-black; keep a floor so the silhouette still reads.
      luma: 0.22 + 0.78 * Math.pow(l, 0.9),
    };
  });
}

// --- Globe ------------------------------------------------------------------

function buildGlobe(land) {
  const R = 0.85;
  const lon0 = UDUPI[0] * (Math.PI / 180); // India faces the camera
  const toXYZ = (lon, lat) => {
    const l = lon * (Math.PI / 180) - lon0, p = lat * (Math.PI / 180);
    return { x: R * Math.cos(p) * Math.sin(l), y: R * Math.sin(p), z: R * Math.cos(p) * Math.cos(l) };
  };

  // Fibonacci sphere candidates; ~94% land, ~6% sparse ocean for the silhouette.
  const M = 90000;
  const landPts = [], ocean = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let k = 0; k < M; k++) {
    const yy = 1 - (2 * (k + 0.5)) / M;
    const lat = Math.asin(yy) * (180 / Math.PI);
    const lon = ((((k * golden) % (2 * Math.PI)) * 180) / Math.PI) - 180;
    (geoContains(land, [lon, lat]) ? landPts : ocean).push([lon, lat]);
  }
  const pick = (arr, n) => Array.from({ length: n }, () => arr[(rand() * arr.length) | 0]);
  const nLand = Math.round(COUNT * 0.94);
  return [...pick(landPts, nLand), ...pick(ocean, COUNT - nLand)].map(([lon, lat]) => {
    const p = toXYZ(lon + jitter(0.4), lat + jitter(0.4));
    return { ...p, lon, lat };
  });
}

// --- India ------------------------------------------------------------------

function buildIndia(india) {
  const [[minLon, minLat], [maxLon, maxLat]] = [[68, 6], [98, 37.5]];
  const lat0 = 22 * (Math.PI / 180);
  const pts = [];
  while (pts.length < COUNT) {
    const lon = minLon + rand() * (maxLon - minLon);
    const lat = minLat + rand() * (maxLat - minLat);
    if (geoContains(india, [lon, lat])) pts.push([lon, lat]);
  }
  // Equirectangular with cos(lat0) correction, fitted to ~1.9 world units tall.
  const h = maxLat - minLat;
  const s = 1.9 / h;
  const cLon = (minLon + maxLon) / 2, cLat = (minLat + maxLat) / 2;
  return pts.map(([lon, lat]) => ({
    x: (lon - cLon) * Math.cos(lat0) * s,
    y: (lat - cLat) * s,
    z: jitter(0.05),
    lon,
    lat,
  }));
}

// --- Pairing + write --------------------------------------------------------

// Sort each cloud top-to-bottom (with noise) so particle i lands in a similar
// vertical band in every shape; morphs then sweep instead of scrambling.
const bandSort = (pts) =>
  pts.map((p) => ({ p, k: -p.y + jitter(0.35) })).sort((a, b) => a.k - b.k).map((e) => e.p);

function write(face, globe, india) {
  const buf = Buffer.alloc(12 + COUNT * 20);
  buf.write("PTCL", 0, "ascii");
  buf.writeUInt32LE(COUNT, 4);
  buf.writeFloatLE(SCALE, 8);
  const q = (v) => Math.max(-32768, Math.min(32767, Math.round(v / SCALE)));
  let pinned = 0;
  for (let i = 0; i < COUNT; i++) {
    const o = 12 + i * 20;
    for (const [j, p] of [face[i], globe[i], india[i]].entries()) {
      buf.writeInt16LE(q(p.x), o + j * 6);
      buf.writeInt16LE(q(p.y), o + j * 6 + 2);
      buf.writeInt16LE(q(p.z), o + j * 6 + 4);
    }
    buf.writeUInt8(Math.round(face[i].luma * 255), o + 18);
    const d = Math.hypot(india[i].lon - UDUPI[0], india[i].lat - UDUPI[1]);
    const pin = d < 0.8 ? 255 : 0;
    if (pin) pinned++;
    buf.writeUInt8(pin, o + 19);
  }
  fs.mkdirSync(path.join(root, "public"), { recursive: true });
  fs.writeFileSync(path.join(root, "public/particles.bin"), buf);
  return { bytes: buf.length, pinned };
}

async function writeNoise() {
  const S = 256;
  const px = Buffer.alloc(S * S);
  for (let i = 0; i < px.length; i++) px[i] = (rand() * 255) | 0;
  await sharp(px, { raw: { width: S, height: S, channels: 1 } })
    .png()
    .toFile(path.join(root, "public/noise.png"));
}

const bounds = (pts) =>
  ["x", "y", "z"]
    .map((k) => `${k}[${Math.min(...pts.map((p) => p[k])).toFixed(2)}, ${Math.max(...pts.map((p) => p[k])).toFixed(2)}]`)
    .join(" ");

const land110 = require("world-atlas/land-110m.json");
const land = feature(land110, land110.objects.land);
// world-atlas draws de facto borders; India's map must use India's official boundary.
const india = JSON.parse(fs.readFileSync(INDIA_GEOJSON, "utf8"));

const face = bandSort(await buildFace());
const globe = bandSort(buildGlobe(land));
const indiaPts = bandSort(buildIndia(india));
const { bytes, pinned } = write(face, globe, indiaPts);
await writeNoise();

console.log(`particles.bin: ${COUNT} points, ${(bytes / 1024).toFixed(0)} KB, ${pinned} pinned at Udupi`);
console.log(`  face  ${bounds(face)}`);
console.log(`  globe ${bounds(globe)}`);
console.log(`  india ${bounds(indiaPts)}`);
console.log("noise.png: 256x256");
