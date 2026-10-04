import { describe, it, expect } from "vitest";
import { decodeVinPeek, buildManualPendingReportData } from "./vinDecodePreview";

describe("decodeVinPeek", () => {
  it("returns local make/model/year without NHTSA", async () => {
    const r = await decodeVinPeek("1HGCM82633A004352", true, null);
    expect(r.make).toBe("Honda");
    expect(r.model).toBe("Accord");
    expect(r.year).toBe(2003);
    expect(r.decodeSource).toBe("local");
    expect(r.wmi).toBe("1HG");
  });

  it("prefers plausible cache make/model over decode, but never overrides local year", async () => {
    const r = await decodeVinPeek("KMHSW81UBGU554169", true, {
      make: "Hyundai",
      model: "Sonata",
      // Catalog/registration years must not beat VIN model-year (off-by-one reports).
      year: 2017,
    });
    expect(r.make).toBe("Hyundai");
    expect(r.model).toBe("Sonata");
    // Verified Santa Fe Sport window (2013–2018) + letter G → unique 2016, not cache 2017.
    expect(r.year).toBe(2016);
  });

  it("does not invent a year from cache when local year is null", async () => {
    // Letter F without chassis window → local year null; cache must not fill it.
    const r = await decodeVinPeek("WBA3A5C55FK123456", true, {
      make: "BMW",
      year: 2015,
    });
    expect(r.make).toBe("BMW");
    expect(r.year).toBeNull();
  });

  it("rejects gibberish cache model and keeps decoded", async () => {
    const r = await decodeVinPeek("KMHSW81UBGU554169", true, {
      make: "KMHSW81UBG",
      model: "KMHSW81UBG",
    });
    expect(r.make).toBe("Hyundai");
    expect(r.model).toBe("Santa Fe Sport");
    expect(r.decodeSource).toBe("local");
  });

  it("includes local engine/country/fuel for pending draft seed (checkout UI still make+year only)", async () => {
    const r = await decodeVinPeek("5YJ3E1EA0PF123456", true, null);
    expect(r.make).toBe("Tesla");
    expect(r.year).toBe(2023);
    expect(r.country).toBeTruthy();
    expect(r.fuelType).toBe("Electric");
    expect(r.engine).toBeTruthy();
  });
});

describe("buildManualPendingReportData", () => {
  it("seeds pending draft with local decoder identity", async () => {
    const identity = await decodeVinPeek("5YJ3E1EA0PF123456", true, null);
    const draft = buildManualPendingReportData(identity);
    expect(draft.make).toBe("Tesla");
    expect(draft.year).toBe(2023);
    expect(draft.country).toBeTruthy();
    expect(draft.fuelType).toBe("Electric");
    expect(draft.engine).toBeTruthy();
    expect(draft.fulfillmentPending).toBe(true);
  });

  it("seeds Mercedes Baumuster make/model/country even when year is null", async () => {
    const identity = await decodeVinPeek("WDD2130421A123456", true, null);
    const draft = buildManualPendingReportData(identity);
    expect(draft.make).toBe("Mercedes-Benz");
    expect(draft.model).toBeTruthy();
    expect(draft.country).toBeTruthy();
    expect(identity.year).toBeNull();
    if (identity.series) expect(draft.trim).toBe(identity.series);
  });
});
