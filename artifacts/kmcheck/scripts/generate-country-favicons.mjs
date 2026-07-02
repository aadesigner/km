/**
 * Generates self-hosted flag favicons for country car pages (usa, korea, canada).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { COUNTRY_PAGE_FAVICON_SLUGS } from "./country-favicon-config.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = path.join(root, "public");

const FLAG_CODES = {
  usa: "us",
  korea: "kr",
  canada: "ca",
};

const SIZES = [
  { suffix: "16x16", size: 16, name: (slug) => `favicon-${slug}-16x16.png` },
  { suffix: "32x32", size: 32, name: (slug) => `favicon-${slug}-32x32.png` },
  { suffix: "180x180", size: 180, name: (slug) => `apple-touch-icon-${slug}.png` },
];

async function fetchFlagPng(code) {
  const url = `https://flagcdn.com/w320/${code}.png`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

for (const slug of Object.values(COUNTRY_PAGE_FAVICON_SLUGS)) {
  const code = FLAG_CODES[slug];
  const source = await fetchFlagPng(code);

  for (const { size, name } of SIZES) {
    const out = path.join(publicDir, name(slug));
    await sharp(source)
      .resize(size, size, { fit: "cover", position: "centre" })
      .png({ compressionLevel: 9, adaptiveFiltering: true })
      .toFile(out);
    const bytes = fs.statSync(out).size;
    console.log(`Wrote ${path.basename(out)} (${size}x${size}, ${bytes} bytes)`);
  }
}
