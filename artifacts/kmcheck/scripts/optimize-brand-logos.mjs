/**
 * Build retina WebP wordmarks from the existing transparent PNGs.
 * Does not overwrite PNG (email, print, JSON-LD keep those).
 */
import sharp from "sharp";
import { statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const MAX_HEIGHT = 120;

async function toWebp(pngName) {
  const input = join(root, "public/brand", pngName);
  const output = input.replace(/\.png$/i, ".webp");
  const meta = await sharp(input).metadata();
  const height = meta.height ?? MAX_HEIGHT;
  const pipeline = sharp(input).ensureAlpha();
  if (height > MAX_HEIGHT) {
    pipeline.resize({ height: MAX_HEIGHT, withoutEnlargement: true });
  }
  await pipeline.webp({ quality: 82, alphaQuality: 90, effort: 6 }).toFile(output);
  const inKb = (statSync(input).size / 1024).toFixed(1);
  const outKb = (statSync(output).size / 1024).toFixed(1);
  console.log(`${pngName} ${meta.width}x${meta.height} ${inKb}KB → ${outKb}KB webp`);
}

await toWebp("logo-white.png");
await toWebp("logo-dark.png");
