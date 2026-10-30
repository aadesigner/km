import { describe, expect, it } from "vitest";
import { isFullAdminFlags, isStaffFlags, staffRoleFromFlags } from "./staffRole.js";

describe("staffRoleFromFlags", () => {
  it("returns null for regular users", () => {
    expect(staffRoleFromFlags({})).toBeNull();
    expect(staffRoleFromFlags({ isAdmin: false, isEditor: false })).toBeNull();
  });

  it("returns editor when only isEditor is set", () => {
    expect(staffRoleFromFlags({ isEditor: true })).toBe("editor");
    expect(staffRoleFromFlags({ isAdmin: false, isEditor: true })).toBe("editor");
  });

  it("returns admin when isAdmin is set, even if also editor", () => {
    expect(staffRoleFromFlags({ isAdmin: true })).toBe("admin");
    expect(staffRoleFromFlags({ isAdmin: true, isEditor: true })).toBe("admin");
  });

  it("helpers match the role", () => {
    expect(isStaffFlags({ isEditor: true })).toBe(true);
    expect(isStaffFlags({ isAdmin: true })).toBe(true);
    expect(isStaffFlags({})).toBe(false);
    expect(isFullAdminFlags({ isEditor: true })).toBe(false);
    expect(isFullAdminFlags({ isAdmin: true })).toBe(true);
    expect(isStaffFlags({ isAdmin: false, isEditor: true })).toBe(true);
  });
});
