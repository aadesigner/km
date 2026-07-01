import { describe, expect, it } from "vitest";
import {
  DEFAULT_PRICING,
  normalizeCatalogPrice,
  normalizePricingAmounts,
  roundCurrencyAmount,
} from "./pricingDefaults";

describe("pricingDefaults", () => {
  it("truncates to two decimals without rounding up to the next euro", () => {
    expect(roundCurrencyAmount(14.99)).toBe(14.99);
    expect(roundCurrencyAmount(14.999)).toBe(14.99);
    expect(normalizeCatalogPrice(14.99, "sale")).toBe(14.99);
    expect(normalizeCatalogPrice(15, "sale")).toBe(14.99);
  });

  it("migrates legacy one-decimal catalog prices to two decimals", () => {
    expect(normalizeCatalogPrice(14.9, "sale")).toBe(14.99);
    expect(normalizeCatalogPrice(29.9, "list")).toBe(29.99);
  });

  it("normalizes pricing rows to catalog amounts", () => {
    expect(
      normalizePricingAmounts({
        basePrice: 29.99,
        discountPrice: 14.99,
      }),
    ).toEqual({
      basePrice: DEFAULT_PRICING.basePrice,
      discountPrice: DEFAULT_PRICING.discountPrice,
    });
  });
});
