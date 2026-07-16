import { describe, expect, it } from "vitest";
import { decodeVin } from "./vinDecoder";

describe("Mercedes VDS decoding", () => {
  it("decodes WDD chassis-digit C-Class and G-Class", () => {
    expect(decodeVin("WDD2050371A123456").model).toMatch(/C-Class/i);
    expect(decodeVin("WDD4632761A123456").model).toMatch(/G-Class/i);
    expect(decodeVin("WDD2040491A123456").model).toMatch(/C-Class/i);
  });

  it("aliases WDB/WDC WMI to the same chassis codes as WDD", () => {
    expect(decodeVin("WDB4632361A123456").model).toMatch(/G-Class/i);
    expect(decodeVin("WDC4632761A123456").model).toMatch(/G-Class/i);
    expect(decodeVin("WDB2040491A123456").model).toMatch(/C-Class/i);
  });

  it("decodes letter-series C-Class (WDDG = W204, not G-Class)", () => {
    const r = decodeVin("WDDGF8HB6LA123456");
    expect(r.make).toBe("Mercedes-Benz");
    expect(r.model).toMatch(/C-Class/i);
    expect(r.model).not.toMatch(/G-Class/i);
  });

  it("decodes letter-series E-Class W212 (WDDH) — not C-Class", () => {
    // Pos.4 H = W212 E-Class on modern NA VINs (not W202 C-Class)
    const r = decodeVin("WDDHF5KB6FA123456"); // F = 2015
    expect(r.make).toBe("Mercedes-Benz");
    expect(r.model).toMatch(/E-Class/i);
    expect(r.model).not.toMatch(/C-Class/i);
  });

  it("decodes letter-series E-Class W213 (WDDZ)", () => {
    const r = decodeVin("WDDZF4JB0LA123456"); // L = 2020
    expect(r.make).toBe("Mercedes-Benz");
    expect(r.model).toMatch(/E-Class/i);
    expect(r.model).not.toMatch(/C-Class/i);
  });

  it("decodes letter-series E-Class W214 (WDDL) for recent years", () => {
    const r = decodeVin("WDDLF4JB0PA123456"); // P = 2023
    expect(r.make).toBe("Mercedes-Benz");
    expect(r.model).toMatch(/E-Class/i);
    expect(r.model).not.toMatch(/GLE|C-Class/i);
  });

  it("decodes W1N / WDC SUV letter-series G-Class", () => {
    expect(decodeVin("W1NYC7HJ0LX340589").model).toMatch(/G-Class/i);
    expect(decodeVin("WDCYF8HB6LA123456").model).toMatch(/G-Class/i);
  });

  it("recognizes W1N WMI as Mercedes-Benz", () => {
    expect(decodeVin("W1NYC7HJ0LX340589").make).toBe("Mercedes-Benz");
  });
});
