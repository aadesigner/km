import { describe, it, expect } from "vitest";
import { decodeVin } from "./vinDecoder";
import {
  decodeOpelVauxhallMake,
  decodeOpelVauxhallModel,
  decodeOpelVauxhallPlant,
} from "./opel-vauxhall";

function pad(prefix: string): string {
  const base = prefix.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, "0");
  return (base + "000000000000000").slice(0, 17);
}

describe("Opel / Vauxhall make split", () => {
  it("W0L + German plant → Opel", () => {
    const vin = pad("W0LPE6ED5A1123456"); // plant 1 = Rüsselsheim
    expect(decodeOpelVauxhallMake(vin)).toBe("Opel");
    expect(decodeVin(vin).make).toBe("Opel");
  });

  it("W0L + UK plant (8) → Vauxhall", () => {
    const vin = pad("W0LPE6ED5A8123456"); // plant 8 = Ellesmere Port
    expect(decodeOpelVauxhallMake(vin)).toBe("Vauxhall");
    expect(decodeVin(vin).make).toBe("Vauxhall");
  });

  it("VXK WMI → Vauxhall", () => {
    const vin = pad("VXKFA8E000123456");
    expect(decodeOpelVauxhallMake(vin)).toBe("Vauxhall");
    expect(decodeVin(vin).make).toBe("Vauxhall");
  });

  it("W0V WMI → Vauxhall", () => {
    const vin = pad("W0VLL00000123456");
    expect(decodeOpelVauxhallMake(vin)).toBe("Vauxhall");
  });
});

describe("Opel / Vauxhall model enrichment", () => {
  it("W0LP platform → Astra", () => {
    const vin = pad("W0LPE6ED5A1123456");
    expect(decodeOpelVauxhallModel(vin)).toBe("Astra");
    expect(decodeVin(vin).model).toBe("Astra");
  });

  it("W0LB → Corsa", () => {
    const vin = pad("W0LB");
    expect(decodeVin(vin).model).toBe("Corsa");
  });

  it("W0LM → Mokka", () => {
    const vin = pad("W0LM");
    expect(decodeVin(vin).model).toBe("Mokka");
  });
});

describe("Opel / Vauxhall plant", () => {
  it("resolves Ellesmere Port for UK plant code", () => {
    const vin = pad("W0LPE6ED5A8123456");
    expect(decodeOpelVauxhallPlant(vin)).toEqual({
      city: "Ellesmere Port",
      country: "United Kingdom",
    });
    expect(decodeVin(vin).plantCity).toBe("Ellesmere Port");
  });
});
