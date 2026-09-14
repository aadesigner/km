import { describe, expect, it } from "vitest";
import {
  formatCountryName,
  formatVinOriginCountry,
  formatLocationLabel,
  canonicalCountryStorageLabel,
} from "./format-country-name";

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

describe("localized country free-text", () => {
  it("resolves Albanian South Korea variants so other languages can translate", () => {
    expect(formatCountryName("Koreja e Jugut", "en")).toBe("South Korea");
    expect(formatCountryName("koreja e jugit", "de")).toMatch(/korea/i);
    expect(formatLocationLabel("Asan, Koreja e Jugut", "en")).toBe("Asan, South Korea");
  });

  it("translates only the trailing country; leaves city/region text unchanged", () => {
    expect(formatLocationLabel("Asan, South Korea", "de")).toMatch(/^Asan, /);
    expect(formatLocationLabel("Asan, South Korea", "de")).not.toMatch(/Asan.*Asan/);
    expect(formatLocationLabel("Busan, Gyeonggi, South Korea", "en")).toBe(
      "Busan, Gyeonggi, South Korea",
    );
    expect(formatLocationLabel("Busan, Gyeonggi, KR", "en")).toBe(
      "Busan, Gyeonggi, South Korea",
    );
    expect(formatLocationLabel("Asan", "de")).toBe("Asan");
    expect(formatLocationLabel("Gyeonggi-do", "sq")).toBe("Gyeonggi-do");
  });

  it("prefills English canonical labels from codes", () => {
    expect(canonicalCountryStorageLabel("kr")).toBe("South Korea");
    expect(canonicalCountryStorageLabel("us")).toBe("USA");
    expect(canonicalCountryStorageLabel("Koreja e Jugut")).toBe("South Korea");
  });
});
