/**
 * Generates marketing-page sitemaps (no VIN URLs).
 * - public/sitemap-pages.xml  — urlset for indexable marketing routes
 * - public/sitemap.xml        — sitemap index pointing at pages (+ VIN shards later)
 *
 * Keep PATHS in sync with src/lib/seo-config.ts INDEXABLE_PATHS.
 * VIN catalog URLs are written by generate-vin-sitemap.mjs into separate shards.
 */
import { writeFileSync, readdirSync, unlinkSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { SUPPORTED_LANGS, HREFLANG_MAP } from "./languages.mjs";

const ORIGIN = "https://kmcheck.com";
const LANGS = SUPPORTED_LANGS;
const PATHS = [
  "",
  "/pricing",
  "/free-vin-decoder",
  "/how-it-works",
  "/faq",
  "/terms",
  "/privacy",
  "/cars/usa",
  "/cars/korea",
  "/cars/canada",
  "/cars/china",
  "/cars/uae",
  "/api-b2b",
  "/api-b2b/plans",
  "/api-b2b/contact",
  "/api-b2b/usa-cars",
  "/api-b2b/canada-cars",
  "/api-b2b/korea-cars",
  "/api-b2b/dubai-cars",
  "/api-b2b/china-cars",
];

const HREFLANG = HREFLANG_MAP;

const dir = dirname(fileURLToPath(import.meta.url));
const publicDir = join(dir, "..", "public");
const pagesOut = join(publicDir, "sitemap-pages.xml");
const indexOut = join(publicDir, "sitemap.xml");
const lastmod = new Date().toISOString().slice(0, 10);

function loc(lang, path) {
  return path ? `${ORIGIN}/${lang}${path}` : `${ORIGIN}/${lang}`;
}

/** Remove stale VIN shards so a pages-only rebuild cannot leave orphans. */
function clearVinShards() {
  if (!existsSync(publicDir)) return;
  for (const name of readdirSync(publicDir)) {
    if (/^sitemap-vins-\d+\.xml$/i.test(name)) {
      unlinkSync(join(publicDir, name));
    }
  }
}

const urls = PATHS.flatMap((path) =>
  LANGS.map((lang) => {
    const alternates = LANGS.map(
      (l) =>
        `    <xhtml:link rel="alternate" hreflang="${HREFLANG[l]}" href="${loc(l, path)}" />`,
    ).join("\n");
    const xDefault = `    <xhtml:link rel="alternate" hreflang="x-default" href="${loc("en", path)}" />`;
    const priority = path === "" ? "1.0" : path.startsWith("/cars") ? "0.85" : "0.8";
    const changefreq = path === "" ? "weekly" : "monthly";
    return `  <url>
    <loc>${loc(lang, path)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
${alternates}
${xDefault}
  </url>`;
  }),
);

const pagesXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join("\n")}
</urlset>
`;

clearVinShards();
writeFileSync(pagesOut, pagesXml, "utf8");

const indexXml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${ORIGIN}/sitemap-pages.xml</loc>
    <lastmod>${lastmod}</lastmod>
  </sitemap>
</sitemapindex>
`;

writeFileSync(indexOut, indexXml, "utf8");
console.log(
  `Wrote ${urls.length} page URLs → public/sitemap-pages.xml; sitemap index → public/sitemap.xml`,
);
