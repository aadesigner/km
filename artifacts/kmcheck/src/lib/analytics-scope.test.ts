import { describe, expect, it } from "vitest";
import { isPublicAnalyticsPath } from "./analytics-scope";

describe("isPublicAnalyticsPath", () => {
  it("allows public and client routes", () => {
    expect(isPublicAnalyticsPath("/en")).toBe(true);
    expect(isPublicAnalyticsPath("/en/dashboard")).toBe(true);
    expect(isPublicAnalyticsPath("/en/cars/usa")).toBe(true);
    expect(isPublicAnalyticsPath("/en/checkout")).toBe(true);
  });

  it("blocks all /adminx routes", () => {
    expect(isPublicAnalyticsPath("/adminx")).toBe(false);
    expect(isPublicAnalyticsPath("/adminx/")).toBe(false);
    expect(isPublicAnalyticsPath("/adminx/users")).toBe(false);
    expect(isPublicAnalyticsPath("/adminx/analytics")).toBe(false);
    expect(isPublicAnalyticsPath("/adminx/settings?tab=email")).toBe(false);
  });
});
