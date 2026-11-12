import { describe, expect, it } from "vitest";
import { historyDateSortKey, sortHistoryNewestFirst } from "./history-sort";

describe("historyDateSortKey", () => {
  it("parses ISO and English dates", () => {
    expect(historyDateSortKey("2025-04-24")).toBeGreaterThan(historyDateSortKey("2024-08-05"));
    expect(historyDateSortKey("May 18, 2021")).toBeGreaterThan(historyDateSortKey("April 16, 2019"));
  });

  it("sorts uninsured period ranges by end date", () => {
    expect(historyDateSortKey("2025-12~2026-06")).toBeGreaterThan(
      historyDateSortKey("March 17, 2021"),
    );
    expect(historyDateSortKey("2023-01-01 ~ 2023-02-15")).toBeGreaterThan(
      historyDateSortKey("2022-12-01"),
    );
  });
});

describe("sortHistoryNewestFirst with uninsured periods", () => {
  it("places 2025-2026 uninsured period above 2021 first registration", () => {
    const rows = sortHistoryNewestFirst([
      { date: "March 17, 2021", type: "first_registration" },
      { date: "2025-12~2026-06", type: "no_insurance" },
    ]);
    expect(rows.map((r) => r.type)).toEqual(["no_insurance", "first_registration"]);
  });
});

describe("sortHistoryNewestFirst", () => {
  it("orders newest first", () => {
    const rows = sortHistoryNewestFirst([
      { date: "2021-01-01" },
      { date: "2025-06-07" },
      { date: "2023-03-15" },
    ]);
    expect(rows.map((r) => r.date)).toEqual(["2025-06-07", "2023-03-15", "2021-01-01"]);
  });

  it("tie-breaks missing dates by higher mileage (newest odometer first)", () => {
    const rows = sortHistoryNewestFirst([
      { date: null, mileage: 15_309 },
      { date: null, mileage: 73_765 },
      { date: null, mileage: 7_148 },
      { date: null, mileage: 70_260 },
    ]);
    expect(rows.map((r) => r.mileage)).toEqual([73_765, 70_260, 15_309, 7_148]);
  });

  it("parses Encar month+YY headers for sorting", () => {
    expect(historyDateSortKey("April 19")).toBeGreaterThan(historyDateSortKey("January 20"));
  });
});
