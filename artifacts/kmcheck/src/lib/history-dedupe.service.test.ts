import { describe, expect, it } from "vitest";
import {
  dedupeAccidents,
  dedupeAuctionHistory,
  dedupeMileageHistory,
  dedupeServiceHistory,
  dedupeVehicleExtras,
  extractServiceRecordId,
  serviceHistoryDedupeKey,
} from "./history-dedupe";

describe("service history performance inspection dedupe", () => {
  it("extracts record ids", () => {
    expect(extractServiceRecordId("Korean performance inspection — record #8026005635 — issued 2024-09-27"))
      .toBe("8026005635");
  });

  it("collapses same record id with different title tails", () => {
    const rows = dedupeServiceHistory([
      {
        date: "2026-07-24",
        mileage: 22121,
        title: "Korean performance inspection — record #8026005635 — issued 2024-09-27 — 22,121 km — structure/frame: Good — valid 2024-09-27 → 2028-09-26",
      },
      {
        date: "2026-07-24",
        mileage: 22121,
        title: "Korean performance inspection— record #8026005635— issued 2024-09-27— 22,121 km— structure/frame: Good— vehicle condition: Good— valid 2024-09-27 → 2028-09-26— first registered 2024-09-27",
      },
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.title).toContain("vehicle condition");
    expect(serviceHistoryDedupeKey(rows[0]!)).toBe("rec:8026005635");
  });
});

describe("same-day auction / total-loss / extra collapse", () => {
  it("keeps one auction row per calendar day", () => {
    const rows = dedupeAuctionHistory([
      { date: "2024-01-09", city: "Seoul", lotStatus: "listed" },
      { date: "January 9, 2024", city: "South Korea", lotStatus: "sold" },
      { date: "2024-01-09T07:00:00.000Z", finalPrice: 12500 },
    ], 2017);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.finalPrice).toBe(12500);
    expect(rows[0]?.lotStatus).toBe("sold");
  });

  it("keeps auctions on different days", () => {
    const rows = dedupeAuctionHistory([
      { date: "2024-01-09", finalPrice: 1000 },
      { date: "2024-02-01", finalPrice: 2000 },
    ]);
    expect(rows).toHaveLength(2);
  });

  it("collapses same-day total loss variants into one accident", () => {
    const rows = dedupeAccidents([
      {
        date: "2024-01-09",
        type: "total_loss",
        severity: "total_loss",
        description: "Damage: total loss · flood",
        primaryDamage: "total_loss",
      },
      {
        date: "January 9, 2024",
        type: "total_loss",
        description: "Damage: airbag deployed · total loss · flood · theft",
        primaryDamage: "Total loss",
      },
      {
        date: "2024-01-09T07:00:00.000Z",
        type: "accident",
        description: "total loss · 전손",
      },
    ], 2017);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.description?.toLowerCase()).toContain("airbag");
    expect(rows[0]?.description?.toLowerCase()).toContain("theft");
  });

  it("does not merge a different-day accident", () => {
    const rows = dedupeAccidents([
      { date: "2024-01-09", type: "total_loss", description: "total loss" },
      { date: "2023-06-02", type: "total_loss", description: "total loss" },
    ]);
    expect(rows).toHaveLength(2);
  });

  it("drops marketplace / provider-name extras", () => {
    const rows = dedupeVehicleExtras([
      { key: "marketplace", label: "Marketplace", value: "Carstat" },
      { key: "source", label: "Source", value: "Finn.no" },
      { key: "doors", label: "Doors", value: "5" },
      { key: "provider", label: "Provider", value: "AutoScout24" },
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.label).toBe("Doors");
  });

  it("collapses extra rows with the same label", () => {
    const rows = dedupeVehicleExtras([
      { key: "damage", label: "Damage", value: "total loss · flood", observedAt: "2024-01-09" },
      { key: "damage", label: "Damage", value: "total loss · flood · theft · 전손", observedAt: "2024-01-09" },
      { key: "badges", label: "Badges", value: "Total loss,flood", observedAt: "2024-01-08" },
      { key: "badges", label: "Badges", value: "Total loss,flood,theft", observedAt: "2024-01-09" },
    ]);
    expect(rows).toHaveLength(2);
    const damage = rows.find((r) => r.label === "Damage");
    expect(damage?.value?.toLowerCase()).toContain("theft");
    const badges = rows.find((r) => r.label === "Badges");
    expect(badges?.value?.toLowerCase()).toContain("theft");
  });

  it("does not shred thousands separators when merging money extras", () => {
    const rows = dedupeVehicleExtras([
      { key: "pre_accident_a", label: "Pre-accident value", value: "20,200 USD" },
      { key: "pre_accident_b", label: "Pre-accident value", value: "21,600 USD" },
      { key: "pre_accident_krw", label: "Pre-accident value", value: "24,009,000 KRW" },
    ]);
    const usd = rows.find((r) => /USD/.test(r.value ?? ""));
    const krw = rows.find((r) => /KRW/.test(r.value ?? ""));
    expect(usd?.value).toMatch(/20,200/);
    expect(usd?.value).toMatch(/21,600/);
    expect(usd?.value).not.toMatch(/^20 · 200/);
    expect(krw?.value).toBe("24,009,000 KRW");
  });
});

describe("dedupeMileageHistory", () => {
  it("merges same-day near-duplicate auction scrapes into one Copart row", () => {
    const rows = dedupeMileageHistory([
      {
        date: "2026-08-12",
        odometer: 93580,
        source: "US Auction",
        primaryDamage: "Cosmetic",
        auctionPrice: 11200,
      },
      {
        date: "2026-08-12",
        odometer: 93540,
        source: "Copart",
        primaryDamage: "Front Bumper Repaired",
        secondaryDamage: "Minor Body Scratches",
        auctionPrice: 11200,
      },
      {
        date: "2026-08-12",
        odometer: 93500,
        source: "Korean Marketplace",
        primaryDamage: "Cosmetic",
        auctionPrice: 18500,
      },
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.source).toBe("Copart");
    expect(rows[0]?.odometer).toBe(93540);
    expect(rows[0]?.primaryDamage).toBe("Front Bumper Repaired");
    expect(rows[0]?.secondaryDamage).toBe("Minor Body Scratches");
  });

  it("keeps far-apart same-day readings (possible rollback)", () => {
    const rows = dedupeMileageHistory([
      { date: "2026-08-12", odometer: 93540, source: "Copart" },
      { date: "2026-08-12", odometer: 41000, source: "Encar" },
    ]);
    expect(rows).toHaveLength(2);
  });
});
