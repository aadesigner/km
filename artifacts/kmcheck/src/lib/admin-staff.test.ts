import { describe, expect, it } from "vitest";
import { canAccessAdminArea, canAccessAdminRoute, isFullAdmin, staffRoleFromUser } from "./admin-staff";

describe("admin-staff", () => {
  it("treats editor as staff but not full admin", () => {
    const editor = { isAdmin: false, isEditor: true };
    expect(staffRoleFromUser(editor)).toBe("editor");
    expect(canAccessAdminArea(editor)).toBe(true);
    expect(isFullAdmin(editor)).toBe(false);
  });

  it("lets admins win over the editor flag", () => {
    const both = { isAdmin: true, isEditor: true };
    expect(staffRoleFromUser(both)).toBe("admin");
    expect(isFullAdmin(both)).toBe(true);
  });

  it("allows editors only the ops surfaces", () => {
    const editor = { isEditor: true };
    expect(canAccessAdminRoute(editor, "overview")).toBe(true);
    expect(canAccessAdminRoute(editor, "analytics")).toBe(true);
    expect(canAccessAdminRoute(editor, "users")).toBe(true);
    expect(canAccessAdminRoute(editor, "user-detail")).toBe(true);
    expect(canAccessAdminRoute(editor, "lookups")).toBe(true);
    expect(canAccessAdminRoute(editor, "vin-catalog")).toBe(true);
    expect(canAccessAdminRoute(editor, "vin-detail")).toBe(true);
    expect(canAccessAdminRoute(editor, "pending-vin-checks")).toBe(true);
    expect(canAccessAdminRoute(editor, "pending-vin-detail")).toBe(true);
    expect(canAccessAdminRoute(editor, "transactions")).toBe(true);
    expect(canAccessAdminRoute(editor, "settings")).toBe(false);
    expect(canAccessAdminRoute(editor, "providers")).toBe(false);
    expect(canAccessAdminRoute(editor, "pricing")).toBe(false);
    expect(canAccessAdminRoute(editor, "coupons")).toBe(false);
    expect(canAccessAdminRoute(editor, "emails")).toBe(false);
    expect(canAccessAdminRoute(editor, "plugins")).toBe(false);
    expect(canAccessAdminRoute(editor, "security")).toBe(false);
    expect(canAccessAdminRoute(editor, "announcements")).toBe(false);
    expect(canAccessAdminRoute(editor, "logs")).toBe(false);
  });

  it("blocks guests from every admin route", () => {
    expect(canAccessAdminArea(null)).toBe(false);
    expect(canAccessAdminRoute({ isAdmin: false, isEditor: false }, "overview")).toBe(false);
  });
});
