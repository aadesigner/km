import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  LabelList,
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

const TOOLTIP_STYLE = {
  fontSize: 11,
  borderRadius: 8,
  border: "1px solid hsl(var(--border))",
  background: "hsl(var(--popover))",
};

const FILL_UP = "hsl(142, 55%, 38%)";
const FILL_DOWN = "hsl(350, 65%, 48%)";
const FILL_FLAT = "hsl(215, 18%, 52%)";
const FILL_NEUTRAL = [
  "hsl(211, 70%, 45%)",
  "hsl(200, 55%, 44%)",
  "hsl(185, 45%, 40%)",
  "hsl(170, 42%, 38%)",
  "hsl(155, 40%, 40%)",
  "hsl(230, 40%, 52%)",
  "hsl(250, 35%, 50%)",
  "hsl(20, 55%, 48%)",
  "hsl(40, 60%, 45%)",
  "hsl(215, 14%, 55%)",
];

const METHOD_BASE: Record<PaymentMethodStat["method"], string> = {
  paypal: "hsl(211, 80%, 45%)",
  pok: "hsl(262, 55%, 48%)",
  credit: "hsl(142, 55%, 38%)",
  free: "hsl(215, 12%, 55%)",
};

function countryDisplayName(countryCode: string): string {
  const code = countryCode.trim();
  if (!code || code === "—" || code === "-" || code.toLowerCase() === "unknown") {
    return "No country set";
  }
  return userCountryLabel(code) ?? code;
}

function axisLabel(countryCode: string, name: string): string {
  const code = countryCode.trim().toUpperCase();
  if (code.length === 2) return code;
  return name.length > 11 ? `${name.slice(0, 10)}…` : name;
}

function fillForTrend(deltaPct: number | null, rankIndex: number, methodFill?: string): string {
  if (deltaPct == null) return methodFill ?? FILL_NEUTRAL[rankIndex % FILL_NEUTRAL.length]!;
  if (deltaPct > 0) return FILL_UP;
  if (deltaPct < 0) return FILL_DOWN;
  return FILL_FLAT;
}

type RankedRow = {
  key: string;
  name: string;
  axis: string;
  count: number;
  prevCount: number;
  deltaPct: number | null;
  fill: string;
  revenue?: number;
  endLabel: string;
};

function formatDelta(deltaPct: number | null): string {
  if (deltaPct == null) return "";
  if (deltaPct === 0) return "0%";
  return `${deltaPct > 0 ? "↑" : "↓"}${Math.abs(deltaPct)}%`;
}

type CountryProps = {
  height?: number;
  data: CountryCountRow[];
  previousData?: CountryCountRow[];
  compareHint?: string | null;
  emptyLabel?: string;
  valueLabel?: string;
};

