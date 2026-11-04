import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { buildVinPageSeo } from "@workspace/vin-page-seo";

describe("rich results JSON-LD policy", () => {
  it("pricing productOfferJsonLd source must not emit Product", () => {
    const src = readFileSync(
      new URL("../../../kmcheck/src/components/seo.tsx", import.meta.url),
      "utf8",
    );
    expect(src).toContain('"@type": "WebPage"');
    expect(src).toContain('"@type": "Service"');
    // Product rich results need review/aggregateRating — we must not claim Product.
    expect(src).not.toMatch(/"@type":\s*"Product"/);
  });

  it("VIN pages do not emit Vehicle schema (GSC offers/review requirement)", () => {
    const seo = buildVinPageSeo(
      "zh",
      {
        vin: "WAUZZZ4GXGN023028",
        make: "Audi",
        model: "A7",
        year: 2015,
        thumbnailUrl: "https://cdn.test/car.jpg",
      },
      "https://kmcheck.com",
    );
    const blob = JSON.stringify(seo.jsonLd);
    expect(seo.jsonLd).toHaveLength(1);
    expect(seo.jsonLd[0]).toMatchObject({ "@type": "WebPage" });
    expect(blob).not.toContain('"@type":"Vehicle"');
    expect(blob).not.toContain("#vehicle");
    expect(blob).not.toContain("aggregateRating");
  });
});
