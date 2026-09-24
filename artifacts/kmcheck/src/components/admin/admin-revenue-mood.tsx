import { useEffect, useMemo } from "react";
import { useAdminGetStats } from "@workspace/api-client-react";
import { adminStatsQuery } from "@/lib/admin-query-options";
import {
  applyAdminRevenueMoodStyles,
  moodNeedleAngle,
  resolveAdminRevenueMood,
  revenueToClusterSpeed,
  type AdminRevenueMood,
} from "@/lib/admin-revenue-mood";
import { fmtEuro, type ExtendedStats } from "@/lib/admin-dashboard-stats";
import { cn } from "@/lib/utils";

/** Shared stats cache with Overview — visual mood only, no payment logic. */
export function useAdminRevenueMood(enabled: boolean): {
  mood: AdminRevenueMood | null;
  revenueToday: number;
  ready: boolean;
} {
  const { data: rawStats, isSuccess } = useAdminGetStats({
    query: {
      ...adminStatsQuery(),
      enabled,
    },
  });

  const revenueToday = useMemo(() => {
    const stats = rawStats as unknown as ExtendedStats | undefined;
    const n = Number(stats?.revenueToday);
    return Number.isFinite(n) ? n : 0;
  }, [rawStats]);

  const mood = useMemo(
    () => (enabled && isSuccess ? resolveAdminRevenueMood(revenueToday) : null),
    [enabled, isSuccess, revenueToday],
  );

  useEffect(() => {
    if (!enabled || !mood) {
      return applyAdminRevenueMoodStyles(null);
    }
    return applyAdminRevenueMoodStyles(mood);
  }, [enabled, mood]);

  return { mood, revenueToday, ready: enabled && isSuccess };
}

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
  const start = polar(cx, cy, r, startDeg);
  const end = polar(cx, cy, r, endDeg);
  const large = Math.abs(endDeg - startDeg) > 180 ? 1 : 0;
  const sweep = endDeg >= startDeg ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${large} ${sweep} ${end.x} ${end.y}`;
}

/** Desktop sports-cluster gauge — more revenue → needle climbs like a tach/speedo. */
export function AdminRevenueMoodBadge({
  mood,
  revenueToday,
  className,
}: {
  mood: AdminRevenueMood;
  revenueToday: number;
  className?: string;
}) {
  const speed = revenueToClusterSpeed(revenueToday);
  const angle = moodNeedleAngle(mood.intensity);
  const wild = mood.intensity >= 0.68;
  const redline = mood.intensity >= 0.84;

  const cx = 90;
  const cy = 86;
  const rTrack = 62;
  const rTicks = 54;

  const ticks = Array.from({ length: 19 }, (_, i) => {
    const t = i / 18;
    const deg = -135 + t * 270;
    const outer = polar(cx, cy, rTicks + (i % 3 === 0 ? 6 : 3), deg);
    const inner = polar(cx, cy, rTicks - (i % 3 === 0 ? 2 : 0), deg);
    return { i, outer, inner, major: i % 3 === 0 };
  });

  return (
    <div
      className={cn(
        "admin-mood-gauge",
        wild && "admin-mood-gauge--sport",
        redline && "admin-mood-gauge--redline",
        className,
      )}
      style={{ ["--admin-gauge-tick" as string]: `${Math.max(0.35, 1.8 - mood.intensity * 1.4)}s` }}
      title={`Today ${fmtEuro(revenueToday)} · ${mood.title}`}
    >
      <svg
        className="admin-mood-gauge__svg"
        viewBox="0 0 180 118"
        width="180"
        height="118"
        aria-hidden
      >
        <defs>
          <linearGradient id="adminGaugeArc" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(152 45% 42%)" />
            <stop offset="45%" stopColor="hsl(142 70% 38%)" />
            <stop offset="72%" stopColor="hsl(32 92% 48%)" />
            <stop offset="100%" stopColor="hsl(2 78% 46%)" />
          </linearGradient>
          <filter id="adminGaugeGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="1.6" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Dark bezel */}
        <path
          d={arcPath(cx, cy, rTrack + 8, -135, 135)}
          fill="none"
          stroke="hsl(var(--border) / 0.7)"
          strokeWidth="10"
          strokeLinecap="round"
        />
        {/* Track */}
        <path
          d={arcPath(cx, cy, rTrack, -135, 135)}
          fill="none"
          stroke="hsl(var(--muted-foreground) / 0.18)"
          strokeWidth="7"
          strokeLinecap="round"
        />
        {/* Live arc to needle */}
        <path
          d={arcPath(cx, cy, rTrack, -135, angle)}
          fill="none"
          stroke="url(#adminGaugeArc)"
          strokeWidth="7"
          strokeLinecap="round"
          filter={wild ? "url(#adminGaugeGlow)" : undefined}
          className="admin-mood-gauge__live-arc"
        />

        {ticks.map(({ i, outer, inner, major }) => (
          <line
            key={i}
            x1={inner.x}
            y1={inner.y}
            x2={outer.x}
            y2={outer.y}
            stroke={major ? "hsl(var(--foreground) / 0.45)" : "hsl(var(--foreground) / 0.22)"}
            strokeWidth={major ? 1.4 : 1}
            strokeLinecap="round"
          />
        ))}

        {/* Needle */}
        <g
          className="admin-mood-gauge__needle"
          transform={`rotate(${angle} ${cx} ${cy})`}
        >
          <line
            x1={cx}
            y1={cy}
            x2={cx}
            y2={cy - rTrack + 10}
            stroke="hsl(var(--foreground))"
            strokeWidth="2.25"
            strokeLinecap="round"
          />
          <circle cx={cx} cy={cy} r="5.5" fill="hsl(var(--foreground))" />
          <circle cx={cx} cy={cy} r="2.4" fill="hsl(var(--background))" />
        </g>
      </svg>

      <div className="admin-mood-gauge__cluster">
        <p className="admin-mood-gauge__speed tabular-nums">{speed}</p>
        <p className="admin-mood-gauge__unit">km/h</p>
      </div>

      <div className="admin-mood-gauge__footer">
        <div className="min-w-0">
          <p className="admin-mood-gauge__title">{mood.title}</p>
          <p className="admin-mood-gauge__sub">{mood.subtitle}</p>
        </div>
        <p className="admin-mood-gauge__amount tabular-nums">{fmtEuro(revenueToday)}</p>
      </div>
    </div>
  );
}
