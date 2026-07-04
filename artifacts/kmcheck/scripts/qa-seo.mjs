/**
 * QA: verify every indexable page has title + description in all 6 languages.
 * Usage: node artifacts/kmcheck/scripts/qa-seo.mjs
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const seoData = JSON.parse(readFileSync(join(root, "src/lib/seo-data.json"), "utf8"));
const langs = ["en", "es", "uk", "ru", "ar", "sq"];
const indexableKeys = [
  "home",
  "pricing",
  "free_decoder",
  "how_it_works",
  "faq",
  "terms",
  "privacy",
  "country_usa",
  "country_korea",
];

let errors = 0;
for (const key of indexableKeys) {
  const page = seoData[key];
  if (!page) {
    console.error("MISSING PAGE KEY:", key);
    errors++;
    continue;
  }
  for (const lang of langs) {
    const entry = page[lang];
    if (!entry?.title?.trim() || !entry?.description?.trim()) {
      console.error(`MISSING ${key}.${lang}`);
      errors++;
    }
    if (entry?.title && !entry.title.includes("kmcheck.com")) {
      console.warn(`WARN ${key}.${lang}: title missing brand`);
    }
  }
}

const bootstrap = readFileSync(join(root, "public/seo-bootstrap.js"), "utf8");
for (const lang of langs) {
  if (!bootstrap.includes(`"${lang}"`)) {
    console.error("BOOTSTRAP missing lang:", lang);
    errors++;
  }
}

if (errors === 0) {
  console.log(`OK — ${indexableKeys.length} pages × ${langs.length} languages verified`);
} else {
  console.error(`FAILED — ${errors} issue(s)`);
  process.exit(1);
}

/** Albanian (sq) keyword alignment — title/description should match on-page SEO targets */
const SQ_KEYWORDS = {
  home: ["kontroll kilometrash", "shasi"],
  pricing: ["kontroll kilometrash", "shasi"],
  free_decoder: ["shasi", "kontroll kilometrash"],
  how_it_works: ["kontroll", "shasi"],
  faq: ["kontroll kilometrash", "shasi"],
  country_usa: ["kontroll kilometrash", "vjedhjesh", "shba"],
  country_korea: ["kontroll kilometrash", "vjedhjesh", "koreja"],
  country_canada: ["kontroll kilometrash", "vjedhjesh", "kanadaja"],
};

let sqWarn = 0;
for (const [key, needles] of Object.entries(SQ_KEYWORDS)) {
  const entry = seoData[key]?.sq;
  if (!entry) continue;
  const blob = `${entry.title} ${entry.description}`.toLowerCase();
  for (const needle of needles) {
    if (!blob.includes(needle)) {
      console.warn(`WARN sq.${key}: missing keyword "${needle}" in title/description`);
      sqWarn++;
    }
  }
}
if (sqWarn === 0) {
  console.log("OK — Albanian SEO keywords aligned for indexable pages");
}
