/**
 * Exhaustive model-line QA for Mercedes-Benz, Audi, and BMW.
 * Locks every class/series the free decoder claims to support, plus sibling negatives.
 */
import { describe, expect, it } from "vitest";
import { decodeVin, decodeVinLocalFree, isPlausibleMake, isPlausibleModel } from "./index";

type Case = {
  vin: string;
  label: string;
  make: string;
  modelContains: string;
  /** Substrings that must NOT appear in model (sibling contamination). */
  modelExcludes?: string[];
  year?: number;
};

function assertCase(c: Case): void {
  expect(c.vin, `${c.label}: length`).toHaveLength(17);
  const r = decodeVin(c.vin);
  expect(r.make, `${c.label}: make`).toBe(c.make);
  expect(r.model?.toLowerCase(), `${c.label}: model`).toContain(c.modelContains.toLowerCase());
  for (const bad of c.modelExcludes ?? []) {
    expect(r.model?.toLowerCase(), `${c.label}: exclude ${bad}`).not.toContain(bad.toLowerCase());
  }
  if (c.year != null) expect(r.year, `${c.label}: year`).toBe(c.year);
  expect(isPlausibleMake(r.make, c.vin), `${c.label}: plausible make`).toBe(true);
  expect(isPlausibleModel(r.model, c.vin), `${c.label}: plausible model`).toBe(true);

  const local = decodeVinLocalFree(c.vin);
  expect(local, `${c.label}: local`).not.toBeNull();
  expect(local!.make).toBe(c.make);
  expect(local!.model?.toLowerCase()).toContain(c.modelContains.toLowerCase());
}

