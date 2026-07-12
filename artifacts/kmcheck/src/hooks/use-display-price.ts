import { useGetCurrentPricing, type PricingConfig } from "@workspace/api-client-react";
import { STATIC_QUERY_OPTIONS, orvalQuery } from "@/lib/query-options";
import { DEFAULT_PRICING } from "@/lib/pricing-defaults";
import { formatDisplayPrice, normalizeCatalogPrice } from "@/lib/format-display-price";

export interface DisplayPriceResult {
  displayPrice: number | null;
  basePrice: number | null;
  isDiscount: boolean;
  loading: boolean;
  currencySymbol: string;
  currency: string;
  fmtPrice: (amount: number) => string;
}

export function useDisplayPrice(): DisplayPriceResult {
  const { data: pricing, isLoading } = useGetCurrentPricing({
    query: orvalQuery<PricingConfig>(STATIC_QUERY_OPTIONS),
  });

  const active = pricing ?? (isLoading ? DEFAULT_PRICING : null);

  const currency = active?.currency ?? DEFAULT_PRICING.currency;
  const currencySymbol =
    currency === "EUR" ? "€"
    : currency === "USD" ? "$"
    : currency;

  const fmtPrice = (amount: number): string => formatDisplayPrice(amount, currencySymbol);

  if (!active) {
    return {
      displayPrice: null,
      basePrice: null,
      isDiscount: false,
      loading: isLoading,
      currencySymbol,
      currency,
      fmtPrice,
    };
  }

  const isDiscount = active.discountEnabled;
  const displayPrice = normalizeCatalogPrice(
    isDiscount ? active.discountPrice : active.basePrice,
    isDiscount ? "sale" : "list",
  );
  const basePrice = normalizeCatalogPrice(active.basePrice, "list");

  return {
    displayPrice,
    basePrice,
    isDiscount,
    loading: isLoading && !pricing,
    currencySymbol,
    currency,
    fmtPrice,
  };
}
