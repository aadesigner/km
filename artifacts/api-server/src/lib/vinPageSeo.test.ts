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
    expect(title).toContain("Check VIN");

    const desc = buildVinPageDescription("en", {
      vin,
      year: 2015,
      make: "BMW",
      model: "3 Series",
      engine: "2.0L",
    });
    expect(desc).toContain(vin);
    expect(desc).toContain("mileage");
    expect(desc).toContain("accidents");
    expect(desc).toContain("ownership history");
    expect(desc).toContain("2.0L");
  });

  it("builds Polish VIN page title and description", () => {
    const vin = "WBA3V7106FJ995387";
    const title = buildVinPageTitle("pl", {
      vin,
      year: 2015,
      make: "BMW",
      model: "3 Series",
    });
    expect(title).toContain("sprawdź VIN");
    expect(title).toContain(vin);

    const desc = buildVinPageDescription("pl", { vin, year: 2015, make: "BMW", model: "3 Series" });
    expect(desc).toContain(vin);
    expect(desc).toContain("przebieg");
    expect(desc).toContain("wypadki");
    expect(desc).toContain("kmcheck.com");
  });

  it("builds Polish VIN-only fallback SEO strings", () => {
    const vin = "1HGBH41JXMN109186";
    const seo = buildVinPageSeo("pl", { vin }, "https://kmcheck.com");
    expect(seo.title).toContain("raport historii pojazdu");
    expect(seo.title).toContain(vin);
    expect(seo.description).toContain("Sprawdź VIN");
    expect(seo.canonicalPath).toBe("/pl/vin/1HGBH41JXMN109186");
  });

  it("builds Romanian VIN page title and description", () => {
    const vin = "WBA3V7106FJ995387";
    const title = buildVinPageTitle("ro", {
      vin,
      year: 2015,
      make: "BMW",
      model: "3 Series",
    });
    expect(title).toContain("verificare VIN");
    expect(title).toContain(vin);

    const desc = buildVinPageDescription("ro", { vin, year: 2015, make: "BMW", model: "3 Series" });
    expect(desc).toContain(vin);
    expect(desc).toContain("kilometraj");
    expect(desc).toContain("accidente");
    expect(desc).toContain("kmcheck.com");
  });

  it("builds Romanian VIN-only fallback SEO strings", () => {
    const vin = "1HGBH41JXMN109186";
    const seo = buildVinPageSeo("ro", { vin }, "https://kmcheck.com");
    expect(seo.title).toContain("raport istoric vehicul");
    expect(seo.title).toContain(vin);
    expect(seo.description).toContain("Verificați VIN");
    expect(seo.canonicalPath).toBe("/ro/vin/1HGBH41JXMN109186");
  });

  it("resolves absolute og image URLs", () => {
    const seo = buildVinPageSeo(
      "en",
      {
        vin: "1HGBH41JXMN109186",
        make: "Honda",
        model: "Accord",
        year: 1991,
        thumbnailUrl: "/api/vin/image?token=abc",
      },
      "https://kmcheck.com",
    );
    expect(seo.ogImage).toBe("https://kmcheck.com/api/vin/image?token=abc");
    expect(seo.ogImageAlt).toBe("1991 Honda Accord");
  });

  it("builds German VIN-only fallback SEO strings", () => {
    const vin = "1HGBH41JXMN109186";
    const seo = buildVinPageSeo("de", { vin }, "https://kmcheck.com");
    expect(seo.title).toContain("Fahrzeughistorienbericht");
    expect(seo.description).toContain("Kilometerstand");
    expect(seo.canonicalPath).toBe("/de/vin/1HGBH41JXMN109186");
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