const MERCEDES: Case[] = [
  // Chassis-digit passenger
  { vin: "WDD177087KA123456", label: "MB A-Class W177", make: "Mercedes-Benz", modelContains: "A-Class", year: 2019 },
  { vin: "WDD118087KA123456", label: "MB CLA C118", make: "Mercedes-Benz", modelContains: "CLA", year: 2019 },
  { vin: "WDD246087JA123456", label: "MB B-Class W246", make: "Mercedes-Benz", modelContains: "B-Class", year: 2018 },
  { vin: "WDD2450879A123456", label: "MB B-Class W245", make: "Mercedes-Benz", modelContains: "B-Class", year: 2009 },
  { vin: "WDD2020491A123456", label: "MB C-Class W202", make: "Mercedes-Benz", modelContains: "C-Class", year: 2001 },
  { vin: "WDD2030491A123456", label: "MB C-Class W203", make: "Mercedes-Benz", modelContains: "C-Class", year: 2001 },
  { vin: "WDD204049AA123456", label: "MB C-Class W204", make: "Mercedes-Benz", modelContains: "C-Class", year: 2010 },
  { vin: "WDD205037FA123456", label: "MB C-Class W205", make: "Mercedes-Benz", modelContains: "C-Class", year: 2015 },
  { vin: "WDD206087MA123456", label: "MB C-Class W206", make: "Mercedes-Benz", modelContains: "C-Class", year: 2021 },
  { vin: "WDD213042GA123456", label: "MB E-Class W213", make: "Mercedes-Benz", modelContains: "E-Class", year: 2016, modelExcludes: ["C-Class"] },
  { vin: "WDD214087PA123456", label: "MB E-Class W214", make: "Mercedes-Benz", modelContains: "E-Class", year: 2023, modelExcludes: ["C-Class"] },
  { vin: "WDD238087JA123456", label: "MB E Coupé C238", make: "Mercedes-Benz", modelContains: "E-Class", year: 2018 },
  { vin: "WDD222087HA123456", label: "MB S-Class W222", make: "Mercedes-Benz", modelContains: "S-Class", year: 2017 },
  { vin: "WDD223087LA123456", label: "MB S-Class W223", make: "Mercedes-Benz", modelContains: "S-Class", year: 2020 },
  { vin: "WDDLJ7EB5KA123456", label: "MB CLS C257", make: "Mercedes-Benz", modelContains: "CLS", year: 2019, modelExcludes: ["GLE"] },
  { vin: "WDD236087PA123456", label: "MB CLE C236", make: "Mercedes-Benz", modelContains: "CLE", year: 2023 },
  // SUVs / G
  { vin: "WDD253149GA123456", label: "MB GLC X253", make: "Mercedes-Benz", modelContains: "GLC", year: 2016 },
  { vin: "WDD254087NA123456", label: "MB GLC X254", make: "Mercedes-Benz", modelContains: "GLC", year: 2022 },
  { vin: "WDD166087FA123456", label: "MB ML W166 2015", make: "Mercedes-Benz", modelContains: "ML", year: 2015 },
  { vin: "WDD166087GA123456", label: "MB GLE W166 2016", make: "Mercedes-Benz", modelContains: "GLE", year: 2016 },
  { vin: "WDD167087KA123456", label: "MB GLE/GLS 167", make: "Mercedes-Benz", modelContains: "GLE", year: 2019 },
  { vin: "WDD247087LA123456", label: "MB GLA/GLB 247", make: "Mercedes-Benz", modelContains: "GLA", year: 2020 },
  { vin: "WDD164087AA123456", label: "MB ML W164", make: "Mercedes-Benz", modelContains: "ML", year: 2010 },
  { vin: "WDD1630879A123456", label: "MB ML W163", make: "Mercedes-Benz", modelContains: "ML", year: 2009 },
  { vin: "WDCDA5HB6HA123456", label: "MB GLE letter DA", make: "Mercedes-Benz", modelContains: "GLE", year: 2017 },
  { vin: "WDC0G4JB0GA123456", label: "MB GLC letter 0G", make: "Mercedes-Benz", modelContains: "GLC", year: 2016 },
  { vin: "WDCFB5HB6LA123456", label: "MB GLE letter FB", make: "Mercedes-Benz", modelContains: "GLE", year: 2020, modelExcludes: ["GLS"] },
  { vin: "WDCFF5HB6LA123456", label: "MB GLS letter FF", make: "Mercedes-Benz", modelContains: "GLS", year: 2020 },
  { vin: "4JGDA5HB6HA123456", label: "MB GLE 4JG", make: "Mercedes-Benz", modelContains: "GLE", year: 2017 },
  { vin: "WDD251087AA123456", label: "MB GLK X204", make: "Mercedes-Benz", modelContains: "GLK", year: 2010 },
  { vin: "WDD463276LA123456", label: "MB G-Class", make: "Mercedes-Benz", modelContains: "G-Class" },
  { vin: "WDB463236LA123456", label: "MB G-Class WDB", make: "Mercedes-Benz", modelContains: "G-Class" },
  { vin: "W1NYC7HJ0LX340589", label: "MB G-Class W1N", make: "Mercedes-Benz", modelContains: "G-Class" },
  // EQ / AMG / SL
  { vin: "WDD290087MA123456", label: "MB EQS", make: "Mercedes-Benz", modelContains: "EQS", year: 2021, modelExcludes: ["EQE"] },
  { vin: "WDD294087NA123456", label: "MB EQE", make: "Mercedes-Benz", modelContains: "EQE", year: 2022 },
  { vin: "WDD296087NA123456", label: "MB EQS SUV", make: "Mercedes-Benz", modelContains: "EQS SUV", year: 2022, modelExcludes: ["EQE"] },
  { vin: "WDD243000MA123456", label: "MB EQA/EQB", make: "Mercedes-Benz", modelContains: "EQ", year: 2021, modelExcludes: ["B-Class"] },
  { vin: "WDD293087KA123456", label: "MB EQC", make: "Mercedes-Benz", modelContains: "EQC", year: 2019 },
  { vin: "WDD192087PA123456", label: "MB AMG GT", make: "Mercedes-Benz", modelContains: "AMG GT", year: 2023 },
  { vin: "WDD197087NA123456", label: "MB SL R232", make: "Mercedes-Benz", modelContains: "SL", year: 2022 },
  // W1K + EU ZZZ
  { vin: "W1K213046GA123456", label: "MB E-Class W1K", make: "Mercedes-Benz", modelContains: "E-Class", year: 2016 },
  { vin: "W1K177087KA123456", label: "MB A-Class W1K", make: "Mercedes-Benz", modelContains: "A-Class", year: 2019 },
  { vin: "WDDZZZ213GAA12345", label: "MB E-Class EU ZZZ", make: "Mercedes-Benz", modelContains: "E-Class", year: 2016 },
  { vin: "WDDZZZ177KAA12345", label: "MB A-Class EU ZZZ", make: "Mercedes-Benz", modelContains: "A-Class", year: 2019 },
  { vin: "WDDZZZ236PAA12345", label: "MB CLE EU ZZZ", make: "Mercedes-Benz", modelContains: "CLE", year: 2023 },
  { vin: "WDDZZZ296NAA12345", label: "MB EQS SUV EU ZZZ", make: "Mercedes-Benz", modelContains: "EQS SUV", year: 2022 },
  // Letter-series (NA)
  { vin: "WDDGF8HB6LA123456", label: "MB letter G C-Class", make: "Mercedes-Benz", modelContains: "C-Class", modelExcludes: ["G-Class"] },
  { vin: "WDDHF5KB6FA123456", label: "MB letter H E-Class", make: "Mercedes-Benz", modelContains: "E-Class", year: 2015, modelExcludes: ["C-Class"] },
  { vin: "WDDZF4JB0LA123456", label: "MB letter Z E-Class", make: "Mercedes-Benz", modelContains: "E-Class", year: 2020, modelExcludes: ["C-Class"] },
  { vin: "WDDLF4JB0PA123456", label: "MB letter L E-Class 2023", make: "Mercedes-Benz", modelContains: "E-Class", year: 2023, modelExcludes: ["GLE", "C-Class"] },
  { vin: "WDDLF4JB0KA123456", label: "MB letter L CLS 2019", make: "Mercedes-Benz", modelContains: "CLS", year: 2019, modelExcludes: ["GLE"] },
  { vin: "WDDWF4JB0LA123456", label: "MB letter W C-Class", make: "Mercedes-Benz", modelContains: "C-Class", year: 2020 },
  { vin: "WDDAF4JB0MA123456", label: "MB letter A C-Class", make: "Mercedes-Benz", modelContains: "C-Class", year: 2021 },
  { vin: "WDDMF4JB0PA123456", label: "MB letter M CLE", make: "Mercedes-Benz", modelContains: "CLE", year: 2023 },
];

