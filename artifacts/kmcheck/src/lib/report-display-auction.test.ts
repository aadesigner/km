import { describe, expect, it } from "vitest";
import {
  sanitizeAuctionHistory,
  sanitizeAuctionLotStatus,
  sanitizeAuctionPlaceFields,
  sanitizeServiceHistory,
} from "./report-display";

describe("sanitizeAuctionLotStatus", () => {
  it("never keeps Copart/IAAI/Encar · Sold style titles", () => {
    expect(sanitizeAuctionLotStatus("Encar · Listing · Sold · #DEMO-022576-3")).toBeNull();
    expect(sanitizeAuctionLotStatus("Copart · Sold · #72438206")).toBeNull();
    expect(sanitizeAuctionLotStatus("IAAI · DEMO-022576-2 · Sold")).toBeNull();
    expect(sanitizeAuctionLotStatus("IAAI · Sold")).toBeNull();
    expect(sanitizeAuctionLotStatus("Copart · Sold")).toBeNull();
    expect(sanitizeAuctionLotStatus("Sold")).toBeNull();
  });

  it("keeps distinctive non-marketplace status text", () => {
    expect(sanitizeAuctionLotStatus("On Approval")).toBe("On Approval");
    expect(sanitizeAuctionLotStatus("Copart · On Approval")).toBe("On Approval");
  });
});

describe("sanitizeAuctionPlaceFields", () => {
  it("drops US city mashups on European marketplace rows", () => {
    expect(
      sanitizeAuctionPlaceFields({
        city: "Houston",
        state: "TX, Demo region",
        country: "Germany",
        lotStatus: "European Marketplace",
      }),
    ).toEqual({ city: null, state: null, country: "Germany" });
  });

  it("keeps US place for Copart when country is wrong", () => {
    expect(
      sanitizeAuctionPlaceFields({
        city: "Houston",
        state: "TX",
        country: "Germany",
        lotStatus: "Copart · Sold",
      }),
    ).toEqual({ city: "Houston", state: "TX", country: "USA" });
  });

  it("drops Houston mashup when country is DE and status is only Sold", () => {
    expect(
      sanitizeAuctionPlaceFields({
        city: "Houston",
        state: "TX",
        country: "DE",
        lotStatus: "Sold",
      }),
    ).toEqual({ city: null, state: null, country: "DE" });
  });
});

describe("sanitizeServiceHistory", () => {
  it("drops marketplace-as-location service stubs", () => {
    const out = sanitizeServiceHistory([
      {
        date: "2026-06-20",
        title: "Service record",
        description: "3 recorded visits",
        location: "European Marketplace",
        mileage: 91920,
      },
      {
        date: "2026-01-10",
        title: "Oil change",
        location: "Houston, TX",
        mileage: 80000,
      },
    ]);
    expect(out).toHaveLength(1);
    expect(out[0]?.title).toBe("Oil change");
  });
});

describe("sanitizeAuctionHistory", () => {
  it("drops price-history clutter and marketplace · Sold titles", () => {
    const out = sanitizeAuctionHistory([
      {
        date: "2026-08-15",
        city: "Seoul",
        country: "South Korea",
        finalPrice: 24000350,
        lotStatus: "Encar · Listing · Sold · #DEMO-022576-3",
        currency: "KRW",
      },
      {
        date: "2026-08-12",
        city: "Houston",
        state: "TX, Demo region",
        country: "Germany",
        finalPrice: 19950,
        lotStatus: "European Marketplace",
        currency: "USD",
      },
      {
        date: "2026-08-10",
        country: "South Korea",
        finalPrice: 23998500,
        lotStatus: "Price history",
        currency: "KRW",
      },
      {
        date: "2026-06-15",
        country: "USA",
        finalPrice: 12950,
        lotStatus: "IAAI · Sold",
        currency: "USD",
      },
      {
        date: "2026-03-15",
        lotStatus: "Listing",
      },
    ]);

    expect(out).toHaveLength(4);
    expect(out.every((row) => !/price\s*history/i.test(row.lotStatus ?? ""))).toBe(true);
    expect(out.every((row) => !/\b(copart|iaai|encar)\b/i.test(row.lotStatus ?? ""))).toBe(true);
    expect(out[0]?.lotStatus).toBeNull();
    expect(out.find((row) => row.date === "2026-08-12")).toMatchObject({
      city: null,
      state: null,
      country: "Germany",
      lotStatus: null,
    });
  });
});
