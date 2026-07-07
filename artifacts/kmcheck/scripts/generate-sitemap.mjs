/**
 * Generates public/sitemap.xml — run before build.
 * Keep paths in sync with src/lib/seo-config.ts INDEXABLE_PATHS
 */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ORIGIN = "https://kmcheck.com";
const LANGS = ["en", "es", "uk", "ru", "ro", "pl", "ar", "sq"];
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
];

const HREFLANG = {
  en: "en",
  es: "es",
  ar: "ar",
  uk: "uk-UA",
  ru: "ru",
  ro: "ro",
  pl: "pl",
  sq: "sq-AL",
};

const dir = dirname(fileURLToPath(import.meta.url));
const out = join(dir, "..", "public", "sitemap.xml");
const lastmod = new Date().toISOString().slice(0, 10);

function loc(lang, path) {
  return path ? `${ORIGIN}/${lang}${path}` : `${ORIGIN}/${lang}`;
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

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join("\n")}
</urlset>
`;

writeFileSync(out, xml, "utf8");
console.log(`Wrote ${urls.length} URLs to public/sitemap.xml`);