const AUDI: Case[] = [
  { vin: "WAUZZZ8V1BN123456", label: "Audi A3 8V", make: "Audi", modelContains: "A3" },
  { vin: "WAUZZZFFVAN123456", label: "Audi A3 FF", make: "Audi", modelContains: "A3" },
  { vin: "WAUZZZ8X0BN123456", label: "Audi A1 8X", make: "Audi", modelContains: "A1" },
  { vin: "WAUZZZ8K1BN123456", label: "Audi A4 8K", make: "Audi", modelContains: "A4" },
  { vin: "WAUZZZF4XGN123456", label: "Audi A4 B9 F4", make: "Audi", modelContains: "A4" },
  { vin: "WAUZZZFLXGN123456", label: "Audi A4 B8 FL", make: "Audi", modelContains: "A4" },
  { vin: "WAUZZZF5XGN123456", label: "Audi A5 F5", make: "Audi", modelContains: "A5" },
  { vin: "WAUZZZ8T1BN123456", label: "Audi A5 8T", make: "Audi", modelContains: "A5" },
  { vin: "WAUZZZ4G2DN123456", label: "Audi A6 C7 4G2", make: "Audi", modelContains: "A6", modelExcludes: ["A7"] },
  { vin: "WAUZZZ4G5DN123456", label: "Audi A7 C7 4G5", make: "Audi", modelContains: "A7", modelExcludes: ["A6"] },
  { vin: "WAUZZZ4ADN1234567", label: "Audi A8 4A", make: "Audi", modelContains: "A8" },
  { vin: "WAUZZZF8XAN123456", label: "Audi A8 F8", make: "Audi", modelContains: "A8" },
  { vin: "WAUZZZGS1BN123456", label: "Audi Q3 GS", make: "Audi", modelContains: "Q3" },
  { vin: "WAUZZZF3XAN123456", label: "Audi Q3 F3", make: "Audi", modelContains: "Q3" },
  { vin: "WAUZZZ8U1BN123456", label: "Audi Q3 8U", make: "Audi", modelContains: "Q3" },
  { vin: "WAUZZZGA1BN123456", label: "Audi Q5 GA", make: "Audi", modelContains: "Q5" },
  { vin: "WAUZZZFYBN1234567", label: "Audi Q5 FY", make: "Audi", modelContains: "Q5" },
  { vin: "WAUZZZGY1NU123456", label: "Audi Q7 GY", make: "Audi", modelContains: "Q7" },
  { vin: "WAUZZZF7BN1234567", label: "Audi Q7 F7", make: "Audi", modelContains: "Q7" },
  { vin: "WAUZZZ4LBAN123456", label: "Audi Q7 4L", make: "Audi", modelContains: "Q7" },
  { vin: "WAUZZZF1ZAN123456", label: "Audi Q8 F1", make: "Audi", modelContains: "Q8" },
  { vin: "WAUZZZGEAN1234567", label: "Audi Q8 e-tron GE", make: "Audi", modelContains: "Q8" },
  { vin: "WAUZZZGFAN1234567", label: "Audi Q6 e-tron GF", make: "Audi", modelContains: "Q6" },
  { vin: "WAUZZZGBAN1234567", label: "Audi Q4 e-tron GB", make: "Audi", modelContains: "Q4" },
  { vin: "WAUZZZGUAN1234567", label: "Audi Q5/SQ5 GU", make: "Audi", modelContains: "Q5", modelExcludes: ["e-tron GT"] },
  { vin: "WAUZZZFWAN1234567", label: "Audi e-tron GT FW", make: "Audi", modelContains: "e-tron GT" },
  { vin: "WAUZZZFGAN1234567", label: "Audi R8 FG", make: "Audi", modelContains: "R8" },
  { vin: "WAUZZZFXAN1234567", label: "Audi R8 FX", make: "Audi", modelContains: "R8" },
  { vin: "WAUZZZTRAN1234567", label: "Audi TT TR", make: "Audi", modelContains: "TT" },
  { vin: "WVGZZZF7BN1234567", label: "Audi Q7 Bratislava", make: "Audi", modelContains: "Q7" },
  // US WA1
  { vin: "WA1LFAFP5HA123456", label: "Audi Q5 US", make: "Audi", modelContains: "Q5" },
  { vin: "WA1AAAFV5KA123456", label: "Audi Q3 US", make: "Audi", modelContains: "Q3" },
  { vin: "WA1BAAF75HD123456", label: "Audi Q7 US", make: "Audi", modelContains: "Q7" },
  { vin: "WA1MFAFP5HA123456", label: "Audi Q8 US", make: "Audi", modelContains: "Q8" },
  { vin: "WA1FFAFP5HA123456", label: "Audi Q5 Sportback US", make: "Audi", modelContains: "Q5" },
];

