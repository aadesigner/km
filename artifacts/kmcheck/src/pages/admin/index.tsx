import { useState, useMemo } from "react";
import { useAdminGetStats } from "@workspace/api-client-react";
import { ADMIN_QUERY_OPTIONS } from "@/lib/admin-query-options";
import { AdminQueryFallback } from "@/components/admin-query-fallback";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users, Search, DollarSign, Server, TrendingUp, TrendingDown,
  RefreshCw, ArrowRight, Clock, Car, ReceiptText, Database,
  ExternalLink, Activity, UserPlus, Zap, BarChart3,
} from "lucide-react";
import { Link } from "wouter";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import { motion } from "framer-motion";

type DaySeries = { date: string; count?: number; revenue?: number };
type RecentPayment = {
  id: number; user_id: string; vin: string | null; amount: number;
  currency: string; status: string; created_at: string;
  email: string | null; name: string | null;
};
type RecentPendingVin = {
  id: number;
  vin: string;
  createdAt: string;
  updatedAt: string;
  requestCount: number;
  year?: number | null;
  make?: string | null;
  model?: string | null;
};

type ExtendedStats = {
  totalUsers: number; totalVinChecks: number; totalRevenue: number;
  qualifyingPaymentCount?: number; avgOrderValue?: number;
  revenueThisWeek?: number; revenueLastWeek?: number; revenueThisMonth?: number;
  signupsThisWeek?: number;
  checksToday: number; cacheHitRate: number; activeProviders: number;
  checksByDay: DaySeries[]; revenueByDay: DaySeries[];
  checksByDay30: DaySeries[]; revenueByDay30: DaySeries[];
  usersByDay?: DaySeries[];
  paymentStatusCounts?: Array<{ status: string; count: number }>;
  recentPayments: RecentPayment[];
  checksThisWeek: number; checksLastWeek: number;
  pendingVinChecksOpen?: number;
  recentPendingVinChecks?: RecentPendingVin[];
};

function utcDateKeyDaysAgo(daysAgo: number): string {
  const dt = new Date();
  dt.setUTCDate(dt.getUTCDate() - daysAgo);
  return dt.toISOString().substring(0, 10);
}

function sumSeriesValues(data: Array<{ value: number }>): number {
  return data.reduce((sum, row) => sum + row.value, 0);
}

