/**
 * Turns the raw ChatGPT reference renders in `../uploads` into trimmed,
 * transparent PNGs under `src/assets/img`. Run with:  npm run assets
 *
 * Background removal is a flood-fill of near-white pixels seeded from the image
 * borders, so interior highlights (silver studs, metal parts) survive where a
 * global white threshold would erode them. The result is trimmed to content and
 * resized. Idempotent: re-running overwrites the outputs.
 */
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const uploads = join(root, '..', 'uploads');
const img = join(root, 'src', 'assets', 'img');

/** Near-white RGB cutoff treated as background. */
const WHITE = 243;

/** src is relative to ../uploads, out relative to src/assets/img. */
const MANIFEST = [
  { src: 'ChatGPT Image 27 июл. 2026 г., 14_06_24.png', out: 'machines/studding.png', width: 512 },
  { src: 'ChatGPT Image 27 июл. 2026 г., 14_07_54.png', out: 'machines/studcheck.png', width: 512 },
  { src: 'ChatGPT Image 27 июл. 2026 г., 14_09_40.png', out: 'machines/rest-rack.png', width: 512 },
  { src: 'ChatGPT Image 27 июл. 2026 г., 14_12_03.png', out: 'tire/stud-macro.png', width: 360 },
  { src: 'ChatGPT Image 27 июл. 2026 г., 14_26_59.png', out: 'tire/cutaway-studded.png', width: 640 },
  { src: 'ChatGPT Image 27 июл. 2026 г., 17_00_31.png', out: 'tire/exploded-studded.png', width: 640 },
  { src: 'ChatGPT Image 27 июл. 2026 г., 14_28_21.png', out: 'tire/finished-studded.png', width: 480 },
];

/** Removes the border-connected white background, returns a raw RGBA buffer. */
async function cutout(srcPath) {
  const { data, info } = await sharp(srcPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  const near = (p) => data[p * 4] >= WHITE && data[p * 4 + 1] >= WHITE && data[p * 4 + 2] >= WHITE;

  const bg = new Uint8Array(width * height);
  const stack = [];
  const seed = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const p = y * width + x;
    if (bg[p] || !near(p)) return;
    bg[p] = 1;
    stack.push(p);
  };
  for (let x = 0; x < width; x++) { seed(x, 0); seed(x, height - 1); }
  for (let y = 0; y < height; y++) { seed(0, y); seed(width - 1, y); }
  while (stack.length) {
    const p = stack.pop();
    const x = p % width;
    const y = (p - x) / width;
    seed(x + 1, y); seed(x - 1, y); seed(x, y + 1); seed(x, y - 1);
  }

  let removed = 0;
  for (let p = 0; p < width * height; p++) if (bg[p]) { data[p * 4 + 3] = 0; removed++; }
  return { data, width, height, removed };
}

const failures = [];
for (const item of MANIFEST) {
  const srcPath = join(uploads, item.src);
  const outPath = join(img, item.out);
  const { data, width, height, removed } = await cutout(srcPath);

  await sharp(data, { raw: { width, height, channels: 4 } })
    .trim()
    .resize({ width: Math.min(item.width, width), withoutEnlargement: true })
    .png({ compressionLevel: 9 })
    .toFile(outPath);

  // Validate: transparent, trimmed, non-empty.
  const out = sharp(outPath);
  const meta = await out.metadata();
  const corner = await out.clone().extract({ left: 0, top: 0, width: 1, height: 1 }).ensureAlpha().raw().toBuffer();
  const removedPct = (100 * removed) / (width * height);
  const ok = meta.hasAlpha && meta.width <= item.width && meta.height > 0 && corner[3] === 0 && removedPct > 5;
  if (!ok) failures.push(`${item.out}: hasAlpha=${meta.hasAlpha} corner.a=${corner[3]} removed=${removedPct.toFixed(1)}%`);
  console.log(`${ok ? '✓' : '✗'} ${item.out.padEnd(28)} ${meta.width}x${meta.height}  bg -${removedPct.toFixed(0)}%`);
}

if (failures.length) {
  console.error('\nASSET PROCESSING FAILED');
  failures.forEach((m) => console.error(`  - ${m}`));
  process.exit(1);
}
console.log(`\nProcessed ${MANIFEST.length} assets.`);
