import { describe, expect, it } from "vitest";
import {
  isCarstatBadEventDate,
  wipeCarstatBadDatesFromData,
} from "./carstatBadDateWipe.js";

describe("isCarstatBadEventDate", () => {
  it("matches sept 17/18 2026 prefixes", () => {
    expect(isCarstatBadEventDate("2026-09-17")).toBe(true);
    expect(isCarstatBadEventDate("2026-09-18T12:00:00.000Z")).toBe(true);
    expect(isCarstatBadEventDate("2026-09-16")).toBe(false);
    expect(isCarstatBadEventDate("2025-09-17")).toBe(false);
  });
});

describe("wipeCarstatBadDatesFromData", () => {
  it("drops matching history/extras and clears lastAuctionDate", () => {
    const result = wipeCarstatBadDatesFromData({
      odometer: 120_000,
      mileageHistory: [
        { date: "2026-09-17", odometer: 120_000, unit: "km", source: "na_auction" },
        { date: "2024-01-10", odometer: 80_000, unit: "km", source: "listing" },
      ],
      auctionHistory: [{ date: "2026-09-18", auctionPrice: 1000 }],
      ownerHistory: [{ date: "2023-05-01", mileage: 50_000 }],
      vehicleExtras: [
        { key: "bad", observedAt: "2026-09-17" },
        { key: "ok", observedAt: "2024-02-01" },
      ],
      marketData: { lastAuctionDate: "2026-09-17" },
    });

    expect(result.changed).toBe(true);
    expect(result.stats.droppedHistory).toBe(2);
    expect(result.stats.droppedExtras).toBe(1);
    expect(result.stats.clearedLastAuctionDate).toBe(true);
    expect(result.data.mileageHistory).toEqual([
      { date: "2024-01-10", odometer: 80_000, unit: "km", source: "listing" },
    ]);
    expect(result.data.auctionHistory).toEqual([]);
    expect(result.data.ownerHistory).toHaveLength(1);
    expect(result.data.vehicleExtras).toEqual([{ key: "ok", observedAt: "2024-02-01" }]);
    expect((result.data.marketData as { lastAuctionDate: unknown }).lastAuctionDate).toBeNull();
  });

  it("no-ops when dates are clean", () => {
    const input = {
      mileageHistory: [{ date: "2024-01-10", odometer: 80_000 }],
    };
    const result = wipeCarstatBadDatesFromData(input);
    expect(result.changed).toBe(false);
    expect(result.data).toBe(input);
  });
});
