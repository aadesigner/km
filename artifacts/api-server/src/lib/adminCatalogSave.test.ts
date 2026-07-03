import { describe, it, expect } from "vitest";
import { applyCatalogAdminPatch } from "./vinCatalogImport.js";
import {
  detectAdminCatalogMileageTouched,
  finalizeAdminCatalogSave,
} from "./pendingVinCatalogPrep.js";

const BMW_ENTRY = {
  country: "kr",
  odometer: 315724,
  mileageHistory: [{ date: "2025-09-09", odometer: 315707, unit: "km" }],
  ownerHistory: [{ mileage: 315724 }],
  registryHistory: [{ mileage: 310000 }],
};

function adminSave(entryData: Record<string, unknown>, catalogFields: Record<string, unknown>) {
  const merged = applyCatalogAdminPatch(entryData, catalogFields);
  const touched = detectAdminCatalogMileageTouched(entryData, catalogFields);
  return finalizeAdminCatalogSave(merged, touched);
}

describe("admin catalog save integration", () => {
  it("persists scalar odometer edit for WBA7G shape", () => {
    const out = adminSave(BMW_ENTRY, { ...BMW_ENTRY, odometer: 100_000 });
    expect(out.odometer).toBe(100_000);
    expect(out.odometerLocked).toBe(true);
    expect((out.mileageHistory as { odometer: number }[]).every((e) => e.odometer <= 100_000)).toBe(true);
  });

  it("persists mileage history edit when scalar unchanged", () => {
    const out = adminSave(BMW_ENTRY, {
      ...BMW_ENTRY,
      mileageHistory: [{ date: "2025-09-09", odometer: 100_000, unit: "km" }],
    });
    expect(out.odometer).toBe(100_000);
    expect(out.odometerLocked).toBe(true);
  });

  it("persists admin-pasted photo URLs including non-CDN hosts", () => {
    const url = "https://images.example-cdn.net/vehicle/front.jpg";
    const out = adminSave({ make: "Kia", photos: [] }, {
      make: "Kia",
      photos: [url],
    });
    expect(out.photos).toEqual([url]);
  });
});
