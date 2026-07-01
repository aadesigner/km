import { describe, expect, it } from "vitest";
import { formatDisplayPrice, normalizeCatalogPrice, roundCurrencyAmount } from "./format-display-price";

describe("formatDisplayPrice", () => {
  it("shows catalog prices with two decimals", () => {
    expect(formatDisplayPrice(14.99, "€")).toBe("€14.99");
    expect(formatDisplayPrice(29.99, "€")).toBe("€29.99");
  });

  it("keeps two decimals for fractional amounts", () => {
    expect(formatDisplayPrice(9.95, "€")).toBe("€9.95");
  });

  it("truncates float drift to two decimals", () => {
    expect(formatDisplayPrice(14.899999, "€")).toBe("€14.89");
    expect(roundCurrencyAmount(14.899999)).toBe(14.89);
  });

  it("keeps catalog sale price at €14.99 not €15", () => {
    expect(formatDisplayPrice(14.99, "€")).toBe("€14.99");
    expect(roundCurrencyAmount(14.99)).toBe(14.99);
    expect(normalizeCatalogPrice(15, "sale")).toBe(14.99);
    expect(normalizeCatalogPrice(14.99, "sale")).toBe(14.99);
    expect(normalizeCatalogPrice(14.9, "sale")).toBe(14.99);
  });
});
