import { useState } from "react";
import { useAdminGetStats } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users, Search, DollarSign, Server, TrendingUp, TrendingDown,
  RefreshCw, ArrowRight, Clock, Car, ReceiptText, Database,
  ExternalLink, Activity,
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
  checksToday: number; cacheHitRate: number; activeProviders: number;
  checksByDay: DaySeries[]; revenueByDay: DaySeries[];
  checksByDay30: DaySeries[]; revenueByDay30: DaySeries[];
  recentPayments: RecentPayment[];
  checksThisWeek: number; checksLastWeek: number;
  pendingVinChecksOpen?: number;
  recentPendingVinChecks?: RecentPendingVin[];
};

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
    const dt = new Date();
    dt.setDate(dt.getDate() - i);
    dt.setHours(0, 0, 0, 0);
    const iso = dt.toISOString().substring(0, 10);
    result.push({
      date: iso,
      label: dt.toLocaleDateString("en", { month: "short", day: "numeric" }),
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
  icon: Icon, label, value, sub, iconColor, iconBg, trend, href, delay = 0,
}: {
  icon: React.ElementType; label: string; value: string | number | undefined; sub?: string;
  iconColor: string; iconBg: string; trend?: number | null; href?: string; delay?: number;
}) {
  const up = (trend ?? 0) >= 0;
  const body = (
    <Card className={`border shadow-sm h-full ${href ? "hover:border-primary/30 hover:shadow-md transition-all group" : ""}`}>
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
        <p className="text-2xl font-bold tabular-nums leading-none">{value ?? "—"}</p>
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

export default function AdminOverview() {
  const { data: rawStats, isLoading, refetch, isFetching } = useAdminGetStats({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query: { staleTime: 30_000, refetchInterval: 60_000 } as any,
  });
  const stats = rawStats as unknown as ExtendedStats | undefined;
  const [timeRange, setTimeRange] = useState<"7d" | "30d">("7d");

  const days = timeRange === "7d" ? 7 : 30;
  const checksSource = timeRange === "7d" ? (stats?.checksByDay ?? []) : (stats?.checksByDay30 ?? []);
  const revenueSource = timeRange === "7d" ? (stats?.revenueByDay ?? []) : (stats?.revenueByDay30 ?? []);
  const checksData = fillDays(checksSource, days, "count");
  const revenueData = fillDays(revenueSource, days, "revenue");
  const checksTrend = trendPct(stats?.checksThisWeek ?? 0, stats?.checksLastWeek ?? 0);
  const pendingOpen = stats?.pendingVinChecksOpen ?? 0;
  const recentPending = stats?.recentPendingVinChecks ?? [];

  const totalRevStr = stats?.totalRevenue != null ? `€${Number(stats.totalRevenue).toFixed(2)}` : undefined;
  const cacheStr = stats?.cacheHitRate != null ? `${stats.cacheHitRate.toFixed(1)}%` : undefined;

  if (isLoading && !stats) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-8 w-40" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-56 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Overview</h1>
          <p className="text-sm text-muted-foreground">Key metrics and VIN workflow</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching} className="gap-2 self-start">
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
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
        <KpiCard icon={Users} label="Users" value={stats?.totalUsers} iconBg="bg-blue-500/10" iconColor="text-blue-600" />
        <KpiCard icon={Search} label="VIN checks" value={stats?.totalVinChecks} iconBg="bg-primary/10" iconColor="text-primary" trend={checksTrend} sub="vs last week" />
        <KpiCard icon={DollarSign} label="Revenue" value={totalRevStr} iconBg="bg-green-500/10" iconColor="text-green-600" />
        <KpiCard icon={Clock} label="Pending queue" value={pendingOpen} href="/adminx/pending-vin-checks" iconBg={pendingOpen > 0 ? "bg-amber-500/15" : "bg-muted"} iconColor={pendingOpen > 0 ? "text-amber-600" : "text-muted-foreground"} sub={pendingOpen > 0 ? "action required" : "clear"} />
      </div>

      <div>
        <h2 className="text-sm font-semibold text-muted-foreground mb-2.5 uppercase tracking-wide">VIN workflow</h2>
        <div className="grid sm:grid-cols-2 gap-2.5">
          <WorkflowLink href="/adminx/pending-vin-checks" icon={Clock} label="Pending VIN checks" desc="Compile and publish paid manual reports" badge={pendingOpen} />
          <WorkflowLink href="/adminx/vin-catalog" icon={Database} label="VIN catalog" desc="Edit master report data and Carstat refresh" />
          <WorkflowLink href="/adminx/lookups" icon={Search} label="VIN lookups" desc="User lookup records, refresh, bulk delete" />
          <WorkflowLink href="/adminx/users" icon={Users} label="Users" desc="Accounts, bans, and per-user history" />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">Charts:</span>
        {(["7d", "30d"] as const).map(r => (
          <Button key={r} size="sm" variant={timeRange === r ? "default" : "outline"} className="h-7 px-3 text-xs" onClick={() => setTimeRange(r)}>
            {r === "7d" ? "7 days" : "30 days"}
          </Button>
        ))}
        <div className="ml-auto flex gap-3 text-xs text-muted-foreground">
          <span>{stats?.checksToday ?? 0} checks today</span>
          <span>·</span>
          <span>{cacheStr ?? "—"} cache hit</span>
          <span>·</span>
          <span>{stats?.activeProviders ?? 0} providers</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">VIN checks</CardTitle>
          </CardHeader>
          <CardContent className="pl-0 pb-4">
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={checksData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
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
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Revenue (€)</CardTitle>
          </CardHeader>
          <CardContent className="pl-0 pb-4">
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={revenueData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} interval={timeRange === "30d" ? 4 : 0} />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={36} tickFormatter={(v) => `€${v}`} />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [`€${Number(v).toFixed(2)}`, "Revenue"]} />
                <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} fill="url(#gradRevenue)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-xs font-medium truncate">{p.vin ?? "—"}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{p.email ?? p.user_id}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold">€{Number(p.amount).toFixed(2)}</p>
                      <p className="text-[10px] text-muted-foreground capitalize">{p.status}</p>
                    </div>
                  </div>
                ))}
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
  );
}
