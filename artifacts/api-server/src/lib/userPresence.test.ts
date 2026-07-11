import { describe, expect, it } from "vitest";
import {
  isAdminPresencePath,
  isTrackablePresencePath,
  sanitizePresencePath,
} from "./userPresence.js";

describe("userPresence paths", () => {
  it("rejects admin area paths", () => {
    expect(isAdminPresencePath("/adminx")).toBe(true);
    expect(isAdminPresencePath("/adminx/users")).toBe(true);
    expect(isTrackablePresencePath("/adminx/settings")).toBe(false);
    expect(sanitizePresencePath("/adminx/analytics")).toBeNull();
  });

  it("accepts public app paths", () => {
    expect(sanitizePresencePath("/en/dashboard")).toBe("/en/dashboard");
    expect(sanitizePresencePath("en/pricing")).toBe("/en/pricing");
  });

  it("strips query and hash", () => {
    expect(sanitizePresencePath("/en/vin/ABC?q=1#x")).toBe("/en/vin/ABC");
  });

  it("rejects traversal and unsafe payloads", () => {
    expect(sanitizePresencePath("/en/../adminx")).toBeNull();
    expect(sanitizePresencePath("/en//dashboard")).toBeNull();
    expect(sanitizePresencePath('/en/<script>')).toBeNull();
    expect(sanitizePresencePath("/en/\u0000x")).toBeNull();
    expect(sanitizePresencePath("javascript:alert(1)")).toBeNull();
  });
});
