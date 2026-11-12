import { describe, expect, it } from "vitest";
import { computeVinConditionScore } from "./vin-condition-score";

const t = (key: string) => key;

const cleanBase = {
  odometer: 45_000,
  year: 2020,
  ownerCount: 1,
  isSalvage: false,
  isStolen: false,
  isFlooded: false,
  mileageHistory: [
    { date: "2020-01-01", odometer: 10 },
    { date: "2024-01-01", odometer: 45_000 },
  ],
};

describe("computeVinConditionScore accident severity", () => {
  it("keeps a single minor accident in the Clean band", () => {
    const result = computeVinConditionScore(
      { ...cleanBase, accidents: [{ severity: "minor" }] },
      t,
    );
    expect(result).not.toBeNull();
    expect(Number(result!.score)).toBeGreaterThanOrEqual(8);
    expect(result!.label).toBe("report_clean");
  });

  it("lowers a single major/heavy accident without crashing the rating", () => {
    const clean = computeVinConditionScore({ ...cleanBase, accidents: [] }, t);
    const major = computeVinConditionScore(
      { ...cleanBase, accidents: [{ date: "2023-06-01", severity: "major" }] },
      t,
    );
    const heavy = computeVinConditionScore(
      { ...cleanBase, accidents: [{ date: "2023-06-01", severity: "heavy" }] },
      t,
    );
    expect(Number(major!.score)).toBeLessThan(Number(clean!.score));
    expect(Number(major!.score)).toBeGreaterThanOrEqual(7.5);
    expect(Number(heavy!.score)).toBe(Number(major!.score));
  });

  it("still penalizes undated major accidents (no silent perfect score)", () => {
    const clean = computeVinConditionScore({ ...cleanBase, accidents: [] }, t);
    const result = computeVinConditionScore(
      { ...cleanBase, accidents: [{ severity: "major" }] },
      t,
    );
    expect(Number(result!.score)).toBeLessThan(Number(clean!.score));
  });

  it("penalizes total loss more than a single major", () => {
    const major = computeVinConditionScore(
      { ...cleanBase, accidents: [{ date: "2023-06-01", severity: "major" }] },
      t,
    );
    const total = computeVinConditionScore(
      { ...cleanBase, accidents: [{ date: "2023-06-01", severity: "total_loss" }] },
      t,
    );
    expect(Number(total!.score)).toBeLessThan(Number(major!.score));
  });
});
