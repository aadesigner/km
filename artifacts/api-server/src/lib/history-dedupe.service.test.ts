import { describe, expect, it } from "vitest";
import {
  dedupeAccidents,
  dedupeAuctionHistory,
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
      { date: "2024-01-09", city: "Seoul" },
      { date: "January 9, 2024", city: "South Korea" },
      { date: "2024-01-09T07:00:00.000Z", finalPrice: 12500 },
    ], 2017);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.finalPrice).toBe(12500);
  });

  it("collapses same-day total loss variants into one accident", () => {
    const rows = dedupeAccidents([
      { date: "2024-01-09", type: "total_loss", description: "Damage: total loss · flood" },
      { date: "January 9, 2024", type: "total_loss", description: "Damage: airbag deployed · total loss · theft" },
      { date: "2024-01-09T07:00:00.000Z", type: "accident", description: "total loss · 전손" },
    ], 2017);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.description?.toLowerCase()).toContain("airbag");
  });

  it("drops marketplace / provider-name extras", () => {
    const rows = dedupeVehicleExtras([
      { key: "marketplace", label: "Marketplace", value: "Carstat" },
      { key: "doors", label: "Doors", value: "5" },
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.label).toBe("Doors");
  });

  it("collapses extra rows with the same label", () => {
    const rows = dedupeVehicleExtras([
      { label: "Damage", value: "total loss · flood" },
      { label: "Damage", value: "total loss · flood · theft" },
      { label: "Doors", value: "5" },
    ]);
    expect(rows).toHaveLength(2);
    expect(rows.find((r) => r.label === "Damage")?.value?.toLowerCase()).toContain("theft");
  });
});
