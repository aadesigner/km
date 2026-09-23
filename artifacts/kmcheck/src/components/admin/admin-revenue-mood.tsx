import { useEffect, useMemo } from "react";
import { useAdminGetStats } from "@workspace/api-client-react";
import { adminStatsQuery } from "@/lib/admin-query-options";
import {
  applyAdminRevenueMoodStyles,
  resolveAdminRevenueMood,
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

/** Compact floating pace chip — lives with desktop controls, not in the nav. */
export function AdminRevenueMoodBadge({
  mood,
  revenueToday,
  className,
}: {
  mood: AdminRevenueMood;
  revenueToday: number;
  className?: string;
}) {
  const wild = mood.intensity >= 0.68;
  const pct = Math.round(Math.min(1, Math.max(0, mood.intensity)) * 100);

  return (
    <div
      className={cn(
        "admin-mood-chip group relative overflow-hidden",
        wild && "admin-mood-chip--sport",
        className,
      )}
      title={`Today ${fmtEuro(revenueToday)} · ${mood.title}`}
    >
      {wild ? <span className="admin-mood-chip__streak" aria-hidden /> : null}
      <div className="flex items-baseline justify-between gap-3">
        <p className="admin-mood-chip__title">{mood.title}</p>
        <p className="admin-mood-chip__amount tabular-nums">{fmtEuro(revenueToday)}</p>
      </div>
      <div className="admin-mood-chip__meter" aria-hidden>
        <span style={{ width: `${pct}%` }} />
      </div>
      <p className="admin-mood-chip__sub">{mood.subtitle}</p>
    </div>
  );
}
