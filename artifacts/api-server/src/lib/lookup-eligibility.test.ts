import { describe, it, expect } from "vitest";
import {
  isVehicleTooOldForLookup,
  isVehicleEligibleForHistoryLookup,
  MIN_VEHICLE_LOOKUP_YEAR,
} from "@workspace/vin-decode";

describe("lookup eligibility", () => {
  it("blocks plausible years before MIN_VEHICLE_LOOKUP_YEAR", () => {
    expect(MIN_VEHICLE_LOOKUP_YEAR).toBe(2008);
    expect(isVehicleTooOldForLookup(2007)).toBe(true);
    expect(isVehicleTooOldForLookup(1999)).toBe(true);
    expect(isVehicleEligibleForHistoryLookup(2007)).toBe(false);
  });

  it("allows 2008 and newer", () => {
    expect(isVehicleTooOldForLookup(2008)).toBe(false);
    expect(isVehicleTooOldForLookup(2009)).toBe(false);
    expect(isVehicleTooOldForLookup(2020)).toBe(false);
    expect(isVehicleEligibleForHistoryLookup(2008)).toBe(true);
    expect(isVehicleEligibleForHistoryLookup(2009)).toBe(true);
  });

  it("does not block when year is unknown or implausible", () => {
    expect(isVehicleTooOldForLookup(null)).toBe(false);
    expect(isVehicleTooOldForLookup(undefined)).toBe(false);
    expect(isVehicleTooOldForLookup(3008)).toBe(false);
    expect(isVehicleTooOldForLookup(0)).toBe(false);
  });
});
