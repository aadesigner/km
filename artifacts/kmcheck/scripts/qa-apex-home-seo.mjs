/**
 * QA: English home must index at apex https://kmcheck.com/ without breaking locales.
 * Run: node artifacts/kmcheck/scripts/qa-apex-home-seo.mjs
 */
import { resolveSeoForPath } from "./seo-inject.mjs";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");
let failed = 0;
function check(label, cond) {
  if (cond) console.log(`OK  ${label}`);
  else {
    failed += 1;
    console.error(`FAIL ${label}`);
  }
}

const en = resolveSeoForPath("/en");
const apex = resolveSeoForPath("/");
const sq = resolveSeoForPath("/sq");
const enPricing = resolveSeoForPath("/en/pricing");
const vin = resolveSeoForPath("/en/vin/WDDLJ9HB5FA139926");

check(" /en home canonical is apex", en.canonicalUrl === "https://kmcheck.com/");
check(" / home canonical is apex", apex.canonicalUrl === "https://kmcheck.com/");
check(" /sq home stays /sq", sq.canonicalUrl === "https://kmcheck.com/sq");
check(" /en/pricing unchanged", enPricing.canonicalUrl === "https://kmcheck.com/en/pricing");
check(" VIN paths still under /en/vin", vin.canonicalUrl.includes("/en/vin/"));
check(" homes are indexable", !en.noIndex && !apex.noIndex && !sq.noIndex);

const staticSrc = readFileSync(join(root, "artifacts/api-server/src/lib/staticSite.ts"), "utf8");
check(" crawlers are NOT 301'd from / to /en", !/redirect\(301,\s*`\/en\$\{q\}`\)/.test(staticSrc));
check(" crawlers get English home at apex", staticSrc.includes('sendSpaFile(publicDir, "/en"'));

const sitemapSrc = readFileSync(join(root, "artifacts/kmcheck/scripts/generate-sitemap.mjs"), "utf8");
check(" sitemap maps en home to ORIGIN/", sitemapSrc.includes('return `${ORIGIN}/`'));

if (failed) {
  console.error(`\n${failed} check(s) failed`);
  process.exit(1);
}
console.log("\nApex home SEO QA passed");
