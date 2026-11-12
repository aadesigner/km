import { describe, expect, it } from "vitest";
import {
  hasMileageRollback,
  mileageRollbackNoiseBudgetKm,
  MILEAGE_ROLLBACK_IGNORE_MAX_KM,
} from "./vin-condition-score";

describe("hasMileageRollback noise tolerance", () => {
  it("budgets at least 500 km (and 0.25% on high odometers)", () => {
    expect(mileageRollbackNoiseBudgetKm(100_000)).toBe(MILEAGE_ROLLBACK_IGNORE_MAX_KM);
    expect(mileageRollbackNoiseBudgetKm(300_000)).toBe(750);
  });

  it("ignores the common ~150 km insurance/inspection dip", () => {
    expect(
      hasMileageRollback([
        { date: "2022-03-05", odometer: 174_245 },
        { date: "2022-08", odometer: 174_087 },
        { date: "2023-05-30", odometer: 196_780 },
      ]),
    ).toBe(false);
  });

  it("ignores ≤500 km dips even across year boundaries", () => {
    expect(
      hasMileageRollback([
        { date: "2025-12-20", odometer: 50_010 },
        { date: "2026-01-05", odometer: 50_000 },
      ]),
    ).toBe(false);
  });

  it("flags meaningful rollbacks", () => {
    expect(
      hasMileageRollback([
        { date: "2026-03-01", odometer: 87_000 },
        { date: "2026-04-01", odometer: 80_000 },
      ]),
    ).toBe(true);
    expect(
      hasMileageRollback([
        { date: "2025-12-20", odometer: 50_000 },
        { date: "2026-01-05", odometer: 35_000 },
      ]),
    ).toBe(true);
  });

  it("does not flag increasing mileage", () => {
    expect(
      hasMileageRollback([
        { date: "2024-01-01", odometer: 10_000 },
        { date: "2025-01-01", odometer: 25_000 },
      ]),
    ).toBe(false);
  });

  it("ignores ~1k km dips between auction/marketplace scrapes (demo multi-source noise)", () => {
    expect(
      hasMileageRollback([
        { date: "2026-08-12", odometer: 93_580, source: "Copart" },
        { date: "2026-08-15", odometer: 92_420, source: "Encar" },
        { date: "2026-09-18", odometer: 93_420, source: "Korean inspection" },
      ]),
    ).toBe(false);
  });

  it("still flags large drops even on auction sources", () => {
    expect(
      hasMileageRollback([
        { date: "2026-08-12", odometer: 93_580, source: "Copart" },
        { date: "2026-08-15", odometer: 80_000, source: "Encar" },
      ]),
    ).toBe(true);
  });
});
