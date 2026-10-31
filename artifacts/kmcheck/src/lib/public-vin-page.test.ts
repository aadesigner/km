import { describe, expect, it } from "vitest";
import { catalogDataIsPublished, publicVinPagePath } from "./public-vin-page";

describe("publicVinPagePath", () => {
  it("builds the canonical public VIN href", () => {
    expect(publicVinPagePath(" kmtc24s1ahu123456 ")).toMatch(/\/en\/vin\/KMTC24S1AHU123456$/);
  });
});

describe("catalogDataIsPublished", () => {
  it("rejects pending stubs", () => {
    expect(catalogDataIsPublished({
      make: "Hyundai",
      model: "Elantra",
      year: 2018,
      fulfillmentPending: true,
    })).toBe(false);
  });

  it("accepts make/model/year", () => {
    expect(catalogDataIsPublished({
      make: "Hyundai",
      model: "Elantra",
      year: 2018,
    })).toBe(true);
  });

  it("accepts history-only published rows", () => {
    expect(catalogDataIsPublished({
      auctionHistory: [{ date: "2024-01-09" }],
    })).toBe(true);
  });

  it("rejects empty objects", () => {
    expect(catalogDataIsPublished({})).toBe(false);
  });
});
