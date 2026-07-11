/**
 * QA: verify every indexable page has title + description in all languages.
 * Usage: node artifacts/kmcheck/scripts/qa-seo.mjs
 */
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { SEO_LANGS, vinSeoFromRest } from "./seo-inject.mjs";
import { SEO_OG_PAGES } from "./seo-og-config.mjs";
import { SUPPORTED_LANGS } from "./languages.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const seoData = JSON.parse(readFileSync(join(root, "src/lib/seo-data.json"), "utf8"));
const langs = SUPPORTED_LANGS;
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
  "country_canada",
  "country_china",
  "country_uae",
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
    if (
      ["home", "country_usa", "country_korea", "country_canada", "country_china", "country_uae"].includes(key)
      && entry?.title
      && entry.title.length > 60
    ) {
      console.warn(`WARN ${key}.${lang}: title ${entry.title.length} chars (target ≤60)`);
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

/** Polish i18n: pl.json key parity and vin translations */
const plI18nPath = join(root, "src/i18n/pl.json");
if (existsSync(plI18nPath)) {
  const plI18n = JSON.parse(readFileSync(plI18nPath, "utf8"));
  const plKeys = new Set(Object.keys(plI18n));
  const missingPl = enKeys.filter((k) => !plKeys.has(k));
  if (missingPl.length > 0) {
    console.error("pl.json missing keys:", missingPl.length);
    errors++;
  }
  const untranslatedPlVin = enKeys
    .filter((k) => k.startsWith("vin_") || k.startsWith("free_decoder"))
    .filter((k) => plI18n[k] === enI18n[k] && !vinKeyAllowEnglish.has(k));
  if (untranslatedPlVin.length > 0) {
    console.error("pl.json untranslated vin/free_decoder keys:", untranslatedPlVin.slice(0, 10).join(", "));
    errors += untranslatedPlVin.length;
  }
} else {
  console.error("MISSING pl.json");
  errors++;
}

/** de/fr/bg SEO must not be English placeholders */
const EN_HOME_TITLE = seoData.home?.en?.title ?? "";
for (const lang of ["de", "fr", "bg"]) {
  const homeTitle = seoData.home?.[lang]?.title ?? "";
  if (homeTitle === EN_HOME_TITLE) {
    console.error(`${lang} home SEO title is still English placeholder`);
    errors++;
  }
  const vinSeo = vinSeoFromRest(`/vin/${SAMPLE_VIN}`, lang);
  if (lang === "de" && !vinSeo?.title?.includes("Fahrzeug")) {
    console.error("de VIN SEO title not localized");
    errors++;
  }
  if (lang === "fr" && !vinSeo?.title?.includes("Rapport")) {
    console.error("fr VIN SEO title not localized");
    errors++;
  }
  if (lang === "bg" && !/отчет|история/i.test(vinSeo?.title ?? "")) {
    console.error("bg VIN SEO title not localized");
    errors++;
  }
}

function checkI18nParity(langCode, label) {
  const path = join(root, `src/i18n/${langCode}.json`);
  if (!existsSync(path)) {
    console.error(`MISSING ${langCode}.json`);
    errors++;
    return;
  }
  const dict = JSON.parse(readFileSync(path, "utf8"));
  const dictKeys = new Set(Object.keys(dict));
  const missing = enKeys.filter((k) => !dictKeys.has(k));
  if (missing.length > 0) {
    console.error(`${label} missing keys:`, missing.length);
    errors += missing.length;
  }
  const untranslated = enKeys
    .filter((k) => dict[k] === enI18n[k] && !vinKeyAllowEnglish.has(k))
    .filter((k) => !/^(admin|vin_label|vin_segment_|free_decoder_field_|free_decoder_diag_)/i.test(k));
  if (untranslated.length > 80) {
    console.error(`${label} too many untranslated keys (${untranslated.length}):`, untranslated.slice(0, 8).join(", "));
    errors++;
  }
}

checkI18nParity("de", "de.json");
checkI18nParity("fr", "fr.json");
checkI18nParity("bg", "bg.json");

const bootstrap = readFileSync(join(root, "public/seo-bootstrap.js"), "utf8");
for (const lang of langs) {
  if (!bootstrap.includes(`"${lang}"`)) {
    console.error("BOOTSTRAP missing lang:", lang);
    errors++;
  }
}
if (!bootstrap.includes("Fahrzeughistorienbericht")) {
  console.error("BOOTSTRAP missing German VIN title template");
  errors++;
}

const ogDir = join(root, "public", "seo", "og");
const OG_MAX_BYTES = { home: 40_000, country: 52_000 };
for (const { pageKey } of SEO_OG_PAGES) {
  const max = pageKey === "home" ? OG_MAX_BYTES.home : OG_MAX_BYTES.country;
  for (const lang of langs) {
    const file = join(ogDir, `${pageKey}-${lang}.webp`);
    if (!existsSync(file)) {
      console.error(`MISSING OG image: seo/og/${pageKey}-${lang}.webp`);
      errors++;
      continue;
    }
    const size = statSync(file).size;
    if (size > max) {
      console.error(`OG image too heavy: seo/og/${pageKey}-${lang}.webp (${Math.round(size / 1024)}KB > ${Math.round(max / 1024)}KB)`);
      errors++;
    }
  }
}

if (errors === 0) {
  console.log(`OK — ${indexableKeys.length} pages × ${langs.length} languages verified`);
  console.log(`OK — VIN catalog SEO for ${SEO_LANGS.length} languages`);
  console.log(`OK — ${vinPageKeys.length} VIN-related static SEO pages × ${langs.length} languages`);
  console.log("OK — pl.json i18n key parity and vin translations");
  console.log("OK — ro.json i18n key parity and vin translations");
  console.log("OK — de/fr/bg i18n key parity");
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

/** sq: search queries use "kontroll kilometrash", not "kontroll kilometra" alone in titles */
const SQ_TITLE_KEYS = [
  "home",
  "pricing",
  "free_decoder",
  "how_it_works",
  "faq",
  "country_usa",
  "country_korea",
  "country_canada",
  "country_china",
  "country_uae",
];
for (const key of SQ_TITLE_KEYS) {
  const title = (seoData[key]?.sq?.title ?? "").toLowerCase();
  if (title.includes("kontroll kilometra") && !title.includes("kilometrash")) {
    console.warn(`WARN sq.${key}: title uses "kilometra" without "kilometrash" (prefer genitive for Google)`);
    sqWarn++;
  }
}
if (!(seoData.home?.sq?.title ?? "").toLowerCase().includes("aksidente")) {
  console.warn("WARN sq.home: title missing aksidente");
  sqWarn++;
}

/** sq i18n H1 should use Kontroll + cycling genitive keywords */
const sqI18nPath = join(root, "src/i18n/sq.json");
if (existsSync(sqI18nPath)) {
  const sqI18n = JSON.parse(readFileSync(sqI18nPath, "utf8"));
  if (sqI18n.hero_headline_1 !== "Kontroll kilometrash") {
    console.warn('WARN sq.json: hero_headline_1 should be "Kontroll kilometrash" (static homepage H1)');
    sqWarn++;
  }
  for (const slug of ["usa", "korea", "canada", "china", "uae"]) {
    if (sqI18n[`country_${slug}_headline_verb`] !== "Kontroll") {
      console.warn(`WARN sq.json: country_${slug}_headline_verb should be Kontroll`);
      sqWarn++;
    }
    if ((sqI18n[`country_${slug}_headline_origin`] ?? "").includes("makinat")) {
      console.warn(`WARN sq.json: country_${slug}_headline_origin should use makina not makinat`);
      sqWarn++;
    }
    const cycling = [0, 1, 2, 3].map((i) => sqI18n[`country_${slug}_cycling_${i}`] ?? "");
    const expected = ["kilometrash", "aksidentesh", "vjedhjesh", "dëmtim total"];
    for (let i = 0; i < 4; i++) {
      if (cycling[i] !== expected[i]) {
        console.warn(`WARN sq.json: country_${slug}_cycling_${i} expected "${expected[i]}", got "${cycling[i]}"`);
        sqWarn++;
      }
    }
  }
  const sub = sqI18n.hero_subtext ?? "";
  if (!sub.toLowerCase().includes("kontroll kilometrash")) {
    console.warn("WARN sq.json: hero_subtext missing kontroll kilometrash");
    sqWarn++;
  }
}

if (sqWarn === 0) {
  console.log("OK — Albanian title/H1 SEO alignment");
}
