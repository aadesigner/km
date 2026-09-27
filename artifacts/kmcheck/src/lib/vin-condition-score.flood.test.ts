import { describe, expect, it } from "vitest";
import { computeVinConditionScore, floodPenalty } from "./vin-condition-score";

const t = (key: string) => key;

describe("floodPenalty", () => {
  it("does nothing when flood is not flagged", () => {
    expect(floodPenalty(false, 9)).toBe(0);
    expect(floodPenalty(null, 9)).toBe(0);
  });

  it("subtracts 3 when the pre-flood score is not already low", () => {
    expect(floodPenalty(true, 6)).toBe(3);
    expect(floodPenalty(true, 9.5)).toBe(3);
  });

  it("subtracts 1–1.5 when the pre-flood score is already very low", () => {
    expect(floodPenalty(true, 5.9)).toBeGreaterThanOrEqual(1);
    expect(floodPenalty(true, 5.9)).toBeLessThanOrEqual(1.5);
    expect(floodPenalty(true, 2)).toBe(1);
  });
});

describe("computeVinConditionScore flood", () => {
  it("drops about 3 points on an otherwise strong car", () => {
    const base = {
      odometer: 40_000,
      year: 2022,
      ownerCount: 1,
      accidents: [{ severity: "minor" }],
    };
    const clean = computeVinConditionScore(base, t);
    const flooded = computeVinConditionScore({ ...base, isFlooded: true }, t);
    expect(Number(clean!.score) - Number(flooded!.score)).toBeCloseTo(3, 1);
  });

  it("drops 1–1.5 when the score is already very low", () => {
    const base = { odometer: 40_000, year: 2022, ownerCount: 1, isSalvage: true };
    const salvage = computeVinConditionScore(base, t);
    const flooded = computeVinConditionScore({ ...base, isFlooded: true }, t);
    const drop = Number(salvage!.score) - Number(flooded!.score);
    expect(drop).toBeGreaterThanOrEqual(1);
    expect(drop).toBeLessThanOrEqual(1.5);
  });
});
