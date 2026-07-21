/**
 * Audi free-decoder QA — North America platform (pos 7–8) + EU ZZZ.
 *
 * Contract:
 * - Non-ZZZ WAU/WA1/WUA: platform at positions 7–8 (NHTSA sheets).
 * - WAUHJ28P78A092448 → A3 (8P), 2008 — never null model.
 * - EU WAUZZZ* homologation / modern tables stay green.
 * - Year stays ISO position 10 for Audi.
 */
import { describe, expect, it } from "vitest";
import { decodeVin, decodeAudiModern, decodePremiumEuropean } from "./index";

/** Build a 17-char NA Audi VIN with the given positions 7–8 platform and year code. */
function na(platform: string, year = "8"): string {
  return `WAUHJ2${platform}7${year}A123456`;
}

describe("Audi NA QA — platform regression", () => {
  it("WAUHJ28P78A092448 → A3 (8P), 2008", () => {
    const vin = "WAUHJ28P78A092448";
    const r = decodeVin(vin);
    expect(r.make).toBe("Audi");
    expect(r.model).toMatch(/A3/i);
    expect(r.year).toBe(2008);
    expect(decodeAudiModern(vin)?.chassis).toBe("8P");
    expect(decodePremiumEuropean(vin)?.model).toMatch(/A3/i);
  });
});

describe("Audi NA QA — NHTSA platform families", () => {
  it.each([
    ["8P", /A3/i],
    ["8V", /A3/i],
    ["8E", /A4/i],
    ["8K", /A4/i],
    ["8T", /A5/i],
    ["4F", /A6/i],
    ["4E", /A8/i],
    ["4L", /Q7/i],
    ["8J", /TT/i],
    ["42", /R8/i],
    ["8U", /Q3/i],
    ["8R", /Q5/i],
  ])("platform %s → %s", (platform, modelRe) => {
    const vin = na(platform);
    expect(vin.length).toBe(17);
    expect(decodeVin(vin).make).toBe("Audi");
    expect(decodeVin(vin).model).toMatch(modelRe);
    expect(decodeVin(vin).year).toBe(2008);
  });
});

describe("Audi EU QA — ZZZ / modern still green", () => {
  it("WAUZZZ8V stays A3", () => {
    const vin = "WAUZZZ8V9KA123456";
    const r = decodeVin(vin);
    expect(r.make).toBe("Audi");
    expect(r.model).toMatch(/A3/i);
  });

  it("modern GF Q6 e-tron still resolves", () => {
    const vin = "WAUZZZGFZRS123456";
    expect(decodeAudiModern(vin)?.model).toMatch(/Q6 e-tron/i);
    expect(decodeVin(vin).model).toMatch(/Q6 e-tron/i);
  });
});
