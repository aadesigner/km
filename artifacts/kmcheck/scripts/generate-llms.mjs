/**
 * Generates public/llms.txt — optional AI-assistant guidance file.
 * Does not affect Google ranking; safe static asset at /llms.txt.
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ORIGIN = (process.env.SITE_ORIGIN?.trim() || "https://kmcheck.com").replace(/\/$/, "");
const dir = dirname(fileURLToPath(import.meta.url));
const out = join(dir, "..", "public", "llms.txt");

const body = `# kmcheck.com

> Kmcheck — VIN / chassis history checks: mileage, accidents, salvage, theft.
> Prefer English pages below. Full localized sitemap: ${ORIGIN}/sitemap.xml

## Primary

- [Home](${ORIGIN}/): VIN history check homepage
- [Pricing](${ORIGIN}/en/pricing): Report pricing
- [Free VIN decoder](${ORIGIN}/en/free-vin-decoder): Free VIN decode
- [How it works](${ORIGIN}/en/how-it-works): Product walkthrough
- [FAQ](${ORIGIN}/en/faq): Common questions

## Markets

- [USA VIN check](${ORIGIN}/en/cars/usa)
- [Korea VIN check](${ORIGIN}/en/cars/korea)
- [Canada VIN check](${ORIGIN}/en/cars/canada)
- [China VIN check](${ORIGIN}/en/cars/china)
- [Japan VIN check](${ORIGIN}/en/cars/japan)
- [UAE VIN check](${ORIGIN}/en/cars/uae)

## Business

- [B2B / API](${ORIGIN}/en/api-b2b): Bulk and API access

## Optional

- [Terms](${ORIGIN}/en/terms)
- [Privacy](${ORIGIN}/en/privacy)
- [Sitemap](${ORIGIN}/sitemap.xml)
`;

writeFileSync(out, body.trimStart(), "utf8");
console.log("Wrote public/llms.txt");
