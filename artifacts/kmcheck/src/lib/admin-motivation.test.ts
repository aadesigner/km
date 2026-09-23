import { describe, expect, it } from "vitest";
import { adminMotivationPoolSize, pickAdminMotivation } from "./admin-motivation";

describe("adminMotivation", () => {
  it("has a large premade pool", () => {
    expect(adminMotivationPoolSize()).toBeGreaterThanOrEqual(240);
  });

  it("interpolates revenue and rolls by seed", () => {
    const a = pickAdminMotivation({ revenue: 120, checks: 40, signups: 5 }, 0.1);
    const b = pickAdminMotivation({ revenue: 120, checks: 40, signups: 5 }, 0.1);
    const c = pickAdminMotivation({ revenue: 120, checks: 40, signups: 5 }, 0.9);
    expect(a).toBe(b);
    expect(a).toContain("€120");
    expect(a.length).toBeGreaterThan(20);
    expect(c).not.toBe(a);
  });
});
