export type DaySeries = { date: string; count?: number; revenue?: number };

export type DashboardPeriod = "today" | "yesterday" | "week" | "month" | "quarter";

export type ChartMetric = "revenue" | "checks" | "signups";

export type ChartRange = 7 | 30 | 90;

export type ExtendedStats = {
  totalUsers: number;
  totalVinChecks: number;
  totalRevenue: number;
  qualifyingPaymentCount?: number;
  avgOrderValue?: number;
  revenueThisWeek?: number;
  revenueLastWeek?: number;
  revenueThisMonth?: number;
  revenueLastMonth?: number;
  revenueToday?: number;
  revenueYesterday?: number;
  signupsThisWeek?: number;
  signupsLastWeek?: number;
  signupsThisMonth?: number;
  signupsLastMonth?: number;
  signupsToday?: number;
  signupsYesterday?: number;
  checksToday: number;
  checksYesterday?: number;
  cacheHitRate: number;
  activeProviders: number;
  checksByDay: DaySeries[];
  revenueByDay: DaySeries[];
  checksByDay30?: DaySeries[];
  revenueByDay30?: DaySeries[];
  checksByDay90?: DaySeries[];
  revenueByDay90?: DaySeries[];
  usersByDay?: DaySeries[];
  usersByDay90?: DaySeries[];
  paymentStatusCounts?: Array<{ status: string; count: number }>;
  recentPayments: Array<{
    id: number;
    user_id: string;
    vin: string | null;
    amount: number;
    currency: string;
    status: string;
    created_at: string;
    email: string | null;
    name: string | null;
  }>;
  checksThisWeek: number;
  checksLastWeek: number;
  checksThisMonth?: number;
  checksLastMonth?: number;
  pendingVinChecksOpen?: number;
  recentPendingVinChecks?: Array<{
    id: number;
    vin: string;
    createdAt: string;
    updatedAt: string;
    requestCount: number;
    year?: number | null;
    make?: string | null;
    model?: string | null;
  }>;
  onlinePresence?: {
    onlineNow: number;
    activeToday: number;
    activeYesterday: number;
    activeThisMonth: number;
    usersOnlineNow: Array<{
      id: string;
      email: string;
      name: string | null;
      lastSeenAt: string;
      lastSeenPath: string | null;
    }>;
  };
};

export function utcDateKeyDaysAgo(daysAgo: number): string {
  const dt = new Date();
  dt.setUTCDate(dt.getUTCDate() - daysAgo);
  return dt.toISOString().substring(0, 10);
}

