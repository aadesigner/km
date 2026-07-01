import { describe, it, expect } from "vitest";
import { normalizeGtmContainerId, normalizeGaMeasurementId, validateAnalyticsSettingsPatch } from "./analyticsIds.js";

describe("normalizeGtmContainerId", () => {
  it("accepts valid GTM IDs", () => {
    expect(normalizeGtmContainerId("gtm-abc123")).toBe("GTM-ABC123");
    expect(normalizeGtmContainerId(" GTM-ABC123 ")).toBe("GTM-ABC123");
  });

  it("rejects invalid IDs", () => {
    expect(normalizeGtmContainerId("G-ABC123")).toBeNull();
    expect(normalizeGtmContainerId("")).toBeNull();
  });
});

describe("normalizeGaMeasurementId", () => {
  it("accepts GA4 and UA IDs", () => {
    expect(normalizeGaMeasurementId("g-abc123xyz")).toBe("G-ABC123XYZ");
    expect(normalizeGaMeasurementId("UA-123456-1")).toBe("UA-123456-1");
  });

  it("rejects invalid IDs", () => {
    expect(normalizeGaMeasurementId("GTM-ABC")).toBeNull();
  });
});

describe("validateAnalyticsSettingsPatch", () => {
  it("requires container ID when GTM is enabled", () => {
    const patch = { analyticsGtmEnabled: true, analyticsGtmContainerId: null };
    expect(validateAnalyticsSettingsPatch(patch)).toContain("container ID");
  });

  it("normalizes valid IDs in patch", () => {
    const patch = { analyticsGtmContainerId: "gtm-abc123" };
    expect(validateAnalyticsSettingsPatch(patch)).toBeNull();
    expect(patch.analyticsGtmContainerId).toBe("GTM-ABC123");
  });
});