function BreakdownBarChart({
  rows,
  height,
  valueLabel,
  compareHint,
  showRevenue,
}: {
  rows: RankedRow[];
  height: number;
  valueLabel: string;
  compareHint?: string | null;
  showRevenue?: boolean;
}) {
  const chartHeight = Math.max(height - (compareHint ? 18 : 0), rows.length * 36 + 8);

  return (
    <div className="w-full min-w-0" style={{ minHeight: height }}>
      {compareHint ? (
        <p className="mb-1 px-1 text-[10px] text-muted-foreground">{compareHint}</p>
      ) : null}
      <ResponsiveContainer width="100%" height={chartHeight} minWidth={1}>
        <BarChart
          data={rows}
          layout="vertical"
          margin={{ top: 2, right: 56, left: 2, bottom: 2 }}
          barCategoryGap="22%"
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-border/25" horizontal={false} />
          <XAxis type="number" hide allowDecimals={false} domain={[0, "dataMax"]} />
          <YAxis
            type="category"
            dataKey="axis"
            width={40}
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            formatter={(value, _n, item) => {
              const row = item?.payload as RankedRow | undefined;
              const count = Number(value ?? 0);
              const parts = [`${count} ${valueLabel}`];
              if (showRevenue && row?.revenue != null) parts.push(fmtEuro(row.revenue));
              if (row?.deltaPct != null) {
                const sign = row.deltaPct > 0 ? "+" : "";
                parts.push(`${sign}${row.deltaPct}% vs prior`);
              } else if (row && row.prevCount === 0 && row.deltaPct == null) {
                /* no compare period */
              }
              return [parts.join(" · "), row?.name ?? ""];
            }}
            labelFormatter={() => ""}
          />
          <Bar dataKey="count" radius={[0, 5, 5, 0]} isAnimationActive={false} maxBarSize={16}>
            {rows.map((row) => (
              <Cell key={row.key} fill={row.fill} />
            ))}
            <LabelList
              dataKey="endLabel"
              position="right"
              className="fill-foreground"
              style={{ fontSize: 10, fontWeight: 600 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      {rows.some((r) => r.deltaPct != null) ? (
        <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 px-1 text-[10px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-sm" style={{ background: FILL_UP }} />
            Growing
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-sm" style={{ background: FILL_DOWN }} />
            Declining
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-sm" style={{ background: FILL_FLAT }} />
            Flat
          </span>
        </div>
      ) : null}
    </div>
  );
}

export function AdminCountrySignupsChart({
  height = 240,
  data,
  previousData,
  compareHint,
  emptyLabel = "No signups in this period",
  valueLabel = "Signups",
}: CountryProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center text-xs text-muted-foreground" style={{ minHeight: height }}>
        {emptyLabel}
      </div>
    );
  }

  const prevMap = new Map(
    (previousData ?? []).map((r) => [r.countryCode.trim().toUpperCase(), r.count]),
  );
  const hasCompare = Boolean(previousData);
  const rows: RankedRow[] = data.map((row, i) => {
    const code = row.countryCode.trim();
    const name = countryDisplayName(code);
    const prevCount = prevMap.get(code.toUpperCase()) ?? 0;
    const deltaPct = hasCompare ? trendPct(row.count, prevCount) : null;
    const delta = formatDelta(deltaPct);
    return {
      key: code || `row-${i}`,
      name,
      axis: axisLabel(code, name),
      count: row.count,
      prevCount,
      deltaPct,
      fill: fillForTrend(deltaPct, i),
      endLabel: delta ? `${row.count} ${delta}` : String(row.count),
    };
  });

  return (
    <BreakdownBarChart
      rows={rows}
      height={height}
      valueLabel={valueLabel}
      compareHint={compareHint}
    />
  );
}

export function AdminCountryPurchasesChart(props: CountryProps) {
  return (
    <AdminCountrySignupsChart
      {...props}
      emptyLabel={props.emptyLabel ?? "No purchases in this period"}
      valueLabel={props.valueLabel ?? "Purchases"}
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
  height = 240,
  data,
  previousData,
  compareHint,
}: MethodProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center text-xs text-muted-foreground" style={{ minHeight: height }}>
        No payments in this period
      </div>
    );
  }

  const prevMap = new Map((previousData ?? []).map((r) => [r.method, r.count]));
  const hasCompare = Boolean(previousData);
  const rows: RankedRow[] = [...data]
    .sort((a, b) => b.count - a.count)
    .map((row, i) => {
      const prevCount = prevMap.get(row.method) ?? 0;
      const deltaPct = hasCompare ? trendPct(row.count, prevCount) : null;
      const delta = formatDelta(deltaPct);
      const name = PAYMENT_METHOD_LABELS[row.method];
      return {
        key: row.method,
        name,
        axis: name,
        count: row.count,
        prevCount,
        deltaPct,
        fill: hasCompare ? fillForTrend(deltaPct, i, METHOD_BASE[row.method]) : METHOD_BASE[row.method],
        revenue: row.revenue,
        endLabel: delta
          ? `${row.count} · ${fmtCompact(row.revenue)} ${delta}`
          : `${row.count} · ${fmtCompact(row.revenue)}`,
      };
    });

  return (
    <BreakdownBarChart
      rows={rows}
      height={height}
      valueLabel="payments"
      compareHint={compareHint}
      showRevenue
    />
  );
}
