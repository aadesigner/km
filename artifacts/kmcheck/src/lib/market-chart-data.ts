import type { Language } from "@/i18n/context";
import {
  localizeProviderDate,
  translateProviderChartLabel,
} from "@/lib/korean-provider-text";

export type MarketChartPoint = {
  label: string;
  value: number;
  kind: "estimated" | "last_auction" | "auction_history";
};

type MarketDataSlice = {
  estimatedValue?: number | null;
  lastAuctionPrice?: number | null;
  lastAuctionDate?: string | null;
};

type AuctionSlice = {
  date?: string | null;
  finalPrice?: number | null;
};

export function buildMarketChartPoints(
  marketData: MarketDataSlice | null | undefined,
  auctionHistory: AuctionSlice[] | null | undefined,
  t: (key: string) => string,
  language: Language,
  vehicleCountry?: string | null,
): MarketChartPoint[] {
  const history = (auctionHistory ?? [])
    .filter((e) => e.finalPrice != null && e.finalPrice > 0)
    .sort((a, b) => (a.date ?? "").localeCompare(b.date ?? ""));

  if (history.length >= 2) {
    return history.map((e, i) => ({
      label: translateProviderChartLabel(e.date, language, vehicleCountry) ?? String(i + 1),
      value: e.finalPrice!,
      kind: "auction_history",
    }));
  }

  const points: MarketChartPoint[] = [];
  const est = marketData?.estimatedValue;
  const auction = marketData?.lastAuctionPrice;

  if (est != null && est > 0) {
    points.push({ label: t("chart_est_value"), value: est, kind: "estimated" });
  }
  if (auction != null && auction > 0) {
    const auctionLabel =
      translateProviderChartLabel(marketData?.lastAuctionDate, language, vehicleCountry)
      ?? localizeProviderDate(marketData?.lastAuctionDate, language, undefined, vehicleCountry)
      ?? t("chart_last_auction");
    points.push({ label: auctionLabel, value: auction, kind: "last_auction" });
  }

  if (points.length === 0 && history.length === 1) {
    points.push({
      label: translateProviderChartLabel(history[0].date, language, vehicleCountry) ?? "1",
      value: history[0].finalPrice!,
      kind: "last_auction",
    });
  }

  return points;
}

/** Full localized auction date for market data rows (month name + day + year). */
export function formatMarketAuctionDate(
  date: string | null | undefined,
  language: Language,
  vehicleYear?: number | null,
  vehicleCountry?: string | null,
): string | null {
  const localized = localizeProviderDate(date, language, vehicleYear, vehicleCountry);
  if (localized) return localized;
  const trimmed = date?.trim();
  if (!trimmed) return null;
  return trimmed.match(/^(\d{4}-\d{2}-\d{2})/)?.[1] ?? trimmed;
}

export function formatMarketCurrency(value: number, currency?: string | null): string {
  const code = currency ?? "USD";
  if (code === "USD") return `$${value.toLocaleString()}`;
  return `${code} ${value.toLocaleString()}`;
}

export function marketCurrencySymbol(currency?: string | null): string {
  const code = currency ?? "USD";
  return code === "USD" ? "$" : `${code} `;
}
