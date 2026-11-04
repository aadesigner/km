/**
 * Full SEO policy QA: marketing EN+SQ priority, VIN off index/sitemap, apex English home.
 * Run from repo: node artifacts/kmcheck/scripts/qa-seo-en-sq-policy.mjs
 */
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { resolveSeoForPath } from "./seo-inject.mjs";

const dir = dirname(fileURLToPath(import.meta.url));
const publicDir = join(dir, "..", "public");
const apiImport = join(dir, "../../api-server/src/lib/vinCatalogImport.ts");

let failed = 0;
function check(label, cond) {
  if (cond) console.log(`OK  ${label}`);
  else {
    failed += 1;
    console.error(`FAIL ${label}`);
  }
}

const pages = readFileSync(join(publicDir, "sitemap-pages.xml"), "utf8");
const index = readFileSync(join(publicDir, "sitemap.xml"), "utf8");
const vinShards = existsSync(publicDir)
  ? readdirSync(publicDir).filter((n) => /^sitemap-vins-\d+\.xml$/i.test(n))
  : [];

check("no VIN shards on disk", vinShards.length === 0);
check("sitemap index is pages-only", /sitemap-pages\.xml/.test(index) && !/sitemap-vins/i.test(index));
check("pages sitemap has no /vin/", !/\/vin\//.test(pages));

function entry(loc) {
  const esc = loc.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`<url>[\\s\\S]*?<loc>${esc}</loc>([\\s\\S]*?)</url>`);
  const m = pages.match(re);
  if (!m) return null;
  const pri = m[1].match(/<priority>([^<]+)/)?.[1] ?? null;
  const langs = [...m[1].matchAll(/hreflang="([^"]+)"/g)].map((x) => x[1]);
  return { pri, langs, hasXDefault: langs.includes("x-default") };
}

const apex = entry("https://kmcheck.com/");
const sqHome = entry("https://kmcheck.com/sq");
const deHome = entry("https://kmcheck.com/de");
const enPricing = entry("https://kmcheck.com/en/pricing");
const sqPricing = entry("https://kmcheck.com/sq/pricing");
const dePricing = entry("https://kmcheck.com/de/pricing");
const badEnHome = entry("https://kmcheck.com/en");

check("apex English home in sitemap pri=1.0", apex?.pri === "1.0");
check("SQ home pri=1.0", sqHome?.pri === "1.0");
check("DE home lower than EN/SQ", deHome?.pri === "0.6");
check("no separate /en home loc (apex owns EN)", badEnHome == null);
check("EN pricing pri=0.95", enPricing?.pri === "0.95");
check("SQ pricing pri=0.95", sqPricing?.pri === "0.95");
check("DE pricing lower", dePricing?.pri === "0.55");
check("apex has x-default", apex?.hasXDefault === true);
check("sq home has x-default", sqHome?.hasXDefault === true);

const firstLocs = [...pages.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]).slice(0, 4);
check("urlset starts with EN apex then SQ", firstLocs[0] === "https://kmcheck.com/" && firstLocs[1] === "https://kmcheck.com/sq");

const importSrc = readFileSync(apiImport, "utf8");
check("PUBLIC_VIN_PAGES_SEO_ENABLED = false", /PUBLIC_VIN_PAGES_SEO_ENABLED\s*=\s*false/.test(importSrc));
check("VIN_SITEMAP_MAX_URLS = 0", /VIN_SITEMAP_MAX_URLS\s*=\s*0/.test(importSrc));

const paths = {
  "/": resolveSeoForPath("/"),
  "/en": resolveSeoForPath("/en"),
  "/sq": resolveSeoForPath("/sq"),
  "/en/pricing": resolveSeoForPath("/en/pricing"),
  "/sq/pricing": resolveSeoForPath("/sq/pricing"),
  "/sq/faq": resolveSeoForPath("/sq/faq"),
  "/en/free-vin-decoder": resolveSeoForPath("/en/free-vin-decoder"),
  "/sq/how-it-works": resolveSeoForPath("/sq/how-it-works"),
  "/en/vin/WBA3V7106FJ995387": resolveSeoForPath("/en/vin/WBA3V7106FJ995387"),
};

check("apex canonical https://kmcheck.com/", paths["/"].canonicalUrl === "https://kmcheck.com/");
check("/en canonical consolidates to apex", paths["/en"].canonicalUrl === "https://kmcheck.com/");
check("/sq canonical self", paths["/sq"].canonicalUrl === "https://kmcheck.com/sq");
check("EN+SQ marketing pages indexable", !paths["/en/pricing"].noIndex && !paths["/sq/pricing"].noIndex && !paths["/sq/faq"].noIndex);
check("VIN path is noIndex in seo-inject", paths["/en/vin/WBA3V7106FJ995387"].noIndex === true);

const urlCount = (pages.match(/<url>/g) || []).length;
check("156 marketing URLs (12 paths × 13 langs)", urlCount === 156);

if (failed) {
  console.error(`\n${failed} SEO QA check(s) failed`);
  process.exit(1);
}
console.log("\nEN+SQ marketing SEO policy QA: ALL PASSED");
