import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  fmtEuro,
  type ChartMetric,
  type ChartRange,
} from "@/lib/admin-dashboard-stats";

const TOOLTIP_STYLE = {
  fontSize: 11,
  borderRadius: 8,
  border: "1px solid hsl(var(--border))",
  background: "hsl(var(--popover))",
};

type ChartPoint = { label: string; value: number };

type Props = {
  height: number;
  data: ChartPoint[];
  chartMetric: ChartMetric;
  chartRange: ChartRange;
  strokeColor: string;
  gradId: string;
  seriesLabel: string;
};

export default function AdminDashboardChart({
  height,
  data,
  chartMetric,
  chartRange,
  strokeColor,
  gradId,
  seriesLabel,
}: Props) {
  return (
    <div className="w-full min-w-0" style={{ minHeight: height }}>
      <ResponsiveContainer width="100%" height={height} minWidth={1}>
      <AreaChart data={data} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={strokeColor} stopOpacity={0.2} />
            <stop offset="100%" stopColor={strokeColor} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          tickLine={false}
          axisLine={false}
          interval={chartRange === 90 ? 13 : chartRange === 30 ? 4 : 0}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          tickLine={false}
          axisLine={false}
          width={chartMetric === "revenue" ? 42 : 28}
          tickFormatter={(v) => (chartMetric === "revenue" ? `€${v}` : String(v))}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          formatter={(v) => [
            chartMetric === "revenue" ? fmtEuro(Number(v)) : v,
            seriesLabel,
          ]}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke={strokeColor}
          strokeWidth={2}
          fill={`url(#${gradId})`}
          dot={false}
          activeDot={{ r: 3, strokeWidth: 0 }}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
    </div>
  );
}
