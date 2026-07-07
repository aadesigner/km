/**
 * QA: verify every indexable page has title + description in all 7 languages.
 * Usage: node artifacts/kmcheck/scripts/qa-seo.mjs
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { SEO_LANGS, vinSeoFromRest } from "./seo-inject.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const seoData = JSON.parse(readFileSync(join(root, "src/lib/seo-data.json"), "utf8"));
const langs = ["en", "es", "uk", "ru", "ro", "ar", "sq"];
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

/** VIN catalog page SEO (per-lang title/description templates) */
const SAMPLE_VIN = "1HGBH41JXMN109186";
for (const lang of SEO_LANGS) {
  const vinSeo = vinSeoFromRest(`/vin/${SAMPLE_VIN}`, lang);
  if (!vinSeo?.title?.includes(SAMPLE_VIN) || !vinSeo?.description?.includes(SAMPLE_VIN)) {
    console.error(`VIN SEO missing VIN for lang: ${lang}`);
    errors++;
  }
  if (!vinSeo?.title?.includes("kmcheck") || !vinSeo?.description?.includes("kmcheck.com")) {
    console.error(`VIN SEO missing brand for lang: ${lang}`);
    errors++;
  }
}

/** Static VIN-related page SEO entries (all langs) */
const vinPageKeys = [
  "vin_result",
  "free_decoder",
  "auth",
  "dashboard",
  "sign_up",
  "checkout",
  "purchases",
];
for (const key of vinPageKeys) {
  const page = seoData[key];
  if (!page) {
    console.error("MISSING VIN PAGE KEY:", key);
    errors++;
    continue;
  }
  for (const lang of langs) {
    const entry = page[lang];
    if (!entry?.title?.trim() || !entry?.description?.trim()) {
      console.error(`MISSING ${key}.${lang}`);
      errors++;
    }
    const blob = `${entry?.title ?? ""} ${entry?.description ?? ""}`.toLowerCase();
    if (!blob.includes("vin")) {
      console.error(`${key}.${lang}: title/description must mention VIN`);
      errors++;
    }
  }
}

/** Romanian i18n: vin_* keys must match en key set */
const enI18n = JSON.parse(readFileSync(join(root, "src/i18n/en.json"), "utf8"));
const roI18n = JSON.parse(readFileSync(join(root, "src/i18n/ro.json"), "utf8"));
const enKeys = Object.keys(enI18n);
const roKeys = new Set(Object.keys(roI18n));
const missingRo = enKeys.filter((k) => !roKeys.has(k));
if (missingRo.length > 0) {
  console.error("ro.json missing keys:", missingRo.length);
  errors++;
}
const vinKeyAllowEnglish = new Set([
  "vin_label",
  "vin_segment_model",
  "free_decoder_field_model",
  "free_decoder_field_turbo",
  "free_decoder_field_abs",
  "free_decoder_diag_wmi",
  "free_decoder_diag_vds",
  "free_decoder_diag_vis",
  "free_decoder_diag_turbo",
  "free_decoder_diag_abs",
  "free_decoder_diag_gvwr",
  "vin_share_whatsapp",
  "vin_share_facebook",
  "vin_share_telegram",
  "vin_share_x",
]);
const untranslatedVin = enKeys
  .filter((k) => k.startsWith("vin_") || k.startsWith("free_decoder"))
  .filter((k) => roI18n[k] === enI18n[k] && !vinKeyAllowEnglish.has(k));
if (untranslatedVin.length > 0) {
  console.error("ro.json untranslated vin/free_decoder keys:", untranslatedVin.slice(0, 10).join(", "));
  errors += untranslatedVin.length;
}

const bootstrap = readFileSync(join(root, "public/seo-bootstrap.js"), "utf8");
for (const lang of langs) {
  if (!bootstrap.includes(`"${lang}"`)) {
    console.error("BOOTSTRAP missing lang:", lang);
    errors++;
  }
}
if (!bootstrap.includes("raport istoric vehicul | kmcheck")) {
  console.error("BOOTSTRAP missing Romanian VIN title template");
  errors++;
}

if (errors === 0) {
  console.log(`OK — ${indexableKeys.length} pages × ${langs.length} languages verified`);
  console.log(`OK — VIN catalog SEO for ${SEO_LANGS.length} languages`);
  console.log(`OK — ${vinPageKeys.length} VIN-related static SEO pages × ${langs.length} languages`);
  console.log("OK — ro.json i18n key parity and vin translations");
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
