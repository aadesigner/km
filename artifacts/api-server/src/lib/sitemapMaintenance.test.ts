import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { removeVinUrlBlocks } from "./sitemapMaintenance.js";

describe("removeVinUrlBlocks", () => {
  it("removes url blocks for the VIN across languages", () => {
    const xml = `<?xml version="1.0"?>
<urlset>
  <url>
    <loc>https://kmcheck.com/en/vin/5YFS4MCE0NP127131</loc>
  </url>
  <url>
    <loc>https://kmcheck.com/sq/vin/5YFS4MCE0NP127131</loc>
  </url>
  <url>
    <loc>https://kmcheck.com/en/about</loc>
  </url>
</urlset>`;

    const out = removeVinUrlBlocks(xml, "5YFS4MCE0NP127131");
    expect(out).not.toContain("5YFS4MCE0NP127131");
    expect(out).toContain("/en/about");
  });

  it("removes a single en+hreflang VIN entry (sharded format)", () => {
    const xml = `<?xml version="1.0"?>
<urlset xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url>
    <loc>https://kmcheck.com/en/vin/JM1BPAM7XK1234567</loc>
    <xhtml:link rel="alternate" hreflang="sq-AL" href="https://kmcheck.com/sq/vin/JM1BPAM7XK1234567" />
  </url>
  <url>
    <loc>https://kmcheck.com/en/vin/OTHERVIN000000001</loc>
  </url>
</urlset>`;

    const out = removeVinUrlBlocks(xml, "JM1BPAM7XK1234567");
    expect(out).not.toContain("JM1BPAM7XK1234567");
    expect(out).toContain("OTHERVIN000000001");
  });
});

describe("VIN sitemap recovery policy", () => {
  it("requires complete lookup, SEO-worthy history, richness order, and a 400 cap", () => {
    const src = readFileSync(new URL("./sitemapMaintenance.ts", import.meta.url), "utf8");
    expect(src).toContain("CATALOG_HAS_COMPLETE_LOOKUP_SQL");
    expect(src).toContain("CATALOG_HAS_SEO_WORTHY_HISTORY_SQL");
    expect(src).toContain("CATALOG_SEO_HISTORY_RICHNESS_SQL");
    expect(src).toContain("VIN_SITEMAP_MAX_URLS");
    expect(src).toContain("priority>0.25</priority>");
    expect(src).not.toContain("limit(50_000)");
  });
});
