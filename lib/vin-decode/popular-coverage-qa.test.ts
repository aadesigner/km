/**
 * Popular US / EU / Asia make+model coverage — verified prefixes only.
 * Year only when a unique ISO cycle remains inside a verified window (no guessing).
 */
import { describe, expect, it } from "vitest";
import { decodeVin, decodeVinLocalFree } from "./index";

function pad(prefix: string, yearChar = "N"): string {
  const base = (prefix.toUpperCase() + "00000000000000000").slice(0, 17).split("");
  base[9] = yearChar;
  return base.join("");
}

type Case = {
  vin: string;
  label: string;
  make: string;
  modelContains: string;
  year: number | null;
  modelExcludes?: string[];
  fuel?: string;
};

function assertCase(c: Case): void {
  expect(c.vin).toHaveLength(17);
  const r = decodeVin(c.vin);
  expect(r.make, `${c.label}: make`).toBe(c.make);
  expect(r.model, `${c.label}: model`).toBeTruthy();
  expect(r.model!.toLowerCase()).toContain(c.modelContains.toLowerCase());
  for (const bad of c.modelExcludes ?? []) {
    expect(r.model!.toLowerCase(), `${c.label}: exclude ${bad}`).not.toContain(bad.toLowerCase());
  }
  expect(r.year, `${c.label}: year`).toBe(c.year);
  if (c.fuel) expect(r.fuelType, `${c.label}: fuel`).toBe(c.fuel);

  const local = decodeVinLocalFree(c.vin);
  expect(local).not.toBeNull();
  expect(local!.make).toBe(c.make);
  expect(local!.model?.toLowerCase()).toContain(c.modelContains.toLowerCase());
  expect(local!.year).toBe(c.year);
}

const USA: Case[] = [
  // Rivian — NHTSA MID: 7FCT = R1T truck, 7PDS = R1S MPV
  {
    vin: pad("7FCTGAA", "N"),
    label: "Rivian R1T (7FCT)",
    make: "Rivian",
    modelContains: "R1T",
    year: 2022,
    fuel: "Electric",
  },
  {
    vin: pad("7PDSGAA", "P"),
    label: "Rivian R1S (7PDS)",
    make: "Rivian",
    modelContains: "R1S",
    year: 2023,
    fuel: "Electric",
  },
  {
    vin: pad("7FCEGAA", "N"),
    label: "Rivian EDV (7FCE)",
    make: "Rivian",
    modelContains: "EDV",
    year: 2022,
    fuel: "Electric",
  },
  // Acura Alabama / Ohio — NHTSA: 5J8 = Acura MPV; YE/YD = MDX
  {
    vin: pad("5J8YE1H4X", "N"),
    label: "Acura MDX YE",
    make: "Acura",
    modelContains: "MDX",
    year: 2022,
    modelExcludes: ["Pilot", "RDX"],
  },
  {
    vin: pad("5J8TC2H5X", "N"),
    label: "Acura RDX TC",
    make: "Acura",
    modelContains: "RDX",
    year: 2022,
    modelExcludes: ["MDX", "Pilot"],
  },
  // 5J8YD is Acura MDX (NHTSA: 5J8YD8H85PL002112), never Honda Pilot
  {
    vin: pad("5J8YD8H8X", "P"),
    label: "Acura MDX YD (not Pilot)",
    make: "Acura",
    modelContains: "MDX",
    year: 2023,
    modelExcludes: ["Pilot", "RDX"],
  },
  // Honda Pilot — NHTSA TSB: 5FNYF6 = Pilot AWD (not Passport)
  {
    vin: pad("5FNYF6H5X", "M"),
    label: "Honda Pilot 5FNYF6",
    make: "Honda",
    modelContains: "Pilot",
    year: 2021,
    modelExcludes: ["Passport", "MDX"],
  },
  // Honda Passport — NHTSA TSB: 5FNYF8
  {
    vin: pad("5FNYF8H5X", "N"),
    label: "Honda Passport 5FNYF8",
    make: "Honda",
    modelContains: "Passport",
    year: 2022,
    modelExcludes: ["Pilot"],
  },
  // Subaru Crosstrek must not become Legacy (JF2G*)
  {
    vin: pad("JF2GTACC0", "N"),
    label: "Subaru Crosstrek JF2GT",
    make: "Subaru",
    modelContains: "Crosstrek",
    year: null, // letter N ambiguous without Crosstrek window
    modelExcludes: ["Legacy"],
  },
  // Nissan Altima must not become Maxima (1N4B*)
  {
    vin: pad("1N4BL4BV0", "N"),
    label: "Nissan Altima 1N4BL4",
    make: "Nissan",
    modelContains: "Altima",
    year: null,
    modelExcludes: ["Maxima"],
  },
  // Genesis sedan — KMTF = G70 (not SUV KMTG)
  {
    vin: pad("KMTF34LA0", "N"),
    label: "Genesis G70 KMTF",
    make: "Genesis",
    modelContains: "G70",
    year: null,
    modelExcludes: ["GV80", "GV70"],
  },
  {
    vin: pad("KMUH381B0", "N"),
    label: "Genesis GV80 KMUH",
    make: "Genesis",
    modelContains: "GV80",
    year: null,
    modelExcludes: ["G70"],
  },
];

