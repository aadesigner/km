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

/** Theme chart tokens — solid, no rainbow gradients. */
const FILL = {
  signups: "hsl(var(--chart-1))",
  purchases: "hsl(var(--chart-2))",
} as const;

/** Method colors: restrained, no purple. */
const METHOD_FILL: Record<PaymentMethodStat["method"], string> = {
  paypal: "hsl(207, 72%, 42%)",
  pok: "hsl(173, 48%, 36%)",
  credit: "hsl(var(--chart-1))",
  free: "hsl(215, 12%, 55%)",
};

function countryDisplayName(countryCode: string): string {
  const code = countryCode.trim();
  if (!code || code === "—" || code === "-" || code.toLowerCase() === "unknown") {
    return "No country set";
  }
  return userCountryLabel(code) ?? code;
}

function shortLabel(countryCode: string, name: string): string {
  const code = countryCode.trim().toUpperCase();
  if (code.length === 2) return `${code} · ${name.length > 14 ? `${name.slice(0, 13)}…` : name}`;
  return name.length > 18 ? `${name.slice(0, 17)}…` : name;
}

type ChartRow = {
  key: string;
  name: string;
  label: string;
  count: number;
  prevCount: number;
  deltaPct: number | null;
  fill: string;
  share: number;
  revenue?: number;
};

