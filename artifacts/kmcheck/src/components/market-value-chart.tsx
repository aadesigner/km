import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { cn } from "@/lib/utils";
import type { Language } from "@/i18n/context";
import {
  buildMarketChartPoints,
  formatMarketCurrency,
  marketCurrencySymbol,
  type MarketChartPoint,
} from "@/lib/market-chart-data";

type MarketDataSlice = {
  estimatedValue?: number | null;
  currency?: string | null;
  lastAuctionPrice?: number | null;
  lastAuctionDate?: string | null;
};

type AuctionSlice = {
  date?: string | null;
  finalPrice?: number | null;
};

type MarketValueChartProps = {
  marketData: MarketDataSlice | null | undefined;
  auctionHistory?: AuctionSlice[] | null;
  t: (key: string) => string;
  language: Language;
  vehicleCountry?: string | null;
  className?: string;
};

function tooltipLabel(kind: MarketChartPoint["kind"], t: (key: string) => string): string {
  if (kind === "estimated") return t("estimated_value");
  return t("last_auction_price");
}

export function MarketValueChart({ marketData, auctionHistory, t, language, vehicleCountry, className }: MarketValueChartProps) {
  const points = buildMarketChartPoints(marketData, auctionHistory, t, language, vehicleCountry);
  if (points.length === 0) return null;

  const symbol = marketCurrencySymbol(marketData?.currency);
  const currency = marketData?.currency ?? "USD";

  return (
    <div className={cn("h-36 print-hide-chart", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={points} margin={{ top: 8, right: 6, left: -18, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.45} vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
          <YAxis
            tick={{ fontSize: 9 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => `${symbol}${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip
            formatter={(v: number, _name, item) => {
              const kind = (item.payload as MarketChartPoint).kind;
              return [formatMarketCurrency(v, currency), tooltipLabel(kind, t)];
            }}
            contentStyle={{ fontSize: 11, borderRadius: 8 }}
          />
          <Bar dataKey="value" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} maxBarSize={36} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
