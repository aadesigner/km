import { describe, expect, it } from "vitest";
import { decodeGlobalBrand, decodeVin } from "./index";

describe("decodeGlobalBrand lightweight dispatch", () => {
  it("returns empty for unrelated Toyota VIN without scanning all tables", () => {
    const r = decodeGlobalBrand("JTDKB20U797867720");
    expect(r.model).toBeNull();
    expect(r.makeOverride).toBeNull();
  });

  it("single pass returns Dacia make + model together", () => {
    const r = decodeGlobalBrand("UU1DJF11065848712");
    expect(r.makeOverride).toBe("Dacia");
    expect(r.model).toBe("Duster");
  });
});

describe("decodeVin year + identity accuracy", () => {
  it("decodes model year when a verified chassis/platform window uniquely selects a cycle", () => {
    expect(decodeVin("WBA21EM00P9R09775").year).toBe(2023);
    expect(decodeVin("KMHL341BGM1234567").year).toBe(2021);
  });

  it("returns null model when prefix confidence is missing", () => {
    const r = decodeVin("LSJXXXXXXXXXXXXX1");
    expect(r.make).toBe("MG");
    expect(r.model).toBeNull();
  });
});
