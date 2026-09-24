import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";
import {
  fmtEuro,
  fmtCompact,
  trendPct,
  PAYMENT_METHOD_LABELS,
  type CountryCountRow,
  type PaymentMethodStat,
} from "@/lib/admin-dashboard-stats";
import { userCountryLabel } from "@/lib/user-countries";
import { cn } from "@/lib/utils";

const BRAND = "hsl(142, 76%, 36%)";

const METHOD_ACCENT: Record<PaymentMethodStat["method"], string> = {
  paypal: "hsl(211, 85%, 48%)",
  pok: "hsl(262, 58%, 52%)",
  credit: "hsl(142, 62%, 38%)",
  free: "hsl(215, 14%, 52%)",
};

function countryDisplayName(countryCode: string): string {
  const code = countryCode.trim();
  if (!code || code === "—" || code === "-" || code.toLowerCase() === "unknown") {
    return "No country set";
  }
  return userCountryLabel(code) ?? code;
}

function axisCode(countryCode: string, name: string): string {
  const code = countryCode.trim().toUpperCase();
  if (code.length === 2) return code;
  return name.length > 8 ? `${name.slice(0, 7)}…` : name;
}

type ChartRow = {
  key: string;
  name: string;
  axis: string;
  count: number;
  prevCount: number;
  deltaPct: number | null;
  fill: string;
  revenue?: number;
};

function CustomTooltip({
  active,
  payload,
  valueLabel,
  showRevenue,
}: {
  active?: boolean;
  payload?: Array<{ payload: ChartRow }>;
  valueLabel: string;
  showRevenue?: boolean;
}) {
  if (!active || !payload?.[0]) return null;
  const row = payload[0].payload;
  const delta =
    row.deltaPct == null
      ? null
      : row.deltaPct === 0
        ? "0%"
        : `${row.deltaPct > 0 ? "+" : ""}${row.deltaPct}%`;

  return (
    <div className="rounded-lg border border-border/60 bg-popover/95 px-3 py-2 shadow-lg backdrop-blur-sm">
      <p className="text-[11px] font-medium text-foreground">{row.name}</p>
      <p className="mt-0.5 tabular-nums text-[12px] text-muted-foreground">
        <span className="font-semibold text-foreground">{row.count}</span>
        {" "}
        {valueLabel}
        {showRevenue && row.revenue != null ? (
          <span className="text-muted-foreground"> · {fmtEuro(row.revenue)}</span>
        ) : null}
      </p>
      {delta != null ? (
        <p
          className={cn(
            "mt-0.5 text-[10px] tabular-nums font-medium",
            row.deltaPct != null && row.deltaPct > 0 && "text-emerald-600 dark:text-emerald-400",
            row.deltaPct != null && row.deltaPct < 0 && "text-rose-600 dark:text-rose-400",
            row.deltaPct === 0 && "text-muted-foreground",
          )}
        >
          {delta} vs prior period
        </p>
      ) : null}
    </div>
  );
}