const BMW: Case[] = [
  { vin: "WBA1C1105FK123456", label: "BMW 1 Series F20", make: "BMW", modelContains: "1 Series" },
  { vin: "WBA1H1105LK123456", label: "BMW 1 Series F40", make: "BMW", modelContains: "1 Series" },
  { vin: "WBA2A1105FK123456", label: "BMW 2 Series F45", make: "BMW", modelContains: "2 Series" },
  { vin: "WBA2T1105MK123456", label: "BMW 2 Series G42", make: "BMW", modelContains: "2 Series" },
  { vin: "WBA2X1105LK123456", label: "BMW 2 Series F44", make: "BMW", modelContains: "2 Series" },
  { vin: "WBA3A5C55FK123456", label: "BMW 3 Series ambiguous", make: "BMW", modelContains: "3 Series", modelExcludes: ["E90", "4 Series"] },
  { vin: "WBA3W1105LK123456", label: "BMW 3 Series G20", make: "BMW", modelContains: "3 Series" },
  { vin: "WBA3V7106FJ995387", label: "BMW 4 Series F33", make: "BMW", modelContains: "4 Series", modelExcludes: ["3 Series"] },
  { vin: "WBA4B1C59FG241156", label: "BMW 4 Series F36", make: "BMW", modelContains: "4 Series" },
  { vin: "WBA4S1105MK123456", label: "BMW 4 Series G22", make: "BMW", modelContains: "4 Series" },
  { vin: "WBA5E1105HJ123456", label: "BMW 5 Series G30", make: "BMW", modelContains: "5 Series" },
  { vin: "WBA5J1105FK123456", label: "BMW 5 Series F10", make: "BMW", modelContains: "5 Series" },
  { vin: "WBA5U1105RK123456", label: "BMW 5 Series G60", make: "BMW", modelContains: "5 Series" },
  { vin: "WBA6D6C53HG388222", label: "BMW 6 Series F06", make: "BMW", modelContains: "6 Series" },
  { vin: "WBA7C1105FK123456", label: "BMW 7 Series G11", make: "BMW", modelContains: "7 Series" },
  { vin: "WBA7L1105NK123456", label: "BMW 7 Series G70", make: "BMW", modelContains: "7 Series" },
  { vin: "WBA8C1105JK123456", label: "BMW 8 Series", make: "BMW", modelContains: "8 Series" },
  // EU ETK letter type codes (pos.4–7) — same pattern as catalog German VINs
  { vin: "WBADZ2C01LCD26813", label: "BMW 8 Series G14 ETK DZ", make: "BMW", modelContains: "8 Series", year: 2020, modelExcludes: ["5 Series"] },
  { vin: "WBAGV8106RCR24769", label: "BMW 8 Series G16 ETK GV", make: "BMW", modelContains: "8 Series", year: 2024 },
  { vin: "WBAJC310XHG857079", label: "BMW 5 Series G30 ETK JC", make: "BMW", modelContains: "5 Series", year: 2017, modelExcludes: ["8 Series", "X5"] },
  // SUVs — sibling negatives
  { vin: "WBA71BX03P9R09775", label: "BMW X1", make: "BMW", modelContains: "X1", modelExcludes: ["7 Series"] },
  { vin: "WBA72BX03K9R09775", label: "BMW X2", make: "BMW", modelContains: "X2", modelExcludes: ["7 Series"] },
  { vin: "WBA31BH00P9R09775", label: "BMW X3", make: "BMW", modelContains: "X3", modelExcludes: ["3 Series"] },
  { vin: "WBA13A000P9R09775", label: "BMW X4", make: "BMW", modelContains: "X4", modelExcludes: ["1 Series"] },
  { vin: "WBA53A000P9R09775", label: "BMW X5", make: "BMW", modelContains: "X5", modelExcludes: ["5 Series"] },
  { vin: "WBA11A000P9R09775", label: "BMW X6", make: "BMW", modelContains: "X6", modelExcludes: ["1 Series"] },
  { vin: "WBA21EM00P9R09775", label: "BMW X7", make: "BMW", modelContains: "X7", modelExcludes: ["2 Series"] },
  // M / i / US / EU ZZZ
  { vin: "WBS3A0000FK123456", label: "BMW M3", make: "BMW M", modelContains: "M3" },
  { vin: "WBS4A0000FK123456", label: "BMW M4", make: "BMW M", modelContains: "M4" },
  { vin: "WBS5A0000FK123456", label: "BMW M5", make: "BMW M", modelContains: "M5" },
  { vin: "WBY1Z4100F0123456", label: "BMW i3", make: "BMW", modelContains: "i3" },
  { vin: "WBY51CF00NF123456", label: "BMW i4", make: "BMW", modelContains: "i4" },
  { vin: "WBY2Z4100N0123456", label: "BMW i7", make: "BMW", modelContains: "i7" },
  { vin: "WBY7E21050V123456", label: "BMW iX", make: "BMW", modelContains: "iX" },
  { vin: "WBY8Z4100F0123456", label: "BMW i8", make: "BMW", modelContains: "i8" },
  { vin: "5YM81KX02M0123456", label: "BMW X1 US 5YM", make: "BMW", modelContains: "X1" },
  { vin: "5UXKR0000L0123456", label: "BMW X5 US 5UX", make: "BMW", modelContains: "X5" },
  { vin: "5UX3V7106FJ995387", label: "BMW 4 Series US", make: "BMW", modelContains: "4 Series" },
  { vin: "WBAZZZ310X0A12345", label: "BMW 3 Series EU ZZZ", make: "BMW", modelContains: "3 Series" },
  { vin: "WBAZZZ5E0X0A12345", label: "BMW 5 Series EU ZZZ", make: "BMW", modelContains: "5 Series" },
  { vin: "WBAZZZ6C0X0A12345", label: "BMW 6 Series EU ZZZ", make: "BMW", modelContains: "6 Series" },
  { vin: "WBAZZZXF5X0A12345", label: "BMW X5 EU XF5", make: "BMW", modelContains: "X5" },
  { vin: "WBAZZZXF3X0A12345", label: "BMW X3 EU XF3", make: "BMW", modelContains: "X3" },
  { vin: "WBAZZZXF7X0A12345", label: "BMW X7 EU XF7", make: "BMW", modelContains: "X7" },
];

