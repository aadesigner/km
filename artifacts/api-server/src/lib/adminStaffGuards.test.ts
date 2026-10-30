import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "../routes/admin.ts"),
  "utf8",
);

function guardFor(method: string, path: string): "staff" | "admin" | "auth" | "unknown" {
  const escaped = path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`router\\.${method}\\(\\s*"${escaped}"[\\s\\S]{0,280}?require(Staff|Admin(?:Auth)?)\\b`);
  const match = re.exec(source);
  if (!match) return "unknown";
  if (match[1] === "Staff") return "staff";
  if (match[1] === "AdminAuth") return "auth";
  return "admin";
}

describe("admin route staff vs admin guards", () => {
  it("lets editors use the ops surfaces", () => {
    expect(guardFor("get", "/admin/stats")).toBe("staff");
    expect(guardFor("get", "/admin/analytics")).toBe("staff");
    expect(guardFor("get", "/admin/users")).toBe("staff");
    expect(guardFor("get", "/admin/users/:userId")).toBe("staff");
    expect(guardFor("patch", "/admin/users/:userId")).toBe("staff");
    expect(guardFor("post", "/admin/users/:userId/credits")).toBe("staff");
    expect(guardFor("get", "/admin/vin")).toBe("staff");
    expect(guardFor("get", "/admin/transactions")).toBe("staff");
    expect(guardFor("get", "/admin/vin-catalog")).toBe("staff");
    expect(guardFor("patch", "/admin/vin-catalog/by-vin/:vin")).toBe("staff");
    expect(guardFor("get", "/admin/pending-vin-checks")).toBe("staff");
    expect(guardFor("patch", "/admin/pending-vin-checks/:id")).toBe("staff");
    expect(guardFor("post", "/admin/pending-vin-checks/:id/publish")).toBe("staff");
  });

  it("keeps money, settings, and destructive ops admin-only", () => {
    expect(guardFor("get", "/admin/settings")).toBe("admin");
    expect(guardFor("get", "/admin/providers")).toBe("admin");
    expect(guardFor("get", "/admin/pricing")).toBe("admin");
    expect(guardFor("get", "/admin/coupons")).toBe("admin");
    expect(guardFor("get", "/admin/plugins")).toBe("admin");
    expect(guardFor("get", "/admin/security/settings")).toBe("admin");
    expect(guardFor("post", "/admin/users/:userId/role")).toBe("admin");
    expect(guardFor("post", "/admin/users/:userId/ban")).toBe("admin");
    expect(guardFor("delete", "/admin/users/:userId")).toBe("admin");
    expect(guardFor("post", "/admin/users/:userId/grant-analysis")).toBe("admin");
    expect(guardFor("post", "/admin/vin-catalog/by-vin/:vin/refresh")).toBe("admin");
    expect(guardFor("post", "/admin/vin-catalog/bulk-delete")).toBe("admin");
    expect(guardFor("delete", "/admin/pending-vin-checks/:id")).toBe("admin");
    expect(guardFor("post", "/admin/pending-vin-checks/:id/credit-and-notify")).toBe("admin");
    expect(guardFor("post", "/admin/pending-vin-checks/:id/remove-and-refund")).toBe("admin");
    expect(guardFor("delete", "/admin/transactions/:id")).toBe("admin");
  });

  it("lets staff unlock the PIN gate", () => {
    expect(guardFor("get", "/admin/unlock/status")).toBe("auth");
    expect(guardFor("post", "/admin/unlock")).toBe("auth");
  });
});