function TrendStrip({ rows }: { rows: ChartRow[] }) {
  const withDelta = rows.filter((r) => r.deltaPct != null);
  if (withDelta.length === 0) return null;

  return (
    <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5 border-t border-border/40 px-0.5 pt-2.5">
      {withDelta.slice(0, 8).map((row) => {
        const up = (row.deltaPct ?? 0) > 0;
        const down = (row.deltaPct ?? 0) < 0;
        return (
          <div key={row.key} className="inline-flex items-center gap-1.5 text-[10px]">
            <span className="max-w-[4.5rem] truncate text-muted-foreground">{row.axis}</span>
            <span
              className={cn(
                "tabular-nums font-semibold",
                up && "text-emerald-600 dark:text-emerald-400",
                down && "text-rose-600 dark:text-rose-400",
                !up && !down && "text-muted-foreground",
              )}
            >
              {row.deltaPct === 0
                ? "0%"
                : `${up ? "↑" : "↓"}${Math.abs(row.deltaPct ?? 0)}%`}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function SleekColumnChart({
  rows,
  height,
  valueLabel,
  showRevenue,
  gradId,
}: {
  rows: ChartRow[];
  height: number;
  valueLabel: string;
  showRevenue?: boolean;
  gradId: string;
}) {
  const chartH = Math.max(160, height - 36);

  return (
    <div className="w-full min-w-0" style={{ minHeight: height }}>
      <ResponsiveContainer width="100%" height={chartH} minWidth={1}>
        <BarChart
          data={rows}
          margin={{ top: 12, right: 8, left: -4, bottom: 0 }}
          barCategoryGap="28%"
        >
          <defs>
            {rows.map((row) => (
              <linearGradient key={row.key} id={`${gradId}-${row.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={row.fill} stopOpacity={0.95} />
                <stop offset="100%" stopColor={row.fill} stopOpacity={0.35} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border/25" vertical={false} />
          <XAxis
            dataKey="axis"
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            tickLine={false}
            axisLine={false}
            interval={0}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
            tickLine={false}
            axisLine={false}
            width={28}
            allowDecimals={false}
          />
          <Tooltip
            cursor={{ fill: "hsl(var(--muted))", opacity: 0.35 }}
            content={<CustomTooltip valueLabel={valueLabel} showRevenue={showRevenue} />}
          />
          <Bar
            dataKey="count"
            radius={[6, 6, 2, 2]}
            maxBarSize={42}
            isAnimationActive={false}
          >
            {rows.map((row) => (
              <Cell key={row.key} fill={`url(#${gradId}-${row.key})`} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <TrendStrip rows={rows} />
    </div>
  );
}

type CountryProps = {
  height?: number;
  data: CountryCountRow[];
  previousData?: CountryCountRow[];
  compareHint?: string | null;
  emptyLabel?: string;
  valueLabel?: string;
};

export function AdminCountrySignupsChart({
  height = 260,
  data,
  previousData,
  emptyLabel = "No signups in this period",
  valueLabel = "Signups",
}: CountryProps) {
  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-xs text-muted-foreground"
        style={{ minHeight: height }}
      >
        {emptyLabel}
      </div>
    );
  }

  const prevMap = new Map(
    (previousData ?? []).map((r) => [r.countryCode.trim().toUpperCase(), r.count]),
  );
  const hasCompare = Boolean(previousData);
  const top = data.slice(0, 8);
  const rows: ChartRow[] = top.map((row, i) => {
    const code = row.countryCode.trim();
    const name = countryDisplayName(code);
    const prevCount = prevMap.get(code.toUpperCase()) ?? 0;
    return {
      key: code || `row-${i}`,
      name,
      axis: axisCode(code, name),
      count: row.count,
      prevCount,
      deltaPct: hasCompare ? trendPct(row.count, prevCount) : null,
      fill: BRAND,
    };
  });

  return (
    <SleekColumnChart
      rows={rows}
      height={height}
      valueLabel={valueLabel}
      gradId="country-signup"
    />
  );
}

export function AdminCountryPurchasesChart(props: CountryProps) {
  if ((props.data?.length ?? 0) === 0) {
    return (
      <div
        className="flex items-center justify-center text-xs text-muted-foreground"
        style={{ minHeight: props.height ?? 260 }}
      >
        {props.emptyLabel ?? "No purchases in this period"}
      </div>
    );
  }

  const prevMap = new Map(
    (props.previousData ?? []).map((r) => [r.countryCode.trim().toUpperCase(), r.count]),
  );
  const hasCompare = Boolean(props.previousData);
  const top = props.data.slice(0, 8);
  const purchaseBrand = "hsl(211, 78%, 46%)";
  const rows: ChartRow[] = top.map((row, i) => {
    const code = row.countryCode.trim();
    const name = countryDisplayName(code);
    const prevCount = prevMap.get(code.toUpperCase()) ?? 0;
    return {
      key: code || `row-${i}`,
      name,
      axis: axisCode(code, name),
      count: row.count,
      prevCount,
      deltaPct: hasCompare ? trendPct(row.count, prevCount) : null,
      fill: purchaseBrand,
    };
  });

  return (
    <SleekColumnChart
      rows={rows}
      height={props.height ?? 260}
      valueLabel={props.valueLabel ?? "Purchases"}
      gradId="country-purchase"
    />
  );
}

type MethodProps = {
  height?: number;
  data: PaymentMethodStat[];
  previousData?: PaymentMethodStat[];
  compareHint?: string | null;
};

export function AdminPaymentMethodsChart({
  height = 260,
  data,
  previousData,
}: MethodProps) {
  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-xs text-muted-foreground"
        style={{ minHeight: height }}
      >
        No payments in this period
      </div>
    );
  }

  const prevMap = new Map((previousData ?? []).map((r) => [r.method, r.count]));
  const hasCompare = Boolean(previousData);
  const rows: ChartRow[] = [...data]
    .sort((a, b) => b.count - a.count)
    .map((row) => {
      const prevCount = prevMap.get(row.method) ?? 0;
      return {
        key: row.method,
        name: PAYMENT_METHOD_LABELS[row.method],
        axis: PAYMENT_METHOD_LABELS[row.method],
        count: row.count,
        prevCount,
        deltaPct: hasCompare ? trendPct(row.count, prevCount) : null,
        fill: METHOD_ACCENT[row.method],
        revenue: row.revenue,
      };
    });

  const totalRev = rows.reduce((s, r) => s + (r.revenue ?? 0), 0);
  const chartH = Math.max(160, height - 52);

  return (
    <div className="w-full min-w-0" style={{ minHeight: height }}>
      <div className="mb-1 flex items-baseline justify-between gap-2 px-0.5">
        <p className="text-[11px] text-muted-foreground">Volume by method</p>
        {totalRev > 0 ? (
          <p className="text-[11px] tabular-nums text-muted-foreground">
            Revenue <span className="font-semibold text-foreground">{fmtCompact(totalRev)}</span>
          </p>
        ) : null}
      </div>
      <ResponsiveContainer width="100%" height={chartH} minWidth={1}>
        <BarChart
          data={rows}
          margin={{ top: 12, right: 12, left: -4, bottom: 0 }}
          barCategoryGap="32%"
        >
          <defs>
            {rows.map((row) => (
              <linearGradient key={row.key} id={`method-${row.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={row.fill} stopOpacity={0.95} />
                <stop offset="100%" stopColor={row.fill} stopOpacity={0.3} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border/25" vertical={false} />
          <XAxis
            dataKey="axis"
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
            tickLine={false}
            axisLine={false}
            width={28}
            allowDecimals={false}
          />
          <Tooltip
            cursor={{ fill: "hsl(var(--muted))", opacity: 0.35 }}
            content={<CustomTooltip valueLabel="payments" showRevenue />}
          />
          <Bar dataKey="count" radius={[6, 6, 2, 2]} maxBarSize={56} isAnimationActive={false}>
            {rows.map((row) => (
              <Cell key={row.key} fill={`url(#method-${row.key})`} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <TrendStrip rows={rows} />
    </div>
  );
}
