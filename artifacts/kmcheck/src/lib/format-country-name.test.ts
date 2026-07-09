import { describe, expect, it } from "vitest";
import { formatCountryName, formatVinOriginCountry } from "./format-country-name";

describe("formatVinOriginCountry", () => {
  it("translates single countries via locale", () => {
    expect(formatVinOriginCountry("France", "de")).toBe("Frankreich");
    expect(formatVinOriginCountry("Spain", "es")).toBe("España");
  });

  it("translates legacy combined labels", () => {
    expect(formatVinOriginCountry("France/Spain", "es")).toBe("Francia / España");
    expect(formatCountryName("France/Spain", "es")).toBe("Francia / España");
  });

  it("translates ISO codes from admin catalog", () => {
    expect(formatVinOriginCountry("fr", "de")).toBe("Frankreich");
    expect(formatVinOriginCountry("es", "pl")).toBe("Hiszpania");
  });
});
