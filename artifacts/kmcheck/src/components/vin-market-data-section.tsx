import { TrendingUp } from "lucide-react";
import { useMemo, type ReactNode } from "react";
import type { Language } from "@/i18n/context";
import { ReportReveal } from "@/components/report-reveal";
import { VinReportSection, VinReportSectionHeader } from "@/components/vin-report-section";
import { LazyMarketValueChart as MarketValueChart } from "@/components/lazy-market-value-chart";
import { KoreanWonAmount } from "@/components/korean-won-amount";
import { formatAmountPlain, resolveAmountDisplayCurrency } from "@/lib/korean-currency";
import {
  buildMarketChartPoints,
  formatMarketAuctionDate,
  marketValuesAreKrw,
} from "@/lib/market-chart-data";
import { cn } from "@/lib/utils";

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

type Props = {
  marketData: MarketDataSlice;
  auctionHistory?: AuctionSlice[] | null;
  t: (key: string) => string;
  language: Language;
  vehicleCountry?: string | null;
  vehicleYear?: number | null;
  krwPerUsd?: number | null;
  /** Public page uses report_* i18n keys; paid report uses shorter keys. */
  variant?: "public" | "report";
  /** ReportReveal timing — public uses delay; report often uses inView. */
  reveal?: { delay?: number; inView?: boolean };
  className?: string;
};

function MoneyValue({
  amount,
  currency,
  vehicleCountry,
  krwPerUsd,
  className,
}: {
  amount: number;
  currency?: string | null;
  vehicleCountry?: string | null;
  krwPerUsd?: number | null;
  className?: string;
}) {
  if (marketValuesAreKrw(currency, vehicleCountry, amount)) {
    return (
      <KoreanWonAmount
        krw={amount}
        krwPerUsd={krwPerUsd}
        className={cn("tabular-nums tracking-tight text-sm font-semibold", className)}
      />
    );
  }
  return (
    <span className={cn("tabular-nums tracking-tight text-sm font-semibold text-foreground", className)}>
      {formatAmountPlain(
        amount,
        resolveAmountDisplayCurrency({ currency, vehicleCountry }),
      )}
    </span>
  );
}

function Stat({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0 flex flex-col gap-0.5">
      <span className="text-[10px] sm:text-[11px] text-muted-foreground leading-none truncate">
        {label}
      </span>
      <div className="min-w-0 leading-snug">{children}</div>
    </div>
  );
}

export function VinMarketDataSection({
  marketData,
  auctionHistory,
  t,
  language,
  vehicleCountry,
  vehicleYear,
  krwPerUsd,
  variant = "report",
  reveal,
  className,
}: Props) {
  const isPublic = variant === "public";
  const title = t(isPublic ? "report_market_data" : "market_data");
  const estLabel = t(isPublic ? "report_estimated_value" : "estimated_value");
  const auctionLabel = t(isPublic ? "report_last_auction" : "last_auction_price");
  const dateLabel = t(isPublic ? "report_auction_date" : "last_auction_date");

  const hasEstimate = marketData.estimatedValue != null && marketData.estimatedValue > 0;
  const hasAuction = marketData.lastAuctionPrice != null && marketData.lastAuctionPrice > 0;
  const auctionDate = marketData.lastAuctionDate
    ? formatMarketAuctionDate(marketData.lastAuctionDate, language, vehicleYear, vehicleCountry)
    : null;

  const hasStats = hasEstimate || hasAuction || !!auctionDate;

  const hasChart = useMemo(
    () =>
      buildMarketChartPoints(
        marketData,
        auctionHistory,
        t,
        language,
        vehicleCountry,
        krwPerUsd,
      ).length > 0,
    [marketData, auctionHistory, t, language, vehicleCountry, krwPerUsd],
  );

  const stats = hasStats ? (
    <div
      className={cn(
        "flex flex-wrap gap-x-5 gap-y-2.5",
        hasChart && "pt-3.5 border-t border-border/60",
      )}
    >
      {hasEstimate ? (
        <Stat label={estLabel}>
          <MoneyValue
            amount={marketData.estimatedValue!}
            currency={marketData.currency}
            vehicleCountry={vehicleCountry}
            krwPerUsd={krwPerUsd}
            className="text-emerald-700 dark:text-emerald-400"
          />
        </Stat>
      ) : null}
      {hasAuction ? (
        <Stat label={auctionLabel}>
          <MoneyValue
            amount={marketData.lastAuctionPrice!}
            currency={marketData.currency}
            vehicleCountry={vehicleCountry}
            krwPerUsd={krwPerUsd}
          />
        </Stat>
      ) : null}
      {auctionDate ? (
        <Stat label={dateLabel}>
          <span className="text-sm font-semibold tracking-tight text-foreground">
            {auctionDate}
          </span>
        </Stat>
      ) : null}
    </div>
  ) : null;

  const body = (
    <VinReportSection accent="emerald" className={className}>
      <VinReportSectionHeader
        variant={isPublic ? "public" : "report"}
        icon={TrendingUp}
        accent="emerald"
        title={title}
      />

      <div className="px-4 sm:px-6 py-4 sm:py-5 space-y-0">
        {hasChart ? (
          <MarketValueChart
            marketData={marketData}
            auctionHistory={auctionHistory}
            t={t}
            language={language}
            vehicleCountry={vehicleCountry}
            krwPerUsd={krwPerUsd}
            className="mb-0"
            premium
          />
        ) : null}
        {stats}
      </div>
    </VinReportSection>
  );

  return (
    <ReportReveal
      delay={reveal?.delay}
      inView={reveal?.inView}
      y={reveal?.inView ? 16 : 12}
    >
      {body}
    </ReportReveal>
  );
}
