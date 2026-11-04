/**
 * QA: structured data must not claim Product/Vehicle rich results we can't satisfy.
 * Run: node artifacts/kmcheck/scripts/qa-rich-results-schema.mjs
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildPricingPageJsonLd } from "./country-page-json-ld.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");
let failed = 0;
function check(label, cond) {
  if (cond) console.log(`OK  ${label}`);
  else {
    failed += 1;
    console.error(`FAIL ${label}`);
  }
}

const pricing = buildPricingPageJsonLd({
  name: "Raport i plotë historiku VIN",
  description: "Test",
  canonicalUrl: "https://kmcheck.com/sq/pricing",
  price: 15.99,
  currency: "EUR",
});
const pricingBlob = JSON.stringify(pricing);
check("pricing is WebPage", pricing["@type"] === "WebPage");
check("pricing mainEntity is Service", pricing.mainEntity?.["@type"] === "Service");
check("pricing has Offer", pricing.mainEntity?.offers?.["@type"] === "Offer");
check("pricing has no Product", !pricingBlob.includes('"Product"'));
check("pricing has no Vehicle", !pricingBlob.includes('"Vehicle"'));
check("pricing has no aggregateRating", !pricingBlob.includes("aggregateRating"));
check("pricing has no review field", !/"review"\s*:/.test(pricingBlob));

const seoTsx = readFileSync(join(root, "artifacts/kmcheck/src/components/seo.tsx"), "utf8");
check("client seo.tsx has no Product @type", !/"@type":\s*"Product"/.test(seoTsx));
check("client seo.tsx emits Service", seoTsx.includes('"@type": "Service"'));

const vinSeo = readFileSync(join(root, "lib/vin-page-seo/index.ts"), "utf8");
check("vin-page-seo does not emit Vehicle @type", !/"@type":\s*"Vehicle"/.test(vinSeo));
check("vin-page-seo emits WebPage", vinSeo.includes('"@type": "WebPage"'));
check("vin-page-seo emits CreativeWork not Vehicle", vinSeo.includes('"@type": "CreativeWork"'));

const seoInject = readFileSync(join(root, "artifacts/kmcheck/scripts/seo-inject.mjs"), "utf8");
check("seo-inject builds pricing JSON-LD", seoInject.includes("buildPricingPageJsonLd"));

if (failed > 0) {
  console.error(`\n${failed} check(s) failed`);
  process.exit(1);
}
console.log("\nAll rich-results schema checks passed");