export function fmtEuro(amount: number): string {
  return `€${amount.toLocaleString("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function fmtCompact(amount: number): string {
  if (amount >= 1000) return `€${(amount / 1000).toFixed(1)}k`;
  return fmtEuro(amount);
}

export function trendPct(current: number, prev: number): number | null {
  if (prev === 0) return current > 0 ? 100 : null;
  return Math.round(((current - prev) / prev) * 100);
}

export function normalizeDayKey(value: unknown): string {
  if (value == null) return "";
  if (value instanceof Date) return value.toISOString().substring(0, 10);
  return String(value).substring(0, 10);
}

export function fillDays(
  data: DaySeries[],
  days: number,
  key: "count" | "revenue",
): Array<{ date: string; label: string; value: number }> {
  const map = new Map<string, number>();
  data.forEach((row) => {
    const d = normalizeDayKey(row.date);
    if (!d) return;
    map.set(d, Number((row as Record<string, unknown>)[key] ?? 0));
  });
  const result = [];
  for (let i = days - 1; i >= 0; i--) {
    const iso = utcDateKeyDaysAgo(i);
    const dt = new Date(`${iso}T12:00:00Z`);
    result.push({
      date: iso,
      label: dt.toLocaleDateString("en", { month: "short", day: "numeric", timeZone: "UTC" }),
      value: map.get(iso) ?? 0,
    });
  }
  return result;
}

export function sumSeriesInUtcWindow(
  source: DaySeries[],
  key: "count" | "revenue",
  fromIsoInclusive: string,
  toIsoExclusive?: string,
): number {
  let total = 0;
  for (const row of source) {
    const d = normalizeDayKey(row.date);
    if (!d || d < fromIsoInclusive) continue;
    if (toIsoExclusive && d >= toIsoExclusive) continue;
    total += Number((row as Record<string, unknown>)[key] ?? 0);
  }
  return total;
}

export type PeriodMetrics = {
  revenue: number;
  checks: number;
  signups: number;
  revenueTrend: number | null;
  checksTrend: number | null;
  signupsTrend: number | null;
};

export function derivePeriodMetrics(stats: ExtendedStats, period: DashboardPeriod): PeriodMetrics {
  const checksSeries = stats.checksByDay90 ?? stats.checksByDay30 ?? [];
  const revenueSeries = stats.revenueByDay90 ?? stats.revenueByDay30 ?? [];
  const usersSeries = stats.usersByDay90 ?? stats.usersByDay ?? [];

  const todayIso = utcDateKeyDaysAgo(0);
  const yesterdayIso = utcDateKeyDaysAgo(1);
  const weekStartIso = utcDateKeyDaysAgo(6);
  const monthStartIso = (() => {
    const now = new Date();
    return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-01`;
  })();
  const quarterStartIso = utcDateKeyDaysAgo(89);

  switch (period) {
    case "today":
      return {
        revenue: stats.revenueToday ?? sumSeriesInUtcWindow(revenueSeries, "revenue", todayIso),
        checks: stats.checksToday ?? sumSeriesInUtcWindow(checksSeries, "count", todayIso),
        signups: stats.signupsToday ?? sumSeriesInUtcWindow(usersSeries, "count", todayIso),
        revenueTrend: trendPct(
          stats.revenueToday ?? 0,
          stats.revenueYesterday ?? 0,
        ),
        checksTrend: trendPct(stats.checksToday ?? 0, stats.checksYesterday ?? 0),
        signupsTrend: trendPct(stats.signupsToday ?? 0, stats.signupsYesterday ?? 0),
      };
    case "yesterday":
      return {
        revenue: stats.revenueYesterday ?? sumSeriesInUtcWindow(
          revenueSeries, "revenue", yesterdayIso, todayIso,
        ),
        checks: stats.checksYesterday ?? sumSeriesInUtcWindow(
          checksSeries, "count", yesterdayIso, todayIso,
        ),
        signups: stats.signupsYesterday ?? sumSeriesInUtcWindow(
          usersSeries, "count", yesterdayIso, todayIso,
        ),
        revenueTrend: null,
        checksTrend: null,
        signupsTrend: null,
      };
    case "week":
      return {
        revenue: stats.revenueThisWeek ?? sumSeriesInUtcWindow(revenueSeries, "revenue", weekStartIso),
        checks: stats.checksThisWeek ?? sumSeriesInUtcWindow(checksSeries, "count", weekStartIso),
        signups: stats.signupsThisWeek ?? sumSeriesInUtcWindow(usersSeries, "count", weekStartIso),
        revenueTrend: trendPct(stats.revenueThisWeek ?? 0, stats.revenueLastWeek ?? 0),
        checksTrend: trendPct(stats.checksThisWeek ?? 0, stats.checksLastWeek ?? 0),
        signupsTrend: trendPct(stats.signupsThisWeek ?? 0, stats.signupsLastWeek ?? 0),
      };
    case "month":
      return {
        revenue: stats.revenueThisMonth ?? sumSeriesInUtcWindow(revenueSeries, "revenue", monthStartIso),
        checks: stats.checksThisMonth ?? sumSeriesInUtcWindow(checksSeries, "count", monthStartIso),
        signups: stats.signupsThisMonth ?? sumSeriesInUtcWindow(usersSeries, "count", monthStartIso),
        revenueTrend: trendPct(stats.revenueThisMonth ?? 0, stats.revenueLastMonth ?? 0),
        checksTrend: trendPct(stats.checksThisMonth ?? 0, stats.checksLastMonth ?? 0),
        signupsTrend: trendPct(stats.signupsThisMonth ?? 0, stats.signupsLastMonth ?? 0),
      };
    case "quarter":
      return {
        revenue: sumSeriesInUtcWindow(revenueSeries, "revenue", quarterStartIso),
        checks: sumSeriesInUtcWindow(checksSeries, "count", quarterStartIso),
        signups: sumSeriesInUtcWindow(usersSeries, "count", quarterStartIso),
        revenueTrend: null,
        checksTrend: null,
        signupsTrend: null,
      };
  }
}

export const PERIOD_LABELS: Record<DashboardPeriod, string> = {
  today: "Today",
  yesterday: "Yesterday",
  week: "This week",
  month: "This month",
  quarter: "Last 90 days",
};

export const PERIOD_COMPARE_LABEL: Partial<Record<DashboardPeriod, string>> = {
  today: "vs yesterday",
  week: "vs last week",
  month: "vs last month",
};
