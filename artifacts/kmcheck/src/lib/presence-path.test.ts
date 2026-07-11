import { describe, expect, it } from "vitest";
import { isAdminPresencePath, isTrackablePresencePath } from "./presence-path";

describe("presence-path", () => {
  it("treats admin area paths as non-trackable", () => {
    expect(isAdminPresencePath("/adminx")).toBe(true);
    expect(isAdminPresencePath("/adminx/users")).toBe(true);
    expect(isTrackablePresencePath("/adminx/settings")).toBe(false);
  });

  it("allows public app paths", () => {
    expect(isTrackablePresencePath("/en/dashboard")).toBe(true);
    expect(isTrackablePresencePath("/en/vin/1HGBH41JXMN109186")).toBe(true);
    expect(isTrackablePresencePath("/en/pricing")).toBe(true);
  });

  it("rejects empty paths", () => {
    expect(isTrackablePresencePath(null)).toBe(false);
    expect(isTrackablePresencePath("")).toBe(false);
  });
});
