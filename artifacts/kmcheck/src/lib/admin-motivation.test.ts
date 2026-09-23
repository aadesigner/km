import { describe, expect, it } from "vitest";
import { adminMotivationPoolSize, pickAdminMotivation } from "./admin-motivation";

describe("adminMotivation", () => {
  it("has a solid premade pool", () => {
    expect(adminMotivationPoolSize()).toBeGreaterThanOrEqual(100);
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

  it("does not misuse zero signups in copy", () => {
    const line = pickAdminMotivation({ revenue: 80, checks: 12, signups: 0 }, 0.3);
    expect(line.toLowerCase()).not.toMatch(/\b0 signups?\b/);
    expect(line.toLowerCase()).not.toContain("waiting on vibes");
  });
});