describe("premium three-brand model QA — Mercedes-Benz", () => {
  for (const c of MERCEDES) {
    it(`${c.label} — ${c.vin}`, () => assertCase(c));
  }
});

describe("premium three-brand model QA — Audi", () => {
  for (const c of AUDI) {
    it(`${c.label} — ${c.vin}`, () => assertCase(c));
  }
});

describe("premium three-brand model QA — BMW", () => {
  for (const c of BMW) {
    it(`${c.label} — ${c.vin}`, () => assertCase(c));
  }
});

describe("premium three-brand negatives", () => {
  it("Mercedes letter H never returns C-Class on a 2015 VIN", () => {
    const r = decodeVin("WDDHF5KB6FA123456");
    expect(r.model).toMatch(/E-Class/i);
    expect(r.model).not.toMatch(/C-Class/i);
  });

  it("Mercedes WDD296 is EQS SUV not EQE SUV", () => {
    const r = decodeVin("WDD296087NA123456");
    expect(r.model).toMatch(/EQS SUV/i);
    expect(r.model).not.toMatch(/EQE/i);
  });

  it("Audi GU is current Q5/SQ5, not e-tron GT", () => {
    const r = decodeVin("WAUZZZGUAN1234567");
    expect(r.model?.toLowerCase()).toContain("q5");
    expect(r.model?.toLowerCase()).not.toContain("e-tron gt");
  });

  it("BMW X1 never decodes as 7 Series", () => {
    const r = decodeVin("WBA71BX03P9R09775");
    expect(r.model?.toLowerCase()).toContain("x1");
    expect(r.model?.toLowerCase()).not.toContain("7 series");
  });

  it("BMW X7 never decodes as 2 Series", () => {
    const r = decodeVin("WBA21EM00P9R09775");
    expect(r.model?.toLowerCase()).toContain("x7");
    expect(r.model?.toLowerCase()).not.toContain("2 series");
  });

  it("WVG Touareg stays Volkswagen not Audi", () => {
    const r = decodeVin("WVGZZZ7PZAD000001");
    expect(r.make).toBe("Volkswagen");
    expect(r.model?.toLowerCase()).toContain("touareg");
  });
});
