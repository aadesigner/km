import { describe, expect, it } from "vitest";
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
});
