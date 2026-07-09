import { describe, it, expect } from "vitest";
import { decodeVin, decodePremiumEuropean } from "./index";

describe("BMW F32/F33/F36 ETK type codes", () => {
  it("3V71 → F33 428i Convertible (N26)", () => {
    const vin = "WBA3V7106FJ995387";
    expect(decodeVin(vin).model).toBe("4 Series (F33 Convertible)");
    expect(decodePremiumEuropean(vin)?.chassis).toBe("F33 Convertible");
  });

  it("3N71 → F32 428i Coupé", () => {
    const vin = "WBA3N7106FJ995387";
    expect(decodeVin(vin).model).toContain("F32");
  });

  it("4B11 → F36 Gran Coupé", () => {
    const vin = "WBA4B1C59FG241156";
    expect(decodeVin(vin).model).toContain("F36 Gran Coupé");
  });

  it("US 5UX3V71 → F33 Convertible", () => {
    const vin = "5UX3V7106FJ995387";
    expect(decodeVin(vin).model).toContain("F33 Convertible");
  });
});
