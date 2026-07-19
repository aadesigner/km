import { describe, expect, it } from "vitest";
import { formatDisplayPrice, normalizeCatalogPrice, roundCurrencyAmount } from "./format-display-price";

describe("formatDisplayPrice", () => {
  it("formats with two decimals", () => {
    expect(formatDisplayPrice(15.99, "€")).toBe("€15.99");
    expect(formatDisplayPrice(29.99, "€")).toBe("€29.99");
  });

  it("truncates float noise without rounding up", () => {
    expect(formatDisplayPrice(15.999999, "€")).toBe("€15.99");
    expect(formatDisplayPrice(14.899999, "€")).toBe("€14.89");
  });

  it("keeps catalog sale price at €15.99 and migrates legacy €14.99", () => {
    expect(formatDisplayPrice(15.99, "€")).toBe("€15.99");
    expect(roundCurrencyAmount(15.99)).toBe(15.99);
    expect(normalizeCatalogPrice(15.99, "sale")).toBe(15.99);
    expect(normalizeCatalogPrice(14.99, "sale")).toBe(15.99);
    expect(normalizeCatalogPrice(14.9, "sale")).toBe(15.99);
    expect(normalizeCatalogPrice(15, "sale")).toBe(15.99);
  });
});
