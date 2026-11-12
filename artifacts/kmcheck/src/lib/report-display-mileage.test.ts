import { describe, expect, it } from "vitest";
import {
  ensureInitialRegistrationMileage,
  resolveFirstRegistrationDate,
  formatMileageHistorySource,
} from "./report-display";

describe("ensureInitialRegistrationMileage", () => {
  it("adds a 1 km first-registration start when history exists", () => {
    const out = ensureInitialRegistrationMileage(
      [{ date: "2024-06-01", odometer: 22000, unit: "km", source: "inspection" }],
      { firstRegistrationDate: "2020-03-15", vehicleYear: 2020 },
    );
    expect(out).toHaveLength(2);
    expect(out.some((e) => e.odometer === 1 && e.source === "First registration")).toBe(true);
    expect(out.find((e) => e.odometer === 1)?.date).toBe("2020-03-15");
  });

  it("does not invent history when empty", () => {
    expect(ensureInitialRegistrationMileage([], { vehicleYear: 2020 })).toEqual([]);
  });

  it("relabels an existing 1 km reading", () => {
    const out = ensureInitialRegistrationMileage(
      [{ date: "2020-03-15", odometer: 1, unit: "km", source: "export" }],
      { firstRegistrationDate: "2020-03-15" },
    );
    expect(out).toHaveLength(1);
    expect(out[0]?.source).toBe("First registration");
  });
});

describe("resolveFirstRegistrationDate", () => {
  it("reads registry first_registration", () => {
    expect(
      resolveFirstRegistrationDate([{ type: "first_registration", date: "2019-04-01" }]),
    ).toBe("2019-04-01");
  });
});

describe("formatMileageHistorySource", () => {
  it("localizes first registration", () => {
    const t = (k: string) => (k === "registry_field_first_registration" ? "First registration" : k);
    expect(formatMileageHistorySource("First registration", t)).toBe("First registration");
    expect(formatMileageHistorySource("Initial registration", t)).toBe("First registration");
  });
});
