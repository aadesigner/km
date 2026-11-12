import type { Language } from "@/i18n/context";
import {
  localizeProviderDate,
  translateProviderChartLabel,
} from "@/lib/korean-provider-text";
import {
  convertKrwToUsd,
  isKoreanCountry,
  resolveKrwPerUsd,
} from "@/lib/korean-currency";

export type MarketChartPoint = {
  label: string;
  value: number;
  kind: "estimated" | "last_auction" | "auction_history" | "range_low" | "range_high";
};

export type MarketPriceRange = {
  low: number;
  high: number;
  mid?: number | null;
  currency: string;
};

type MarketDataSlice = {
  estimatedValue?: number | null;
  lastAuctionPrice?: number | null;
  lastAuctionDate?: string | null;
  currency?: string | null;
};

type ExtraLike = {
  key?: string | null;
  label?: string | null;
  value?: string | null;
};

function parseMoneyToken(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const avg = raw.match(/avg\s*([\d,.\s]+)\s*(KRW|WON|₩)?/i);
  if (avg?.[1]) {
    const n = Number(avg[1].replace(/[,\s]/g, ""));
    if (Number.isFinite(n) && n > 0) return Math.round(n);
  }
  const plain = raw.match(/([\d,.\s]+)\s*(KRW|WON|₩)?/i);
  if (!plain?.[1]) return null;
  const n = Number(plain[1].replace(/[,\s]/g, ""));
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n);
}

/** Pull Korea insurance market low/high (and optional midpoint) out of vehicleExtras. */
export function extractMarketPriceRangeFromExtras(
  extras: ExtraLike[] | null | undefined,
): MarketPriceRange | null {
  if (!extras?.length) return null;
  let low: number | null = null;
  let high: number | null = null;
  let mid: number | null = null;

  for (const row of extras) {
    const key = (row.key ?? "").trim().toLowerCase();
    const label = (row.label ?? "").trim().toLowerCase();
    const value = row.value ?? "";
    const amount = parseMoneyToken(value);
    if (amount == null) continue;

    if (key.includes("market_price_low") || label === "market low") {
      low = amount;
      continue;
    }
    if (key.includes("market_price_high") || label === "market high") {
      high = amount;
      continue;
    }
    if (
      key === "kr_market_price"
      || label === "korean market price"
      || label.includes("korean market price")
    ) {
      mid = amount;
    }
  }

  if (low == null || high == null || high < low) return null;
  return { low, high, mid, currency: "KRW" };
}

type AuctionSlice = {
  date?: string | null;
  finalPrice?: number | null;
  currency?: string | null;
};

/** True when market figures should be treated as KRW and converted to USD for display. */
export function marketValuesAreKrw(
  currency?: string | null,
  vehicleCountry?: string | null,
  sampleValue?: number | null,
): boolean {
  const cur = (currency ?? "").toUpperCase();
  if (cur === "KRW" || cur === "WON" || cur === "₩") return true;
  if (cur === "USD" || cur === "EUR") return false;
  if (isKoreanCountry(vehicleCountry) && (sampleValue == null || sampleValue >= 100_000)) {
    return true;
  }
  return false;
}

export function toMarketDisplayUsd(
  value: number,
  opts: {
    currency?: string | null;
    vehicleCountry?: string | null;
    krwPerUsd?: number | null;
  },
): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  if (!marketValuesAreKrw(opts.currency, opts.vehicleCountry, value)) {
    return Math.round(value);
  }
  const rate = resolveKrwPerUsd(opts.krwPerUsd);
  const usd = convertKrwToUsd(value, rate);
  return usd > 0 ? Math.round(usd) : Math.round(value);
}

export function buildMarketChartPoints(
  marketData: MarketDataSlice | null | undefined,
  auctionHistory: AuctionSlice[] | null | undefined,
  t: (key: string) => string,
  language: Language,
  vehicleCountry?: string | null,
  krwPerUsd?: number | null,
  priceRange?: MarketPriceRange | null,
): MarketChartPoint[] {
  const currency = priceRange?.currency ?? marketData?.currency ?? null;
  const toUsd = (v: number) =>
    toMarketDisplayUsd(v, { currency, vehicleCountry, krwPerUsd });

  const history = (auctionHistory ?? [])
    .filter((e) => e.finalPrice != null && e.finalPrice > 0)
    .sort((a, b) => (a.date ?? "").localeCompare(b.date ?? ""));

  // Prefer rows in the marketData currency so KRW millions never plot as EUR/USD.
  const marketCur = (currency ?? "").toUpperCase();
  const historyForChart = marketCur
    ? history.filter((e) => !e.currency || String(e.currency).toUpperCase() === marketCur)
    : history;

  if (historyForChart.length >= 2) {
    return historyForChart.map((e, i) => ({
      label: translateProviderChartLabel(e.date, language, vehicleCountry) ?? String(i + 1),
      value: toMarketDisplayUsd(e.finalPrice!, {
        currency: e.currency ?? currency,
        vehicleCountry,
        krwPerUsd,
      }),
      kind: "auction_history",
    }));
  }

  const points: MarketChartPoint[] = [];
  const est =
    marketData?.estimatedValue
    ?? (priceRange?.mid != null && priceRange.mid > 0 ? priceRange.mid : null);
  const auction = marketData?.lastAuctionPrice;

  if (priceRange && priceRange.low > 0 && priceRange.high >= priceRange.low) {
    points.push({ label: t("chart_price_low"), value: toUsd(priceRange.low), kind: "range_low" });
    if (est != null && est > 0) {
      points.push({ label: t("chart_est_value"), value: toUsd(est), kind: "estimated" });
    }
    points.push({ label: t("chart_price_high"), value: toUsd(priceRange.high), kind: "range_high" });
    return points;
  }

  if (est != null && est > 0) {
    points.push({ label: t("chart_est_value"), value: toUsd(est), kind: "estimated" });
  }
  if (auction != null && auction > 0) {
    const auctionLabel =
      translateProviderChartLabel(marketData?.lastAuctionDate, language, vehicleCountry)
      ?? localizeProviderDate(marketData?.lastAuctionDate, language, undefined, vehicleCountry)
      ?? t("chart_last_auction");
    points.push({ label: auctionLabel, value: toUsd(auction), kind: "last_auction" });
  }

  if (points.length === 0 && historyForChart.length === 1) {
    points.push({
      label: translateProviderChartLabel(historyForChart[0].date, language, vehicleCountry) ?? "1",
      value: toMarketDisplayUsd(historyForChart[0].finalPrice!, {
        currency: historyForChart[0].currency ?? currency,
        vehicleCountry,
        krwPerUsd,
      }),
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
  return localizeProviderDate(date, language, vehicleYear, vehicleCountry);
}

export function formatMarketCurrency(value: number, currency?: string | null): string {
  const n = Math.round(Number.isFinite(value) ? value : 0);
  const code = (currency ?? "USD").toUpperCase();
  if (code === "USD" || code === "$") return `$${n.toLocaleString()}`;
  if (code === "EUR" || code === "€") return `€${n.toLocaleString()}`;
  if (code === "KRW" || code === "WON" || code === "₩") return `₩${n.toLocaleString()}`;
  return `${code} ${n.toLocaleString()}`;
}

export function marketCurrencySymbol(currency?: string | null): string {
  const code = currency ?? "USD";
  return code === "USD" ? "$" : `${code} `;
}
