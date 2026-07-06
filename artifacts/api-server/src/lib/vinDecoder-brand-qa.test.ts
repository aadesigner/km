/**
 * Brand coverage QA — locks decode accuracy for popular makes/models.
 * Uses public VIN patterns; padded suffixes are fine for WMI/VDS checks.
 */
import { describe, it, expect } from "vitest";
import { decodeVin, decodeVinLocalFree, isPlausibleMake, isPlausibleModel } from "@workspace/vin-decode";

type BrandCase = {
  vin: string;
  label: string;
  make: string;
  modelContains: string;
  year?: number;
};

const CASES: BrandCase[] = [
  // ── Volkswagen Group ──────────────────────────────────────────────────────
  { vin: "WVGZZZ5NZDW535045", label: "VW Tiguan (WVG plant)", make: "Volkswagen", modelContains: "Tiguan", year: 2013 },
  { vin: "WVWZZZ3CZCE064077", label: "VW Passat B8", make: "Volkswagen", modelContains: "Passat" },
  { vin: "WVWZZZ1KZAW123456", label: "VW Golf Mk7/Mk8", make: "Volkswagen", modelContains: "Golf" },
  { vin: "WVWZZZ5NZBW123456", label: "VW Tiguan (WVW)", make: "Volkswagen", modelContains: "Tiguan" },
  { vin: "WVWZZZCJZAW123456", label: "VW ID.3", make: "Volkswagen", modelContains: "ID.3" },
  { vin: "1VWZZZA3ZDC050213", label: "VW Jetta US", make: "Volkswagen", modelContains: "Jetta" },
  { vin: "3VWS17AU0FM123456", label: "VW Tiguan US", make: "Volkswagen", modelContains: "Tiguan" },

  // ── Audi ──────────────────────────────────────────────────────────────────
  { vin: "WAUZZZ8K1BN123456", label: "Audi A4 EU", make: "Audi", modelContains: "A4" },
  { vin: "WAUZZZ4G5DN123456", label: "Audi A6 EU", make: "Audi", modelContains: "A6" },
  { vin: "WAUZZZGY1NU123456", label: "Audi Q7 EU", make: "Audi", modelContains: "Q7" },
  { vin: "WAUZZZGA1BN123456", label: "Audi Q5 EU", make: "Audi", modelContains: "Q5" },
  { vin: "WAUZZZF1ZAN123456", label: "Audi A3 8Y", make: "Audi", modelContains: "A3" },

  // ── Porsche ───────────────────────────────────────────────────────────────
  { vin: "WP0ZZZ99ZPS123456", label: "Porsche 911", make: "Porsche", modelContains: "911" },
  { vin: "WP0ZZZ92ZLA123456", label: "Porsche Cayenne", make: "Porsche", modelContains: "Cayenne" },
  { vin: "WP1ZZZ9ZPR1234567", label: "Porsche Macan", make: "Porsche", modelContains: "Macan" },
  { vin: "WP0ZZZ9YZLS123456", label: "Porsche Taycan", make: "Porsche", modelContains: "Taycan" },

  // ── BMW ───────────────────────────────────────────────────────────────────
  { vin: "WBA3A5C55FK123456", label: "BMW 3 Series F30", make: "BMW", modelContains: "3 Series" },
  { vin: "WBA5E1105GG123456", label: "BMW 5 Series G30", make: "BMW", modelContains: "5 Series" },
  { vin: "WBA21EM00P9R09775", label: "BMW X7 G07", make: "BMW", modelContains: "X7" },
  { vin: "WBA31BH00P9R09775", label: "BMW X3 G01", make: "BMW", modelContains: "X3" },
  { vin: "WBY7E21050V123456", label: "BMW iX", make: "BMW", modelContains: "iX" },

  // ── Mercedes-Benz ─────────────────────────────────────────────────────────
  { vin: "WDD2130421A123456", label: "Mercedes E-Class W213", make: "Mercedes-Benz", modelContains: "E-Class" },
  { vin: "WDD2050371A123456", label: "Mercedes C-Class W205", make: "Mercedes-Benz", modelContains: "C-Class" },
  { vin: "WDD1770871A123456", label: "Mercedes A-Class W177", make: "Mercedes-Benz", modelContains: "A-Class" },
  { vin: "WDD2531491A123456", label: "Mercedes GLC X253", make: "Mercedes-Benz", modelContains: "GLC" },
  { vin: "WDD4632761A123456", label: "Mercedes G-Class", make: "Mercedes-Benz", modelContains: "G-Class" },

  // ── Škoda ─────────────────────────────────────────────────────────────────
  { vin: "TMBEP6NJ3MZ012345", label: "Škoda Fabia III", make: "Škoda", modelContains: "Fabia" },
  { vin: "TMBJP7NX5MY012345", label: "Škoda Octavia IV", make: "Škoda", modelContains: "Octavia" },
  { vin: "TMBJW7NP0M7012345", label: "Škoda Superb III", make: "Škoda", modelContains: "Superb" },
  { vin: "TMBER7NW5M3123456", label: "Škoda Scala", make: "Škoda", modelContains: "Scala" },
  { vin: "TMBDK6XK5MS012345", label: "Škoda Kodiaq", make: "Škoda", modelContains: "Kodiaq" },

  // ── Renault ───────────────────────────────────────────────────────────────
  { vin: "VF1RJA00012345678", label: "Renault Clio", make: "Renault", modelContains: "Clio" },
  { vin: "VF1LB0A0H12345678", label: "Renault Megane", make: "Renault", modelContains: "Megane" },
  { vin: "VF1RFK0A0H1234567", label: "Renault Captur", make: "Renault", modelContains: "Captur" },
  { vin: "VF1AG000012345678", label: "Renault Arkana", make: "Renault", modelContains: "Arkana" },

  // ── Fiat ──────────────────────────────────────────────────────────────────
  { vin: "ZFA31200000745586", label: "Fiat 500", make: "Fiat", modelContains: "500" },
  { vin: "ZFA16900001234567", label: "Fiat Panda", make: "Fiat", modelContains: "Panda" },
  { vin: "ZFA35600001234567", label: "Fiat 500X", make: "Fiat", modelContains: "500X" },
  { vin: "ZFA33400001234567", label: "Fiat Tipo", make: "Fiat", modelContains: "Tipo" },

  // ── Peugeot / Citroën ─────────────────────────────────────────────────────
  { vin: "VF3MRHPYWR1234567", label: "Peugeot 3008", make: "Peugeot", modelContains: "3008" },
  { vin: "VF3ZZZABGR1234567", label: "Peugeot 208 EU ZZZ", make: "Peugeot", modelContains: "208" },
  { vin: "VF7ZZZABGR1234567", label: "Citroën C3 EU ZZZ", make: "Citroën", modelContains: "C3" },

  // ── SEAT ──────────────────────────────────────────────────────────────────
  { vin: "VSSZZZ2FZFR123456", label: "SEAT León EU", make: "SEAT", modelContains: "León" },
  { vin: "VSSZZZ7NZFR123456", label: "SEAT Ateca EU", make: "SEAT", modelContains: "Ateca" },

  // ── Hyundai / Toyota / Kia ────────────────────────────────────────────────
  { vin: "KMHS381BGBU123456", label: "Hyundai Santa Fe Sport", make: "Hyundai", modelContains: "Santa Fe" },
  { vin: "KMHL341BGBU123456", label: "Hyundai IONIQ 5", make: "Hyundai", modelContains: "IONIQ" },
  { vin: "KM8J23A45MU123456", label: "Hyundai Tucson", make: "Hyundai", modelContains: "Tucson" },
  { vin: "JTDKN3DU0A0123456", label: "Toyota Prius", make: "Toyota", modelContains: "Prius" },
  { vin: "JTMB1RFV0KD123456", label: "Toyota RAV4", make: "Toyota", modelContains: "RAV4" },
  { vin: "KNDNB2A28F7123456", label: "Kia Sorento", make: "Kia", modelContains: "Sorento" },
  { vin: "KNDC34LA5P5123456", label: "Kia EV6", make: "Kia", modelContains: "EV6" },
];

