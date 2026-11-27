import { describe, expect, it } from "vitest";
import {
  looksLikeHistoryFieldDump,
  reformatHistoryFieldDump,
  sanitizeHistoryEventDescription,
  sanitizeHistoryEventSubtitle,
  sanitizeHistoryEventTitle,
  sanitizeRegistryDetailLabel,
  sanitizeVehicleExtraLabel,
} from "./sanitize-history-dump";

describe("sanitize-history-dump", () => {
  it("detects legacy field-name dumps", () => {
    expect(
      looksLikeHistoryFieldDump(
        "3 · amount · component · insurance_amount · 607만원 · insurance_money · false · true · painting · repair_estimate_amount · reserve_amount · repair_estimate · wage",
      ),
    ).toBe(true);
    expect(looksLikeHistoryFieldDump("Paid 6,070,000 KRW · Paint work")).toBe(false);
  });

  it("reformats other-car accident dump into payout summary", () => {
    const out = reformatHistoryFieldDump(
      "3 · amount · component · insurance_amount · 607만원 · insurance_money · false · true · painting · repair_estimate_amount · reserve_amount · repair_estimate · wage",
    );
    expect(out).toMatch(/6,?070,?000/);
    expect(out).toMatch(/Paint work/i);
    expect(out).toMatch(/3 claim/i);
    expect(out).not.toMatch(/insurance_amount|repair_estimate_amount|reserve_amount|\bwage\b/);
  });

  it("reformats own-car dump without inventing paint", () => {
    const out = reformatHistoryFieldDump(
      "1 · amount · component · insurance_amount · 98만원 · insurance_money · false · false · painting · repair_estimate_amount · reserve_amount · repair_estimate · wage",
    );
    expect(out).toMatch(/980,?000/);
    expect(out).not.toMatch(/Paint work/i);
    expect(out).toMatch(/1 claim/i);
  });

  it("humanizes snake_case / spaced titles", () => {
    expect(sanitizeHistoryEventTitle("other_car_accident_list")).toBe("Other vehicle accident");
    expect(sanitizeHistoryEventTitle("other car accident list")).toBe("Other vehicle accident");
    expect(
      sanitizeHistoryEventTitle("my_car_accident_list+my_car_current_owner_accident_list"),
    ).toBe("Own vehicle accident + Accident under current owner");
    expect(
      sanitizeHistoryEventTitle("my car accident list + my car current owner accident list"),
    ).toBe("Own vehicle accident + Accident under current owner");
  });

  it("scrubs titles and subtitles on cached rows", () => {
    expect(sanitizeHistoryEventSubtitle(
      "3 · amount · insurance_amount · 607만원 · painting · true",
    )).toMatch(/Insurance payout/i);
    expect(sanitizeHistoryEventDescription(
      "other_car_accident_list — 3 · amount · insurance_amount · 607만원 · true · painting",
    )).toMatch(/Other vehicle accident/i);
    expect(sanitizeHistoryEventSubtitle("1 · Owner change", "Owner change")).toBeNull();
    expect(sanitizeHistoryEventSubtitle("Bids count: 3 · Personal use", "Owner change")).toBe("Personal use");
  });

  it("humanizes cached vehicle extra labels", () => {
    expect(sanitizeVehicleExtraLabel("accident_count")).toBe("Accident records");
    expect(sanitizeVehicleExtraLabel("has_rent_use_record")).toBe("Rental use record");
    expect(sanitizeVehicleExtraLabel("has_leakage")).toBe("Leakage recorded");
  });

  it("drops Detail N and bids-count detail labels", () => {
    expect(sanitizeRegistryDetailLabel("Detail")).toBeNull();
    expect(sanitizeRegistryDetailLabel("Detail 1")).toBeNull();
    expect(sanitizeRegistryDetailLabel("detail_2")).toBeNull();
    expect(sanitizeRegistryDetailLabel("Bids count")).toBeNull();
    expect(sanitizeRegistryDetailLabel("bids_count")).toBeNull();
    expect(sanitizeRegistryDetailLabel("usage")).toBe("Usage");
    expect(sanitizeRegistryDetailLabel("seq")).toBe("Owner #");
  });
});
