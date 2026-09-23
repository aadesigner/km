import { describe, expect, it } from "vitest";
import { resolveAdminRevenueMood } from "./admin-revenue-mood";

describe("resolveAdminRevenueMood", () => {
  it("maps EUR thresholds to mood tiers", () => {
    expect(resolveAdminRevenueMood(0).id).toBe("eco");
    expect(resolveAdminRevenueMood(99.99).id).toBe("eco");
    expect(resolveAdminRevenueMood(100).id).toBe("cruise");
    expect(resolveAdminRevenueMood(179).id).toBe("cruise");
    expect(resolveAdminRevenueMood(180).id).toBe("charge");
    expect(resolveAdminRevenueMood(239).id).toBe("charge");
    expect(resolveAdminRevenueMood(240).id).toBe("heat");
    expect(resolveAdminRevenueMood(279).id).toBe("heat");
    expect(resolveAdminRevenueMood(280).id).toBe("blaze");
    expect(resolveAdminRevenueMood(349).id).toBe("blaze");
    expect(resolveAdminRevenueMood(350).id).toBe("supercar");
    expect(resolveAdminRevenueMood(999).id).toBe("supercar");
  });

  it("keeps primary channel strings parseable and intensity ordered", () => {
    const eco = resolveAdminRevenueMood(10);
    const superCar = resolveAdminRevenueMood(500);
    expect(eco.primary).toMatch(/^\d+ \d+% \d+%$/);
    expect(superCar.intensity).toBeGreaterThan(eco.intensity);
  });
});
