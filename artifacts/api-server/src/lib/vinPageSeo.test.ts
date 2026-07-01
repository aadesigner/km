import { describe, expect, it } from "vitest";
import {
  buildVinPageDescription,
  buildVinPageTitle,
  buildVinPageSeo,
  isIndexableVinRest,
  normalizeVin,
} from "@workspace/vin-page-seo";

describe("vin-page-seo", () => {
  it("indexes catalog VIN paths but not processing", () => {
    expect(isIndexableVinRest("/vin/WBA3V7106FJ995387")).toBe(true);
    expect(isIndexableVinRest("/vin/processing")).toBe(false);
    expect(isIndexableVinRest("/vin/SHORT")).toBe(false);
  });

  it("builds rich title and description from public vehicle fields", () => {
    const vin = "WBA3V7106FJ995387";
    const title = buildVinPageTitle("en", {
      vin,
      year: 2015,
      make: "BMW",
      model: "3 Series",
      engine: "2.0L",
      country: "KR",
    });
    expect(title).toContain("2015 BMW 3 Series");
    expect(title).toContain(vin);

    const desc = buildVinPageDescription("en", {
      vin,
      year: 2015,
      make: "BMW",
      model: "3 Series",
      engine: "2.0L",
    });
    expect(desc).toContain(vin);
    expect(desc).toContain("2.0L");
  });

  it("emits WebPage + Vehicle JSON-LD", () => {
    const seo = buildVinPageSeo(
      "en",
      { vin: "1HGBH41JXMN109186", make: "Honda", model: "Accord", year: 1991 },
      "https://kmcheck.com",
    );
    expect(seo.noIndex).toBe(false);
    expect(seo.jsonLd).toHaveLength(2);
    expect(seo.canonicalPath).toBe("/en/vin/1HGBH41JXMN109186");
    expect(normalizeVin("1hgbh41jxmn109186")).toBe("1HGBH41JXMN109186");
  });
});
