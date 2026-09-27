import { describe, expect, it } from "vitest";
import { optionalStoredCountry, parseUserCountryCode } from "./userCountry.js";

describe("optionalStoredCountry", () => {
  it("stores a valid ISO country", () => {
    expect(optionalStoredCountry("de")).toBe("DE");
    expect(optionalStoredCountry("AL")).toBe("AL");
  });

  it("maps Kosovo to Albania", () => {
    expect(optionalStoredCountry("xk")).toBe("AL");
  });

  it("treats missing or blank as unset", () => {
    expect(optionalStoredCountry(undefined)).toBeNull();
    expect(optionalStoredCountry(null)).toBeNull();
    expect(optionalStoredCountry("")).toBeNull();
    expect(optionalStoredCountry("   ")).toBeNull();
    expect(optionalStoredCountry("__none__")).toBeNull();
  });

  it("does not reject unrecognized values — signup stays optional", () => {
    expect(optionalStoredCountry("Germany")).toBeNull();
    expect(optionalStoredCountry("XX")).toBeNull();
    expect(parseUserCountryCode("Germany")).toBeNull();
  });
});
