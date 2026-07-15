/**
 * Premium-brand coherence QA: never claim a generation that couldn't exist in that year.
 * Prefer model-only over a wrong chassis.
 */
import { describe, expect, it } from "vitest";
import { decodePremiumEuropean, premiumVinModelYear } from "./european-premium";
import { decodeVin } from "./vinDecoder";

describe("premium chassis year coherence", () => {
  it("BMW WBA3A + 2015 (F30-era) must not claim E90", () => {
    const vin = "WBA3A5C55FK123456"; // year F = 2015
    expect(premiumVinModelYear(vin)).toBe(2015);
    const prem = decodePremiumEuropean(vin);
    expect(prem?.model).toBe("3 Series");
    expect(prem?.chassis).toBeNull();
    expect(prem?.displayModel).not.toMatch(/E90/i);
    expect(decodeVin(vin).model).not.toMatch(/E90/i);
  });

  it("BMW WBA3A + 2008 may omit chassis rather than invent E90", () => {
    const vin = "WBA3A5C558K123456"; // year 8 = 2008
    const prem = decodePremiumEuropean(vin);
    expect(prem?.model).toBe("3 Series");
    // Ambiguous prefix — never ship E90 just because the VIN is old.
    expect(prem?.displayModel).not.toMatch(/E90|E91|E92|E93/i);
  });

  it("Mercedes WDD213 + year 2001 must not claim W213", () => {
    const vin = "WDD2130421A123456"; // year 1 = 2001
    expect(premiumVinModelYear(vin)).toBe(2001);
    const prem = decodePremiumEuropean(vin);
    expect(prem?.model).toBe("E-Class");
    expect(prem?.chassis).toBeNull();
    expect(prem?.displayModel).not.toMatch(/W213/i);
    expect(decodeVin(vin).model).toBe("E-Class");
  });

  it("Mercedes WDD213 + year 2016 may claim W213", () => {
    const vin = "WDD213042GA123456"; // pos.10 = G → 2016
    expect(vin).toHaveLength(17);
    expect(premiumVinModelYear(vin)).toBe(2016);
    const prem = decodePremiumEuropean(vin);
    expect(prem?.chassis).toBe("W213");
    expect(prem?.displayModel).toContain("W213");
  });

  it("Mercedes WDD243 is EQB, not B-Class W246", () => {
    const vin = "WDD243000MA123456";
    expect(vin).toHaveLength(17);
    const prem = decodePremiumEuropean(vin);
    expect(prem?.model).toBe("EQB");
    expect(prem?.displayModel).not.toMatch(/B-Class|W246/i);
    expect(decodeVin(vin).model).toMatch(/EQB/i);
  });

  it("Mercedes letter-series C-Class does not invent W204 on a 2020 VIN", () => {
    const vin = "WDDGF8HB6LA123456"; // L = 2020
    const prem = decodePremiumEuropean(vin);
    expect(prem?.model).toBe("C-Class");
    expect(prem?.chassis).toBeNull();
    expect(prem?.displayModel).not.toMatch(/W204/i);
  });

  it("Porsche WP0ZZZ99 is 911 without hardcoded 992", () => {
    const vin = "WP0ZZZ99ZPS123456";
    const prem = decodePremiumEuropean(vin);
    expect(prem?.model).toBe("911");
    expect(prem?.chassis).toBeNull();
    expect(prem?.displayModel).not.toMatch(/992/i);
  });

  it("VW Typ 1K is Golf Mk5, not Mk7/8", () => {
    const vin = "WVWZZZ1KZ5W123456"; // year 5 = 2005
    const prem = decodePremiumEuropean(vin);
    expect(prem?.model).toBe("Golf");
    expect(prem?.chassis).toBe("Mk5");
    expect(prem?.displayModel).not.toMatch(/Mk7|Mk8/i);
  });

  it("VW Typ AU is Golf Mk7 when year fits", () => {
    const vin = "WVWZZZAUZFW123456"; // F = 2015
    const prem = decodePremiumEuropean(vin);
    expect(prem?.model).toBe("Golf");
    expect(prem?.chassis).toBe("Mk7");
  });

  it("BMW G30 chassis is dropped when year is before 2017", () => {
    const vin = "WBA5E1105FG123456"; // F = 2015
    const prem = decodePremiumEuropean(vin);
    expect(prem?.model).toBe("5 Series");
    expect(prem?.chassis).toBeNull();
    expect(prem?.displayModel).not.toMatch(/G30/i);
  });

  it("MINI F56 Cooper does not claim Clubman from ambiguous WMWX alone", () => {
    const vin = "WMWXP7C55F2123456";
    const prem = decodePremiumEuropean(vin);
    expect(prem?.model).toMatch(/Cooper/i);
    expect(prem?.chassis).toBe("F56");
    expect(decodeVin(vin).model?.toLowerCase()).not.toContain("clubman");
  });
});
