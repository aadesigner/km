import { DEFAULT_PRICING } from "@/lib/pricing-defaults";

/** Truncate to two decimals — stable display and PayPal amounts. */
export function roundCurrencyAmount(amount: number): number {
  return Math.trunc(amount * 100 + 1e-8) / 100;
}

/** Snap legacy / float drift to canonical catalog prices (€14.99 / €29.99). */
export function normalizeCatalogPrice(amount: number, kind: "list" | "sale"): number {
  const canonical = kind === "list" ? DEFAULT_PRICING.basePrice : DEFAULT_PRICING.discountPrice;
  const truncated = roundCurrencyAmount(amount);
  if (Math.abs(truncated - canonical) < 0.011) return canonical;
  const legacyOneDecimal = kind === "list" ? 29.9 : 14.9;
  if (Math.abs(truncated - legacyOneDecimal) < 0.011) return canonical;
  return truncated;
}

/** Customer-facing price label — always two decimals (e.g. €14.99, €29.99). */
export function formatDisplayPrice(amount: number, currencySymbol: string): string {
  const rounded = roundCurrencyAmount(amount);
  return `${currencySymbol}${rounded.toFixed(2)}`;
}