function opacityForRank(index: number, total: number): number {
  if (total <= 1) return 1;
  return Math.max(0.45, 1 - index * (0.5 / Math.max(total - 1, 1)));
}

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
    <div className="rounded-lg border border-border/70 bg-popover px-3 py-2 shadow-md">
      <p className="text-[11px] font-semibold text-foreground">{row.name}</p>
      <p className="mt-1 tabular-nums text-[12px] text-muted-foreground">
        <span className="font-semibold text-foreground">{row.count.toLocaleString()}</span>
        {" "}
        {valueLabel}
        <span className="text-muted-foreground/80"> · {row.share}%</span>
        {showRevenue && row.revenue != null && row.revenue > 0 ? (
          <span> · {fmtEuro(row.revenue)}</span>
        ) : null}
      </p>
      {delta != null ? (
        <p
          className={cn(
            "mt-0.5 text-[10px] font-medium tabular-nums",
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

/** Horizontal ranking bars — analytics-style, one accent, rank opacity. */
function RankBarChart({
  rows,
  height,
  valueLabel,
  showRevenue,
}: {
  rows: ChartRow[];
  height: number;
  valueLabel: string;
  showRevenue?: boolean;
}) {
  const rowH = Math.max(28, Math.min(36, Math.floor((height - 24) / Math.max(rows.length, 1))));
  const chartH = Math.max(rows.length * rowH + 16, 120);

  return (
    <div className="w-full min-w-0" style={{ minHeight: height }}>
      <ResponsiveContainer width="100%" height={chartH} minWidth={1}>
        <BarChart
          data={rows}
          layout="vertical"
          margin={{ top: 4, right: 44, left: 4, bottom: 4 }}
          barCategoryGap="22%"
        >
          <CartesianGrid
            strokeDasharray="3 3"
            horizontal={false}
            className="stroke-border/30"
          />
          <XAxis
            type="number"
            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <YAxis
            type="category"
            dataKey="label"
            width={108}
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }}
            content={<CustomTooltip valueLabel={valueLabel} showRevenue={showRevenue} />}
          />
          <Bar
            dataKey="count"
            radius={[0, 5, 5, 0]}
            maxBarSize={22}
            isAnimationActive={false}
            label={{
              position: "right",
              fontSize: 10,
              fill: "hsl(var(--muted-foreground))",
              formatter: (v: number) => (v > 0 ? String(v) : ""),
            }}
          >
            {rows.map((row, i) => (
              <Cell
                key={row.key}
                fill={row.fill}
                fillOpacity={opacityForRank(i, rows.length)}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Compact deltas under chart */}
      {rows.some((r) => r.deltaPct != null) ? (
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 border-t border-border/40 pt-2">
          {rows
            .filter((r) => r.deltaPct != null)
            .slice(0, 6)
            .map((row) => {
              const up = (row.deltaPct ?? 0) > 0;
              const down = (row.deltaPct ?? 0) < 0;
              return (
                <span key={row.key} className="inline-flex items-center gap-1 text-[10px]">
                  <span className="max-w-[5rem] truncate text-muted-foreground">{row.name}</span>
                  <span
                    className={cn(
                      "font-semibold tabular-nums",
                      up && "text-emerald-600 dark:text-emerald-400",
                      down && "text-rose-600 dark:text-rose-400",
                      !up && !down && "text-muted-foreground",
                    )}
                  >
                    {row.deltaPct === 0
                      ? "0%"
                      : `${up ? "+" : ""}${row.deltaPct}%`}
                  </span>
                </span>
              );
            })}
        </div>
      ) : null}
    </div>
  );
}

function buildCountryRows(
  data: CountryCountRow[],
  previousData: CountryCountRow[] | undefined,
  fill: string,
): ChartRow[] {
  const prevMap = new Map(
    (previousData ?? []).map((r) => [r.countryCode.trim().toUpperCase(), r.count]),
  );
  const hasCompare = Boolean(previousData);
  const top = data.slice(0, 8);
  const total = top.reduce((s, r) => s + r.count, 0) || 1;

  return top.map((row, i) => {
    const code = row.countryCode.trim();
    const name = countryDisplayName(code);
    const prevCount = prevMap.get(code.toUpperCase()) ?? 0;
    return {
      key: code || `row-${i}`,
      name,
      label: shortLabel(code, name),
      count: row.count,
      prevCount,
      deltaPct: hasCompare ? trendPct(row.count, prevCount) : null,
      fill,
      share: Math.round((row.count / total) * 100),
    };
  });
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
  valueLabel = "signups",
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

  return (
    <RankBarChart
      rows={buildCountryRows(data, previousData, FILL.signups)}
      height={height}
      valueLabel={valueLabel}
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

  return (
    <RankBarChart
      rows={buildCountryRows(props.data, props.previousData, FILL.purchases)}
      height={props.height ?? 260}
      valueLabel={props.valueLabel ?? "purchases"}
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
  const sorted = [...data].sort((a, b) => b.count - a.count);
  const total = sorted.reduce((s, r) => s + r.count, 0) || 1;
  const rows: ChartRow[] = sorted.map((row) => {
    const prevCount = prevMap.get(row.method) ?? 0;
    return {
      key: row.method,
      name: PAYMENT_METHOD_LABELS[row.method],
      label: PAYMENT_METHOD_LABELS[row.method],
      count: row.count,
      prevCount,
      deltaPct: hasCompare ? trendPct(row.count, prevCount) : null,
      fill: METHOD_FILL[row.method],
      share: Math.round((row.count / total) * 100),
      revenue: row.revenue,
    };
  });

  const totalRev = rows.reduce((s, r) => s + (r.revenue ?? 0), 0);

  return (
    <div className="w-full min-w-0" style={{ minHeight: height }}>
      <div className="mb-2 flex items-baseline justify-between gap-2 px-0.5">
        <p className="text-[11px] text-muted-foreground">Share of payments</p>
        {totalRev > 0 ? (
          <p className="text-[11px] tabular-nums text-muted-foreground">
            Revenue{" "}
            <span className="font-semibold text-foreground">{fmtCompact(totalRev)}</span>
          </p>
        ) : null}
      </div>

      {/* Method legend pills */}
      <div className="mb-3 flex flex-wrap gap-2">
        {rows.map((row) => (
          <div
            key={row.key}
            className="inline-flex items-center gap-1.5 rounded-md border border-border/50 bg-muted/30 px-2 py-1"
          >
            <span
              className="h-2 w-2 shrink-0 rounded-sm"
              style={{ backgroundColor: row.fill }}
            />
            <span className="text-[11px] font-medium text-foreground">{row.name}</span>
            <span className="text-[11px] tabular-nums text-muted-foreground">
              {row.share}%
            </span>
          </div>
        ))}
      </div>

      <RankBarChart
        rows={rows}
        height={Math.max(140, height - 72)}
        valueLabel="payments"
        showRevenue
      />
    </div>
  );
}
