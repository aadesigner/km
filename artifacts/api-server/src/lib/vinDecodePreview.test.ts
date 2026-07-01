import { describe, it, expect, vi, beforeEach } from "vitest";
import { decodeVinPeek } from "./vinDecodePreview";
import * as vinDecodeFree from "./vinDecodeFree";

describe("decodeVinPeek", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("uses hybrid decode when no cache", async () => {
    vi.spyOn(vinDecodeFree, "decodeFreeVin").mockResolvedValue({
      vin: "1HGCM82633A004352",
      year: 2003,
      make: "Honda",
      model: "Accord",
      trim: "EX-V6",
      manufacturer: "Honda",
      vehicleType: null,
      bodyStyle: null,
      engineCylinders: "6",
      engineDisplacementL: "3.0",
      engineDecoded: "3.0L 6-cylinder (J30A4)",
      engineCode: "3",
      fuelType: "Gasoline",
      driveType: null,
      transmissionStyle: null,
      plantCountry: "UNITED STATES",
      plantCity: "MARYSVILLE",
      plantCode: "A",
      countryOfOrigin: "United States",
      wmi: "1HG",
      checkDigitValid: true,
      source: "hybrid",
    });

    const r = await decodeVinPeek("1HGCM82633A004352", true, null);
    expect(r.make).toBe("Honda");
    expect(r.model).toBe("Accord");
    expect(r.year).toBe(2003);
    expect(r.trim).toBe("EX-V6");
    expect(r.engine).toBe("3.0L 6-cylinder (J30A4)");
    expect(r.decodeSource).toBe("hybrid");
  });

  it("prefers plausible cache make/model over decode", async () => {
    vi.spyOn(vinDecodeFree, "decodeFreeVin").mockResolvedValue({
      vin: "KMHSW81UBGU554169",
      year: 2016,
      make: "Hyundai",
      model: "Sonata",
      trim: null,
      manufacturer: null,
      vehicleType: null,
      bodyStyle: null,
      engineCylinders: null,
      engineDisplacementL: null,
      engineDecoded: null,
      engineCode: null,
      fuelType: null,
      driveType: null,
      transmissionStyle: null,
      plantCountry: null,
      plantCity: null,
      plantCode: null,
      countryOfOrigin: "South Korea",
      wmi: "KMH",
      checkDigitValid: true,
      source: "local",
    });

    const r = await decodeVinPeek("KMHSW81UBGU554169", true, {
      make: "Hyundai",
      model: "Santa Fe Sport",
      year: 2016,
    });
    expect(r.model).toBe("Santa Fe Sport");
    expect(r.decodeSource).toBe("cache");
  });

  it("rejects gibberish cache model and keeps decoded", async () => {
    vi.spyOn(vinDecodeFree, "decodeFreeVin").mockResolvedValue({
      vin: "KMHSW81UBGU554169",
      year: 2016,
      make: "Hyundai",
      model: "Santa Fe Sport",
      trim: null,
      manufacturer: null,
      vehicleType: null,
      bodyStyle: null,
      engineCylinders: null,
      engineDisplacementL: null,
      engineDecoded: null,
      engineCode: null,
      fuelType: null,
      driveType: null,
      transmissionStyle: null,
      plantCountry: null,
      plantCity: null,
      plantCode: null,
      countryOfOrigin: "South Korea",
      wmi: "KMH",
      checkDigitValid: true,
      source: "local",
    });

    const r = await decodeVinPeek("KMHSW81UBGU554169", true, {
      make: "KMHSW81UBG",
      model: "KMHSW81UBG",
    });
    expect(r.make).toBe("Hyundai");
    expect(r.model).toBe("Santa Fe Sport");
  });
});
