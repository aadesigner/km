import { describe, expect, it } from "vitest";
import {
  derivePeriodMetrics,
  fillDays,
  trendPct,
  type ExtendedStats,
} from "./admin-dashboard-stats";

const baseStats: ExtendedStats = {
  totalUsers: 100,
  totalVinChecks: 500,
  totalRevenue: 1000,
  checksToday: 5,
  checksYesterday: 4,
  cacheHitRate: 60,
  activeProviders: 1,
  checksThisWeek: 20,
  checksLastWeek: 10,
  checksThisMonth: 80,
  checksLastMonth: 60,
  revenueToday: 100,
  revenueYesterday: 80,
  revenueThisWeek: 400,
  revenueLastWeek: 200,
  revenueThisMonth: 900,
  revenueLastMonth: 600,
  signupsToday: 3,
  signupsYesterday: 2,
  signupsThisWeek: 12,
  signupsLastWeek: 6,
  signupsThisMonth: 40,
  signupsLastMonth: 30,
  checksByDay90: [{ date: "2026-07-09", count: 4 }, { date: "2026-07-10", count: 5 }],
  revenueByDay90: [{ date: "2026-07-09", revenue: 80 }, { date: "2026-07-10", revenue: 100 }],
  usersByDay90: [{ date: "2026-07-09", count: 2 }, { date: "2026-07-10", count: 3 }],
  recentPayments: [],
};

describe("trendPct", () => {
  it("computes percent change", () => {
    expect(trendPct(120, 100)).toBe(20);
    expect(trendPct(80, 100)).toBe(-20);
  });
});

describe("fillDays", () => {
  it("fills missing days with zero", () => {
    const rows = fillDays([{ date: "2099-01-01", count: 9 }], 3, "count");
    expect(rows).toHaveLength(3);
    expect(rows.every((r) => typeof r.value === "number")).toBe(true);
  });
});

describe("derivePeriodMetrics", () => {
  it("returns today metrics with yesterday comparison", () => {
    const m = derivePeriodMetrics(baseStats, "today");
    expect(m.revenue).toBe(100);
    expect(m.checks).toBe(5);
    expect(m.signups).toBe(3);
    expect(m.revenueTrend).toBe(25);
  });

  it("returns week metrics", () => {
    const m = derivePeriodMetrics(baseStats, "week");
    expect(m.revenue).toBe(400);
    expect(m.checks).toBe(20);
    expect(m.signups).toBe(12);
  });

  it("returns month metrics with server aggregates", () => {
    const m = derivePeriodMetrics(baseStats, "month");
    expect(m.revenue).toBe(900);
    expect(m.checks).toBe(80);
    expect(m.signups).toBe(40);
    expect(m.checksTrend).toBe(33);
  });
});
