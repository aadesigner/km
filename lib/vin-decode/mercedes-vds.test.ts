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

  it("decodes W1N / WDC SUV letter-series G-Class", () => {
    expect(decodeVin("W1NYC7HJ0LX340589").model).toMatch(/G-Class/i);
    expect(decodeVin("WDCYF8HB6LA123456").model).toMatch(/G-Class/i);
  });

  it("recognizes W1N WMI as Mercedes-Benz", () => {
    expect(decodeVin("W1NYC7HJ0LX340589").make).toBe("Mercedes-Benz");
  });
});