function assertDecode(c: BrandCase): void {
  const r = decodeVin(c.vin);
  expect(r.make, `${c.label}: make`).toBe(c.make);
  expect(r.model?.toLowerCase(), `${c.label}: model`).toContain(c.modelContains.toLowerCase());
  if (c.year != null) {
    expect(r.year, `${c.label}: year`).toBe(c.year);
  }
  expect(isPlausibleMake(r.make, c.vin), `${c.label}: plausible make`).toBe(true);
  expect(isPlausibleModel(r.model, c.vin), `${c.label}: plausible model`).toBe(true);

  const local = decodeVinLocalFree(c.vin);
  expect(local, `${c.label}: local decode`).not.toBeNull();
  expect(local!.make, `${c.label}: local make`).toBe(c.make);
  expect(local!.model?.toLowerCase(), `${c.label}: local model`).toContain(c.modelContains.toLowerCase());
}

describe("brand coverage QA", () => {
  for (const c of CASES) {
    it(`${c.label} — ${c.vin}`, () => assertDecode(c));
  }
});

describe("brand coverage — no cross-brand contamination", () => {
  it("BMW VIN never decodes as Mercedes", () => {
    const r = decodeVin("WBA3A5C55FK123456");
    expect(r.make).toBe("BMW");
    expect(r.model?.toLowerCase()).not.toContain("mercedes");
    expect(r.model?.toLowerCase()).not.toContain("class");
  });

  it("VW Tiguan WVG never returns null make", () => {
    const r = decodeVin("WVGZZZ5NZDW535045");
    expect(r.make).toBe("Volkswagen");
    expect(r.model?.toLowerCase()).toContain("tiguan");
  });

  it("Fiat 500 platform 312 never decodes as Punto", () => {
    const r = decodeVin("ZFA31200000745586");
    expect(r.model).toBe("500");
  });

  it("Škoda Octavia NX code not decoded as Fabia", () => {
    const r = decodeVin("TMBJP7NX5MY012345");
    expect(r.model?.toLowerCase()).toContain("octavia");
    expect(r.model?.toLowerCase()).not.toContain("fabia");
  });
});
