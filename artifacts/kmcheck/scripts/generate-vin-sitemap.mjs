/**
 * Appends catalog VIN URLs to public/sitemap.xml when DATABASE_URL is set.
 * Run after generate-sitemap.mjs during build or deploy.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { SUPPORTED_LANGS, HREFLANG_MAP } from "./languages.mjs";

const ORIGIN = "https://kmcheck.com";
const LANGS = SUPPORTED_LANGS;
const HREFLANG = HREFLANG_MAP;

const dir = dirname(fileURLToPath(import.meta.url));
const root = join(dir, "..", "..", "..");
const envPath = join(root, ".env");
const sitemapPath = join(dir, "..", "public", "sitemap.xml");

if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^\s*([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim();
  }
}

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.log("generate-vin-sitemap: skip (no DATABASE_URL)");
  process.exit(0);
}

let pg;
try {
  pg = (await import("pg")).default;
} catch {
  console.log("generate-vin-sitemap: skip (pg not installed)");
  process.exit(0);
}

const client = new pg.Client({ connectionString: dbUrl });
await client.connect();

const { rows } = await client.query(
  `SELECT vin, updated_at FROM vin_catalog ORDER BY updated_at DESC LIMIT 50000`,
);
await client.end();

if (rows.length === 0) {
  console.log("generate-vin-sitemap: no catalog VINs");
  process.exit(0);
}

const baseXml = readFileSync(sitemapPath, "utf8");
const insertBefore = "</urlset>";
if (!baseXml.includes(insertBefore)) {
  console.warn("generate-vin-sitemap: sitemap.xml missing </urlset>");
  process.exit(0);
}

const vinUrls = rows.flatMap((row) => {
  const vin = String(row.vin).toUpperCase();
  const path = `/vin/${vin}`;
  const lastmod = row.updated_at
    ? new Date(row.updated_at).toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10);
  return LANGS.map((lang) => {
    const loc = `${ORIGIN}/${lang}${path}`;
    const alternates = LANGS.map(
      (l) =>
        `    <xhtml:link rel="alternate" hreflang="${HREFLANG[l]}" href="${ORIGIN}/${l}${path}" />`,
    ).join("\n");
    const xDefault = `    <xhtml:link rel="alternate" hreflang="x-default" href="${ORIGIN}/en${path}" />`;
    return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
${alternates}
${xDefault}
  </url>`;
  });
});

const merged = baseXml.replace(insertBefore, `${vinUrls.join("\n")}\n${insertBefore}`);
writeFileSync(sitemapPath, merged, "utf8");
console.log(`generate-vin-sitemap: added ${vinUrls.length} VIN URLs (${rows.length} VINs × ${LANGS.length} langs)`);
