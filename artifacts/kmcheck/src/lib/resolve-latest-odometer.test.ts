import { describe, expect, it } from "vitest";
import { resolveLatestOdometerRecordedYear, resolveLatestRecordedOdometer } from "./resolve-latest-odometer";

describe("resolveLatestOdometerRecordedYear", () => {
  it("returns the year from the mileage history row matching the resolved odometer", () => {
    const input = {
      odometer: 101_410,
      mileageHistory: [{ odometer: 101_410, date: "2024-03-15" }],
      registryHistory: [{ mileage: 77_675, date: "2022-08-01" }],
    };
    expect(resolveLatestRecordedOdometer(input)).toBe(101_410);
    expect(resolveLatestOdometerRecordedYear(input)).toBe(2024);
  });

  it("uses registry inspection date when that is the resolved reading", () => {
    const input = {
      country: "kr",
      odometer: 301_000,
      mileageHistory: [{ odometer: 301_000, date: "2025-01-01", source: "na_auction" }],
      registryHistory: [{ mileage: 245_000, date: "2023-11-20" }],
    };
    expect(resolveLatestRecordedOdometer(input)).toBe(245_000);
    expect(resolveLatestOdometerRecordedYear(input)).toBe(2023);
  });

  it("returns null when no dated reading is available", () => {
    expect(resolveLatestOdometerRecordedYear({
      odometer: 120_000,
      mileageHistory: [{ odometer: 120_000 }],
    })).toBeNull();
  });
});