function fmtEuro(amount: number): string {
  return `€${amount.toLocaleString("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fillDays(
  data: DaySeries[], days: number, key: "count" | "revenue"
): Array<{ date: string; label: string; value: number }> {
  const map = new Map<string, number>();
  data.forEach(row => {
    const d = String(row.date).substring(0, 10);
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

function trendPct(current: number, prev: number): number | null {
  if (prev === 0) return current > 0 ? 100 : null;
  return Math.round(((current - prev) / prev) * 100);
}

function KpiCard({
  icon: Icon, label, value, sub, iconColor, iconBg, trend, href, delay = 0, className,
}: {
  icon: React.ElementType; label: string; value: string | number | undefined; sub?: string;
  iconColor: string; iconBg: string; trend?: number | null; href?: string; delay?: number;
  className?: string;
}) {
  const up = (trend ?? 0) >= 0;
  const body = (
    <Card className={`border shadow-sm h-full ${href ? "hover:border-primary/30 hover:shadow-md transition-all group" : ""} ${className ?? ""}`}>
      <CardContent className="pt-4 pb-3.5 px-4">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className={`h-9 w-9 rounded-lg ${iconBg} flex items-center justify-center shrink-0`}>
            <Icon className={`h-4 w-4 ${iconColor}`} />
          </div>
          {trend != null && (
            <span className={`flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${up ? "bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400" : "bg-red-50 text-red-500 dark:bg-red-950 dark:text-red-400"}`}>
              {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {Math.abs(trend)}%
            </span>
          )}
        </div>
        <p className="text-xl sm:text-2xl font-bold tabular-nums leading-none">{value ?? "—"}</p>
        <p className="text-xs text-muted-foreground mt-1">{label}</p>
        {sub && <p className="text-[11px] text-muted-foreground/70 mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  );
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
      {href ? <Link href={href}>{body}</Link> : body}
    </motion.div>
  );
}

type HeroRange = "today" | "week" | "month";

const HERO_RANGES: { id: HeroRange; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "week", label: "Week" },
  { id: "month", label: "Month" },
];

function SalesHeroCard({
  range,
  onRangeChange,
  sales,
  signups,
  checks,
  avgOrder,
  weekTrend,
}: {
  range: HeroRange;
  onRangeChange: (r: HeroRange) => void;
  sales: number;
  signups: number;
  checks: number;
  avgOrder: number;
  weekTrend: number | null;
}) {
  const up = (weekTrend ?? 0) >= 0;
  const rangeLabel = range === "today" ? "Today" : range === "week" ? "This week" : "This month";
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-0 shadow-md overflow-hidden bg-gradient-to-br from-primary/90 via-primary to-primary/80 text-primary-foreground">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-between gap-3 mb-4">
            <p className="text-xs sm:text-sm font-medium text-primary-foreground/80 uppercase tracking-wide">
              Performance
            </p>
            <div
              className="inline-flex rounded-full bg-black/15 p-0.5 backdrop-blur-sm"
              role="tablist"
              aria-label="Hero timeframe"
            >
              {HERO_RANGES.map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={range === id}
                  onClick={() => onRangeChange(id)}
                  className={`px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-semibold transition-colors ${
                    range === id
                      ? "bg-white text-primary shadow-sm"
                      : "text-primary-foreground/80 hover:text-primary-foreground"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs text-primary-foreground/75">{rangeLabel} sales</p>
              <p className="text-3xl sm:text-4xl font-bold tabular-nums mt-1">{fmtEuro(sales)}</p>
              {range === "week" && weekTrend != null && (
                <p className={`flex items-center gap-1 text-xs sm:text-sm mt-2 ${up ? "text-green-100" : "text-red-100"}`}>
                  {up ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                  {Math.abs(weekTrend)}% vs last week
                </p>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full sm:w-auto sm:min-w-[300px]">
              {[
                { label: `${rangeLabel} registrations`, value: String(signups) },
                { label: `${rangeLabel} checks`, value: String(checks) },
                { label: "Avg paid order", value: fmtEuro(avgOrder) },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-lg bg-white/10 backdrop-blur px-2.5 py-2 sm:px-3 sm:py-2.5 text-center">
                  <p className="text-[10px] sm:text-xs text-primary-foreground/75 leading-tight">{label}</p>
                  <p className="text-sm sm:text-base font-semibold tabular-nums mt-0.5 truncate">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function HealthPill({ label, value, ok }: { label: string; value: string; ok?: boolean }) {
  return (
    <div className="flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-xs shrink-0">
      <span className={`h-1.5 w-1.5 rounded-full ${ok === false ? "bg-amber-500" : "bg-green-500"}`} />
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold tabular-nums">{value}</span>
    </div>
  );
}

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  completed: "bg-green-500",
  pending: "bg-amber-500",
  failed: "bg-red-500",
  revoked: "bg-orange-500",
};

function PaymentStatusBars({ counts }: { counts: Array<{ status: string; count: number }> }) {
  const total = counts.reduce((s, r) => s + r.count, 0) || 1;
  return (
    <div className="space-y-3">
      {counts.map((row) => {
        const pct = Math.round((row.count / total) * 100);
        return (
          <div key={row.status}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="capitalize text-muted-foreground">{row.status}</span>
              <span className="font-semibold tabular-nums">
                {row.count} <span className="text-muted-foreground font-normal">({pct}%)</span>
              </span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full ${PAYMENT_STATUS_COLORS[row.status] ?? "bg-primary"}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function WorkflowLink({
  href, icon: Icon, label, desc, badge,
}: { href: string; icon: React.ElementType; label: string; desc: string; badge?: number }) {
  return (
    <Link
      href={href}
      className="flex items-start gap-3 rounded-xl border bg-card p-4 hover:border-primary/40 hover:bg-muted/30 transition-all group"
    >
      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/15">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-sm">{label}</p>
          {badge != null && badge > 0 && (
            <Badge className="bg-amber-500 hover:bg-amber-500 text-white border-0 text-[10px] h-5 px-1.5">{badge}</Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{desc}</p>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary shrink-0 mt-0.5" />
    </Link>
  );
}

const TOOLTIP_STYLE = {
  fontSize: 12, borderRadius: 8,
  border: "1px solid hsl(var(--border))",
  background: "hsl(var(--background))",
};

function sumSeriesInUtcWindow(
  source: DaySeries[],
  key: "count" | "revenue",
  fromIsoInclusive: string,
): number {
  let total = 0;
  for (const row of source) {
    const d = String(row.date).substring(0, 10);
    if (d < fromIsoInclusive) continue;
    total += Number((row as Record<string, unknown>)[key] ?? 0);
  }
  return total;
}

export default function AdminOverview() {
  const { data: rawStats, isLoading, isError, error, refetch, isFetching } = useAdminGetStats({
    query: { ...ADMIN_QUERY_OPTIONS, refetchInterval: 60_000 },
  });
  const stats = rawStats as unknown as ExtendedStats | undefined;
  const [timeRange, setTimeRange] = useState<"7d" | "30d">("7d");
  const [heroRange, setHeroRange] = useState<HeroRange>("today");

  const derived = useMemo(() => {
    if (!stats) return null;

    const days = timeRange === "7d" ? 7 : 30;
    const checksSource = timeRange === "7d" ? (stats.checksByDay ?? []) : (stats.checksByDay30 ?? []);
    const revenueSource = timeRange === "7d" ? (stats.revenueByDay ?? []) : (stats.revenueByDay30 ?? []);
    const usersSource = stats.usersByDay ?? [];
    const revenue30Source = stats.revenueByDay30 ?? [];
    const checks30Source = stats.checksByDay30 ?? [];

    const checksData = fillDays(checksSource, days, "count");
    const revenueData = fillDays(revenueSource, days, "revenue");
    const usersData = fillDays(usersSource, days, "count");
    const weekRevenue = stats.revenueThisWeek ?? 0;
    const lastWeekRevenue = stats.revenueLastWeek ?? 0;
    const monthRevenue = stats.revenueThisMonth ?? 0;
    const signupsThisWeek = stats.signupsThisWeek ?? 0;

    const todayIso = utcDateKeyDaysAgo(0);
    const weekStartIso = utcDateKeyDaysAgo(6);
    const monthStartIso = (() => {
      const now = new Date();
      return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-01`;
    })();

    const salesToday = sumSeriesInUtcWindow(revenue30Source, "revenue", todayIso);
    const signupsToday = sumSeriesInUtcWindow(usersSource, "count", todayIso);
    const checksToday = stats.checksToday ?? sumSeriesInUtcWindow(checks30Source, "count", todayIso);
    const signupsMonth = sumSeriesInUtcWindow(usersSource, "count", monthStartIso);
    const checksMonth = sumSeriesInUtcWindow(checks30Source, "count", monthStartIso);
    // usersByDay is 30d — week total from series (prefer server weekly when available for week)
    const signupsWeekFromSeries = sumSeriesInUtcWindow(usersSource, "count", weekStartIso);
    const checksWeekFromSeries = sumSeriesInUtcWindow(checks30Source, "count", weekStartIso);

    const hero = {
      today: {
        sales: salesToday,
        signups: signupsToday,
        checks: checksToday,
      },
      week: {
        sales: weekRevenue,
        signups: signupsThisWeek || signupsWeekFromSeries,
        checks: stats.checksThisWeek ?? checksWeekFromSeries,
      },
      month: {
        sales: monthRevenue,
        signups: signupsMonth,
        checks: checksMonth,
      },
    } as const;

    return {
      days,
      checksData,
      revenueData,
      usersData,
      checksTrend: trendPct(stats.checksThisWeek ?? 0, stats.checksLastWeek ?? 0),
      pendingOpen: stats.pendingVinChecksOpen ?? 0,
      recentPending: stats.recentPendingVinChecks ?? [],
      weekRevenue,
      revenueWeekTrend: trendPct(weekRevenue, lastWeekRevenue),
      monthRevenue,
      revenue30dTotal: sumSeriesValues(revenueData),
      signupsThisWeek,
      avgOrder: stats.avgOrderValue ?? 0,
      totalRevStr: stats.totalRevenue != null ? fmtEuro(Number(stats.totalRevenue)) : undefined,
      cacheStr: stats.cacheHitRate != null ? `${stats.cacheHitRate.toFixed(1)}%` : undefined,
      hero,
    };
  }, [stats, timeRange]);

  const pendingOpen = derived?.pendingOpen ?? 0;
  const recentPending = derived?.recentPending ?? [];

  return (
    <AdminQueryFallback
      isLoading={isLoading}
      isError={isError}
      isFetching={isFetching}
      error={error}
      refetch={refetch}
      hasData={!!stats}
      message="Failed to load overview"
      skeleton={(
        <div className="space-y-5">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-36 rounded-xl" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
          <Skeleton className="h-56 rounded-xl" />
        </div>
      )}
    >
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Live sales, checks, and operations</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching} className="gap-2 self-start">
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <SalesHeroCard
        range={heroRange}
        onRangeChange={setHeroRange}
        sales={derived?.hero[heroRange].sales ?? 0}
        signups={derived?.hero[heroRange].signups ?? 0}
        checks={derived?.hero[heroRange].checks ?? 0}
        avgOrder={derived?.avgOrder ?? 0}
        weekTrend={derived?.revenueWeekTrend ?? null}
      />

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
        <HealthPill label="Cache hit" value={derived?.cacheStr ?? "—"} ok={(stats?.cacheHitRate ?? 0) >= 50} />
        <HealthPill label="Providers" value={String(stats?.activeProviders ?? 0)} ok={(stats?.activeProviders ?? 0) > 0} />
        <HealthPill label="Checks this week" value={String(stats?.checksThisWeek ?? 0)} />
        <HealthPill label="Signups this week" value={String(derived?.signupsThisWeek ?? 0)} />
      </div>

      {pendingOpen > 0 && (
        <Link href="/adminx/pending-vin-checks">
          <Card className="border-amber-300/50 bg-amber-50/80 dark:bg-amber-950/20 hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="py-3.5 px-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-500/15 flex items-center justify-center shrink-0">
                <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm">{pendingOpen} pending VIN report{pendingOpen === 1 ? "" : "s"} need publishing</p>
                <p className="text-xs text-muted-foreground">Review paid reports, edit data, publish to catalog</p>
              </div>
              <ArrowRight className="h-4 w-4 text-amber-600 shrink-0" />
            </CardContent>
          </Card>
        </Link>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard icon={DollarSign} label="All-time revenue" value={derived?.totalRevStr} iconBg="bg-green-500/10" iconColor="text-green-600" delay={0.05} />
        <KpiCard icon={Search} label="VIN checks" value={stats?.totalVinChecks} iconBg="bg-primary/10" iconColor="text-primary" trend={derived?.checksTrend} sub="vs last week" delay={0.1} />
        <KpiCard icon={Users} label="Users" value={stats?.totalUsers} iconBg="bg-blue-500/10" iconColor="text-blue-600" sub={`+${derived?.signupsThisWeek ?? 0} this week`} delay={0.15} />
        <KpiCard icon={Clock} label="Pending queue" value={pendingOpen} href="/adminx/pending-vin-checks" iconBg={pendingOpen > 0 ? "bg-amber-500/15" : "bg-muted"} iconColor={pendingOpen > 0 ? "text-amber-600" : "text-muted-foreground"} sub={pendingOpen > 0 ? "action required" : "clear"} delay={0.2} />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Trends</h2>
        <div className="flex gap-1.5">
          {(["7d", "30d"] as const).map(r => (
            <Button key={r} size="sm" variant={timeRange === r ? "default" : "outline"} className="h-8 px-3 text-xs flex-1 sm:flex-none" onClick={() => setTimeRange(r)}>
              {r === "7d" ? "7 days" : "30 days"}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="border shadow-sm lg:col-span-2">
          <CardHeader className="pb-2 flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-blue-600" />
              Revenue
            </CardTitle>
            <span className="text-xs text-muted-foreground tabular-nums">
              {timeRange === "7d" ? fmtEuro(derived?.weekRevenue ?? 0) : fmtEuro(derived?.revenue30dTotal ?? 0)} total
            </span>
          </CardHeader>
          <CardContent className="pl-0 pb-4">
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={derived?.revenueData ?? []} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} interval={timeRange === "30d" ? 4 : 0} />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={40} tickFormatter={(v) => `€${v}`} />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [fmtEuro(Number(v)), "Revenue"]} />
                <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} fill="url(#gradRevenue)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <ReceiptText className="h-4 w-4 text-muted-foreground" />
              Payment status
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            {!stats?.paymentStatusCounts?.length ? (
              <p className="text-sm text-muted-foreground text-center py-10">No payment data</p>
            ) : (
              <PaymentStatusBars counts={stats.paymentStatusCounts} />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border shadow-sm">
          <CardHeader className="pb-2 flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Zap className="h-4 w-4 text-green-600" />
              VIN checks
            </CardTitle>
            <span className="text-xs text-muted-foreground">{stats?.checksThisWeek ?? 0} this week</span>
          </CardHeader>
          <CardContent className="pl-0 pb-4">
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={derived?.checksData ?? []} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradChecks" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} interval={timeRange === "30d" ? 4 : 0} />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} width={28} />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [v, "Checks"]} />
                <Area type="monotone" dataKey="value" stroke="#22c55e" strokeWidth={2} fill="url(#gradChecks)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="pb-2 flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-blue-600" />
              New signups
            </CardTitle>
            <span className="text-xs text-muted-foreground">+{derived?.signupsThisWeek ?? 0} this week</span>
          </CardHeader>
          <CardContent className="pl-0 pb-4">
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={derived?.usersData ?? []} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} interval={timeRange === "30d" ? 4 : 0} />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} width={28} />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [v, "Signups"]} />
                <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2} fill="url(#gradUsers)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-muted-foreground mb-2.5 uppercase tracking-wide">Quick actions</h2>
        <div className="grid sm:grid-cols-2 gap-2.5">
          <WorkflowLink href="/adminx/pending-vin-checks" icon={Clock} label="Pending VIN checks" desc="Compile and publish paid manual reports" badge={pendingOpen} />
          <WorkflowLink href="/adminx/vin-catalog" icon={Database} label="VIN catalog" desc="Edit master report data and Carstat refresh" />
          <WorkflowLink href="/adminx/lookups" icon={Search} label="VIN lookups" desc="User lookup records, refresh, bulk delete" />
          <WorkflowLink href="/adminx/users" icon={Users} label="Users" desc="Accounts, bans, and per-user history" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border shadow-sm">
          <CardHeader className="pb-2 flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold">Recent payments</CardTitle>
            <Link href="/adminx/transactions" className="text-xs text-muted-foreground hover:text-foreground">View all</Link>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            {!stats?.recentPayments?.length ? (
              <p className="text-sm text-muted-foreground text-center py-8 px-4">No payments yet</p>
            ) : (
              <div className="divide-y">
                {stats.recentPayments.slice(0, 6).map((p) => (
                  <div key={p.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                      <DollarSign className="h-3.5 w-3.5 text-green-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-xs font-medium truncate">{p.vin ?? "—"}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{p.email ?? p.user_id}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold tabular-nums">{fmtEuro(Number(p.amount))}</p>
                      <p className="text-[10px] text-muted-foreground capitalize">{p.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="pb-2 flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold">Pending queue</CardTitle>
            <Link href="/adminx/pending-vin-checks" className="text-xs text-muted-foreground hover:text-foreground">View all</Link>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            {recentPending.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8 px-4">No VINs waiting</p>
            ) : (
              <div className="divide-y">
                {recentPending.map((p) => {
                  const title = p.year && p.make && p.model ? `${p.year} ${p.make} ${p.model}` : p.vin;
                  return (
                    <Link key={p.id} href={`/adminx/pending-vin-checks/${p.id}`}>
                      <div className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors">
                        <Car className="h-4 w-4 text-amber-500 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{title}</p>
                          <p className="font-mono text-[11px] text-muted-foreground">{p.vin}</p>
                        </div>
                        <span className="text-[11px] text-muted-foreground shrink-0">{p.requestCount} user{p.requestCount === 1 ? "" : "s"}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3 pt-1 border-t text-sm">
        <Link href="/adminx/analytics" className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground">
          <Activity className="h-3.5 w-3.5" /> Full analytics
        </Link>
        <Link href="/adminx/transactions" className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground">
          <ReceiptText className="h-3.5 w-3.5" /> Transactions
        </Link>
        <Link href="/adminx/security" className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground">
          <Server className="h-3.5 w-3.5" /> Security & logs
        </Link>
        <Link href="/adminx/plugins" className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground">
          <ExternalLink className="h-3.5 w-3.5" /> Geo language redirect
        </Link>
      </div>
    </div>
    </AdminQueryFallback>
  );
}
