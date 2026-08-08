import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip,
} from "recharts";
import {
  fmtEuro,
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

const METHOD_COLORS: Record<PaymentMethodStat["method"], string> = {
  paypal: "hsl(211, 80%, 45%)",
  pok: "hsl(262, 55%, 48%)",
  credit: "hsl(142, 55%, 38%)",
  free: "hsl(215, 12%, 55%)",
};

/** Distinct hues for up to 10 country slices (+ fallback). */
const COUNTRY_COLORS = [
  "hsl(142, 55%, 38%)",
  "hsl(211, 80%, 45%)",
  "hsl(32, 90%, 48%)",
  "hsl(262, 55%, 48%)",
  "hsl(350, 65%, 48%)",
  "hsl(175, 55%, 36%)",
  "hsl(45, 85%, 45%)",
  "hsl(280, 45%, 50%)",
  "hsl(15, 70%, 48%)",
  "hsl(200, 25%, 45%)",
];

function countryDisplayName(countryCode: string): string {
  const code = countryCode.trim();
  if (!code || code === "—" || code === "-" || code.toLowerCase() === "unknown") {
    return "No country set";
  }
  return userCountryLabel(code) ?? code;
}

type CountryProps = {
  height?: number;
  data: CountryCountRow[];
  emptyLabel?: string;
  valueLabel?: string;
};

export function AdminCountrySignupsChart({
  height = 220,
  data,
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

  const chartData = data.map((row, i) => ({
    country: row.countryCode,
    name: countryDisplayName(row.countryCode),
    count: row.count,
    fill: COUNTRY_COLORS[i % COUNTRY_COLORS.length],
  }));
  const totalCount = chartData.reduce((sum, row) => sum + row.count, 0);
  const pieHeight = Math.max(140, height - 36);

  return (
    <div className="w-full min-w-0" style={{ minHeight: height }}>
      <ResponsiveContainer width="100%" height={pieHeight} minWidth={1}>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="count"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={52}
            outerRadius={78}
            paddingAngle={2}
            isAnimationActive={false}
          >
            {chartData.map((row) => (
              <Cell key={row.country} fill={row.fill} stroke="transparent" />
            ))}
          </Pie>
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            formatter={(value) => {
              const count = Number(value ?? 0);
              const pct = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
              return [`${count} · ${pct}%`, valueLabel];
            }}
            labelFormatter={(label) => String(label)}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 px-2 pb-1">
        {chartData.map((row) => (
          <span key={row.country} className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="h-2 w-2 rounded-full shrink-0" style={{ background: row.fill }} />
            {row.name}
            <span className="tabular-nums font-medium text-foreground">{row.count}</span>
          </span>
        ))}
      </div>
    </div>
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
};

export function AdminPaymentMethodsChart({ height = 220, data }: MethodProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center text-xs text-muted-foreground" style={{ minHeight: height }}>
        No payments in this period
      </div>
    );
  }

  const chartData = data.map((row) => ({
    ...row,
    name: PAYMENT_METHOD_LABELS[row.method],
    fill: METHOD_COLORS[row.method],
  }));
  const totalCount = chartData.reduce((sum, row) => sum + row.count, 0);
  const pieHeight = Math.max(140, height - 36);

  return (
    <div className="w-full min-w-0" style={{ minHeight: height }}>
      <ResponsiveContainer width="100%" height={pieHeight} minWidth={1}>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="count"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={52}
            outerRadius={78}
            paddingAngle={2}
            isAnimationActive={false}
          >
            {chartData.map((row) => (
              <Cell key={row.method} fill={row.fill} stroke="transparent" />
            ))}
          </Pie>
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            formatter={(value, _name, item) => {
              const row = item?.payload as PaymentMethodStat | undefined;
              const count = Number(value ?? 0);
              const pct = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
              return [
                `${count} · ${fmtEuro(row?.revenue ?? 0)} · ${pct}%`,
                row ? PAYMENT_METHOD_LABELS[row.method] : "Payments",
              ];
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 px-2 pb-1">
        {chartData.map((row) => (
          <span key={row.method} className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="h-2 w-2 rounded-full shrink-0" style={{ background: row.fill }} />
            {row.name}
            <span className="tabular-nums font-medium text-foreground">{row.count}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