const EUROPE: Case[] = [
  // Peugeot / Citroën EU ZZZ — model letter at position 7 (verified PSA table)
  {
    vin: pad("VF3ZZZA", "N"),
    label: "Peugeot 208 ZZZ-A",
    make: "Peugeot",
    modelContains: "208",
    year: null,
  },
  {
    vin: pad("VF3ZZZM", "N"),
    label: "Peugeot 3008 ZZZ-M",
    make: "Peugeot",
    modelContains: "3008",
    year: null,
  },
  {
    vin: pad("VF3ZZZE", "N"),
    label: "Peugeot 2008 ZZZ-E",
    make: "Peugeot",
    modelContains: "2008",
    year: null,
  },
  {
    vin: pad("VF7ZZZA", "N"),
    label: "Citroën C3 ZZZ-A",
    make: "Citroën",
    modelContains: "C3",
    year: null,
  },
  {
    vin: pad("VF7ZZZJ", "N"),
    label: "Citroën C5 Aircross ZZZ-J",
    make: "Citroën",
    modelContains: "C5 Aircross",
    year: null,
  },
  // Renault Captur — longer Captur prefixes beat bare Clio VF1RJA
  {
    vin: pad("VF1RFK", "N"),
    label: "Renault Captur VF1RFK",
    make: "Renault",
    modelContains: "Captur",
    year: null,
    modelExcludes: ["Clio"],
  },
  {
    vin: pad("VF1RJA", "N"),
    label: "Renault Clio VF1RJA",
    make: "Renault",
    modelContains: "Clio",
    year: null,
  },
  // Dacia — pos.4 family letter (verified)
  {
    vin: pad("UU1D", "N"),
    label: "Dacia Duster UU1D",
    make: "Dacia",
    modelContains: "Duster",
    year: null,
  },
  {
    vin: pad("UU1B", "N"),
    label: "Dacia Sandero UU1B",
    make: "Dacia",
    modelContains: "Sandero",
    year: null,
  },
  // Škoda modern type codes
  {
    vin: pad("TMBZZZNX", "N"),
    label: "Škoda Octavia NX",
    make: "Škoda",
    modelContains: "Octavia",
    year: 2022,
  },
  {
    vin: pad("TMBZZZNU", "N"),
    label: "Škoda Karoq NU",
    make: "Škoda",
    modelContains: "Karoq",
    year: 2022,
  },
];

const ASIA: Case[] = [
  // BYD — verified LGX / LC0 prefixes (byd.ts)
  {
    vin: pad("LGXCE4", "N"),
    label: "BYD Atto 3 LGXCE4",
    make: "BYD",
    modelContains: "Atto 3",
    year: 2022,
    fuel: "Electric",
  },
  {
    vin: "LGXCH6CD9N2084390",
    label: "BYD Seal LGXCH6 (fixture)",
    make: "BYD",
    modelContains: "Seal",
    year: 2022,
    fuel: "Electric",
  },
  // MG — LSJWP = ZS
  {
    vin: pad("LSJWP", "N"),
    label: "MG ZS LSJWP",
    make: "MG",
    modelContains: "ZS",
    year: null,
  },
  {
    vin: pad("LSJW5", "P"),
    label: "MG4 LSJW5",
    make: "MG",
    modelContains: "MG4",
    year: null,
  },
  // Toyota Hilux Thailand
  {
    vin: pad("MR0BA3CD0", "N"),
    label: "Toyota Hilux MR0",
    make: "Toyota",
    modelContains: "Hilux",
    year: null,
  },
  // Kia EV6 — KNDC verified
  {
    vin: pad("KNDC34LA0", "N"),
    label: "Kia EV6 KNDC",
    make: "Kia",
    modelContains: "EV6",
    year: null,
    modelExcludes: ["Niro"],
  },
  // Kia Telluride Georgia
  {
    vin: pad("5XYP34HC0", "N"),
    label: "Kia Telluride 5XYP",
    make: "Kia",
    modelContains: "Telluride",
    year: null,
  },
];

describe("popular coverage QA — USA", () => {
  for (const c of USA) it(`${c.label}`, () => assertCase(c));

  it("Rivian bare 7FC stays make-only (no invented model)", () => {
    const r = decodeVin(pad("7FCZ", "N"));
    expect(r.make).toBe("Rivian");
    expect(r.model).toBeNull();
  });
});

describe("popular coverage QA — Europe", () => {
  for (const c of EUROPE) it(`${c.label}`, () => assertCase(c));
});

describe("popular coverage QA — Asia", () => {
  for (const c of ASIA) it(`${c.label}`, () => assertCase(c));
});
