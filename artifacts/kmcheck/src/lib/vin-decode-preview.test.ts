import { describe, it, expect } from "vitest";
import { decodeVin } from "@workspace/vin-decode";
import { formatVehicleTitle, isTrustworthyVinDecode, peekMatchesVin } from "./vin-decode-preview";

describe("peekMatchesVin", () => {
  it("matches same VIN case-insensitively", () => {
    expect(peekMatchesVin({ vin: "1nxbr32e77z123456" }, "1NXBR32E77Z123456")).toBe(true);
  });

  it("rejects stale peek from a different VIN", () => {
    expect(peekMatchesVin({ vin: "5YJSA1E47HF000001" }, "2T1BURHE0JC123456")).toBe(false);
  });
});

describe("formatVehicleTitle", () => {
  it("shows make + year when year decodes", () => {
    const vin = "WBA21EM00P9R09775";
    const r = decodeVin(vin);
    const peek = { vin, make: r.make, model: r.model, year: r.year };
    expect(isTrustworthyVinDecode(peek)).toBe(true);
    expect(formatVehicleTitle(peek)).toBe("BMW 2023");
  });

  it("shows make + year even when model is unknown", () => {
    const vin = "WAUZZZXX1FN034894";
    const peek = { vin, make: "Audi", model: null, year: 2015 };
    expect(isTrustworthyVinDecode(peek)).toBe(true);
    expect(formatVehicleTitle(peek)).toBe("Audi 2015");
  });

  it("shows make alone when model and year are unknown (Baumuster)", () => {
    const vin = "WDB9999991A123456";
    const peek = { vin, make: "Mercedes-Benz", model: null, year: null };
    expect(isTrustworthyVinDecode(peek)).toBe(true);
    expect(formatVehicleTitle(peek)).toBe("Mercedes-Benz");
  });

  it("shows make + model when year char is 0 (BMW iX)", () => {
    const vin = "WBY7E21050V123456";
    const r = decodeVin(vin);
    const peek = { vin, make: r.make, model: r.model, year: r.year };
    expect(r.year).toBeNull();
    expect(isTrustworthyVinDecode(peek)).toBe(true);
    expect(formatVehicleTitle(peek)).toBe("BMW iX");
  });

  it("shows make + model when year missing on 8 Series", () => {
    const vin = "WBA8E11050G123456";
    const r = decodeVin(vin);
    const peek = { vin, make: r.make, model: r.model, year: r.year };
    expect(formatVehicleTitle(peek)).toBe("BMW 8 Series");
  });

  it("rejects garbage make", () => {
    const peek = { vin: "WAUZZZ4H1FN034894", make: "BCDFGHJK", model: null, year: 2015 };
    expect(isTrustworthyVinDecode(peek)).toBe(false);
    expect(formatVehicleTitle(peek)).toBeNull();
  });
});
