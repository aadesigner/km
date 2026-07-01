import { describe, expect, it } from "vitest";
import {
  hasExplicitRegistryMileage,
  normalizeKrwAmountText,
  resolveRegistryDisplayAmount,
  resolveRegistryDisplayMileage,
  sanitizeKoreanRepairKrwAmount,
  stripRegistrySubtitleNoise,
} from "./index";

describe("resolveRegistryDisplayMileage", () => {
  it("hides mileage on insurance events", () => {
    expect(resolveRegistryDisplayMileage({
      type: "insurance_event",
      mileage: 301_000,
      details: [{ label: "Total repair cost", value: "2,566,720 won" }],
    })).toBeNull();
  });

  it("shows inspection mileage from KOTSA fields", () => {
    expect(resolveRegistryDisplayMileage({
      type: "inspection",
      mileage: 86_730,
      details: [{ label: "Drone during inspection", value: "86,730 km" }],
    })).toBe(86_730);
  });

  it("drops listing odometer leaked onto events without KOTSA mileage", () => {
    expect(resolveRegistryDisplayMileage({
      type: "inspection",
      mileage: 301_000,
      details: [{ label: "Inspection category", value: "regular inspection" }],
    }, { listingOdometer: 301_000 })).toBeNull();
  });
});

describe("normalizeKrwAmountText", () => {
  it("adds won suffix to plain numeric repair costs", () => {
    expect(normalizeKrwAmountText("2566720")).toBe("2,566,720 won");
  });

  it("does not treat 9+ digit list prices as bare repair costs", () => {
    expect(normalizeKrwAmountText("306000000")).toBe("306000000");
  });

  it("leaves formatted won strings unchanged", () => {
    expect(normalizeKrwAmountText("2,566,720 won")).toBe("2,566,720 won");
  });
});

describe("sanitizeKoreanRepairKrwAmount", () => {
  it("rejects new-car-scale list prices mislabeled as repair", () => {
    expect(sanitizeKoreanRepairKrwAmount(306_000_000)).toBeNull();
    expect(sanitizeKoreanRepairKrwAmount(871_000_000)).toBeNull();
  });

  it("prefers part/labor breakdown when benefit is inflated", () => {
    expect(sanitizeKoreanRepairKrwAmount(306_000_000, {
      partCost: 2_500_000,
      laborCost: 800_000,
      paintingCost: 200_000,
    })).toBe(3_500_000);
  });

  it("keeps plausible repair payouts", () => {
    expect(sanitizeKoreanRepairKrwAmount(2_566_720)).toBe(2_566_720);
  });
});

describe("resolveRegistryDisplayAmount", () => {
  it("hides list price chips on insurance events", () => {
    expect(resolveRegistryDisplayAmount({
      type: "insurance_event",
      amount: "306,000,000 won",
      details: [{ label: "New car list price", value: "306,000,000 won" }],
    })).toBeNull();
  });

  it("shows sanitized repair cost when present", () => {
    expect(resolveRegistryDisplayAmount({
      type: "insurance_event",
      details: [{ label: "Total repair cost", value: "2,566,720 won" }],
    })).toBe("2,566,720 won");
  });

  it("drops inflated repair cost in details", () => {
    expect(resolveRegistryDisplayAmount({
      type: "insurance_event",
      details: [{ label: "Total repair cost", value: "306,000,000 won" }],
    })).toBeNull();
  });
});

describe("stripRegistrySubtitleNoise", () => {
  it("removes extracted repair cost from subtitle", () => {
    expect(stripRegistrySubtitleNoise("Busan · total 2,566,720 won", null)).toBe("Busan");
  });
});

describe("hasExplicitRegistryMileage", () => {
  it("detects KOTSA mileage detail rows", () => {
    expect(hasExplicitRegistryMileage({
      details: [{ label: "Driving distance during inspection", value: "245,000 km" }],
    })).toBe(true);
  });
});
