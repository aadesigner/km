import { describe, expect, it } from "vitest";
import {
  buildPaymentsByMethodPeriods,
  buildSignupsByCountryPeriods,
  buildCountryCountPeriods,
} from "./adminStats.js";

describe("dashboard period breakdowns", () => {
  const now = new Date("2026-08-08T15:00:00.000Z");

  it("buckets country signups into today / week / quarter", () => {
    const maps = buildSignupsByCountryPeriods(
      [
        { date: "2026-08-08", country_code: "AL", count: 5 },
        { date: "2026-08-08", country_code: "DE", count: 2 },
        { date: "2026-08-07", country_code: "AL", count: 1 },
        { date: "2026-07-01", country_code: "US", count: 9 },
      ],
      now,
    );
    expect(maps.today).toEqual([
      { countryCode: "AL", count: 5 },
      { countryCode: "DE", count: 2 },
    ]);
    expect(maps.yesterday).toEqual([{ countryCode: "AL", count: 1 }]);
    expect(maps.week.find((r) => r.countryCode === "AL")?.count).toBe(6);
    expect(maps.lastMonth).toEqual([{ countryCode: "US", count: 9 }]);
    expect(maps.quarter.find((r) => r.countryCode === "US")?.count).toBe(9);
  });

  it("buckets purchases by country for last month", () => {
    const maps = buildCountryCountPeriods(
      [
        { date: "2026-07-15", country_code: "AL", count: 4 },
        { date: "2026-07-20", country_code: "DE", count: 2 },
        { date: "2026-08-01", country_code: "AL", count: 1 },
      ],
      now,
    );
    expect(maps.lastMonth).toEqual([
      { countryCode: "AL", count: 4 },
      { countryCode: "DE", count: 2 },
    ]);
    expect(maps.month).toEqual([{ countryCode: "AL", count: 1 }]);
  });

  it("buckets payment methods with revenue", () => {
    const maps = buildPaymentsByMethodPeriods(
      [
        { date: "2026-08-08", method: "pok", count: 2, revenue: 30 },
        { date: "2026-08-08", method: "paypal", count: 1, revenue: 15 },
        { date: "2026-08-05", method: "credit", count: 3, revenue: 0 },
      ],
      now,
    );
    expect(maps.today).toEqual([
      { method: "paypal", count: 1, revenue: 15 },
      { method: "pok", count: 2, revenue: 30 },
    ]);
    expect(maps.week.some((r) => r.method === "credit" && r.count === 3)).toBe(true);
  });
});
