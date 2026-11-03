import { describe, expect, it } from "vitest";
import {
  filterMileageHistoryForPersist,
  repairCatalogMileageData,
  shouldStripNaAuctionMileage,
} from "./mileageHistoryRepair.js";

describe("shouldStripNaAuctionMileage", () => {
  it("strips for Korea when registry has mileage", () => {
    expect(shouldStripNaAuctionMileage("kr", [{ mileage: 120_000 }])).toBe(true);
    expect(shouldStripNaAuctionMileage("Korea", [{ details: [{ value: "90,000km" }] }])).toBe(true);
  });

  it("keeps NA auction for US / KR without registry km", () => {
    expect(shouldStripNaAuctionMileage("us", [{ mileage: 50_000 }])).toBe(false);
    expect(shouldStripNaAuctionMileage("kr", [])).toBe(false);
    expect(shouldStripNaAuctionMileage("kr", [{ date: "2020-01-01" }])).toBe(false);
  });
});

describe("filterMileageHistoryForPersist", () => {
  it("drops na_auction rows for KR+registry", () => {
    const rows = [
      { source: "na_auction", odometer: 300_000 },
      { source: "listing", odometer: 180_000 },
    ];
    expect(filterMileageHistoryForPersist(rows, "kr", [{ mileage: 175_000 }])).toEqual([
      { source: "listing", odometer: 180_000 },
    ]);
  });
});

describe("repairCatalogMileageData", () => {
  it("drops na_auction zigzag on Korean cars and recomputes odometer", () => {
    const result = repairCatalogMileageData({
      country: "kr",
      year: 2015,
      odometer: 301_000,
      registryHistory: [{ mileage: 185_000, date: "2024-01-01" }],
      mileageHistory: [
        { date: "2023-06-01", odometer: 301_000, source: "na_auction", unit: "km" },
        { date: "2024-02-01", odometer: 188_000, source: "listing", unit: "km" },
        { date: "2022-01-01", odometer: 150_000, source: "listing", unit: "km" },
      ],
    });

    expect(result.changed).toBe(true);
    expect(result.stats.droppedNaAuction).toBe(1);
    expect(result.data.odometer).toBe(188_000);
    const mh = result.data.mileageHistory as Array<{ source?: string; odometer?: number }>;
    expect(mh.every((e) => e.source !== "na_auction")).toBe(true);
    expect(mh).toHaveLength(2);
  });

  it("converts explicit mi units to km", () => {
    const result = repairCatalogMileageData({
      country: "us",
      mileageHistory: [
        { date: "2024-01-01", odometer: 100_000, unit: "mi", source: "listing" },
      ],
    });
    expect(result.changed).toBe(true);
    expect(result.stats.convertedMi).toBe(1);
    const mh = result.data.mileageHistory as Array<{ odometer: number; unit: string }>;
    expect(mh[0]!.odometer).toBe(160_934);
    expect(mh[0]!.unit).toBe("km");
  });

  it("skips odometerLocked rows", () => {
    const input = {
      odometerLocked: true,
      odometer: 99_000,
      country: "kr",
      registryHistory: [{ mileage: 80_000 }],
      mileageHistory: [{ odometer: 200_000, source: "na_auction" }],
    };
    const result = repairCatalogMileageData(input);
    expect(result.skippedLocked).toBe(true);
    expect(result.changed).toBe(false);
    expect(result.data).toBe(input);
  });
});
