import { describe, expect, it } from "vitest";
import { milesToKm, readingToKm, parseOdometerNumber } from "./provider-pdf-miles";
import {
  cleanHistoryNote,
  detectProviderPdfKind,
  extractHistoryOdometerKm,
  extractVinsFromText,
  parseEngine,
  parseProviderPdfText,
} from "./provider-pdf-parse";
import { applyProviderPdfToForm } from "./provider-pdf-apply";
import { EMPTY_VIN_CATALOG_FORM } from "@/components/admin/vin-catalog-data-form";

const SAMPLE_VIN = "1HGCM82633A004352";
const OTHER_VIN = "5YJSA1E14HF000001";
const AUDI_VIN = "WAUZZZ4G0DN000001";

const CARFAX_FIXTURE = `
CARFAX Vehicle History Report
VIN: ${SAMPLE_VIN}
Year: 2019
Make: Honda
Model: Civic EX
Engine: 2.0L I4 Turbo
Transmission: Automatic
Fuel Type: Gasoline
Body Style: Sedan
Exterior Color: Blue - vehicle noted
Title: Clean Title
Number of Owners: 2
Odometer: 45,230 miles

Accident / Damage History
03/15/2021 Collision reported 32,100 miles Austin, TX Front impact damage

Owner History
01/10/2019 Title issued Personal lease Houston, TX 12 miles
06/20/2021 Sold / Ownership transferred 33,400 miles Austin, TX

Odometer History
01/10/2019 12 miles Title / Registration
03/15/2021 32,100 miles Accident reported
11/02/2023 45,230 miles Inspection

Service History
05/12/2020 Oil change and filter replaced 28,400 miles Austin, TX
09/01/2022 Brake pads replaced 40,100 miles Austin, TX
`;

const AUTOCHECK_FIXTURE = `
AutoCheck Vehicle History Report
Experian AutoCheck
VIN ${SAMPLE_VIN}
2018 Toyota Camry SE
Engine 2.5L I4
Transmission Automatic
Fuel Gasoline
Body Sedan
Color White - vehicle
Owners 1
Last reported odometer 28,500 mi
Title brand: Salvage
Accident Information
07/04/2020 Accident 18,200 miles Dallas, TX Side impact
`;

const AUDI_FIXTURE = `
CARFAX Vehicle History Report
VIN: ${AUDI_VIN}
Year: 2013
Make: Audi
Model: A6 Prestige
Engine: 3.0L V6 TFSI Supercharged
Fuel Type: Gasoline
Body Style: Sedan
Detailed Vehicle History
01/05/2012 10 miles Title issued
06/15/2025 90,000 miles Service oil change
`;

describe("provider-pdf-miles", () => {
  it("converts miles to km", () => {
    expect(milesToKm(1000)).toBe(1609);
    expect(milesToKm(45230)).toBe(Math.round(45230 * 1.609344));
  });

  it("parses odometer numbers with commas", () => {
    expect(parseOdometerNumber("45,230")).toBe(45230);
    expect(parseOdometerNumber("bad")).toBeNull();
  });

  it("respects explicit km unit", () => {
    expect(readingToKm(50000, "km")).toBe(50000);
    expect(readingToKm(1000, "miles")).toBe(1609);
  });
});

describe("cleanHistoryNote", () => {
  it("strips mileage and dates from notes", () => {
    const note = cleanHistoryNote("05/12/2020 Oil change 28,400 miles Austin, TX");
    expect(note.toLowerCase()).toContain("oil change");
    expect(note).not.toMatch(/28,?400/);
    expect(note).not.toMatch(/05\/12\/2020/);
  });
});

describe("provider-pdf-parse", () => {
  it("detects Carfax and AutoCheck", () => {
    expect(detectProviderPdfKind(CARFAX_FIXTURE)).toBe("carfax");
    expect(detectProviderPdfKind(AUTOCHECK_FIXTURE)).toBe("autocheck");
  });

  it("extracts VINs", () => {
    expect(extractVinsFromText(CARFAX_FIXTURE)).toContain(SAMPLE_VIN);
  });

  it("fails on empty / tiny text", () => {
    expect(parseProviderPdfText("hi", SAMPLE_VIN).ok).toBe(false);
  });

  it("fails when PDF VIN mismatches pending VIN", () => {
    const r = parseProviderPdfText(CARFAX_FIXTURE, OTHER_VIN);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/does not match/i);
  });

  it("parses Carfax specs without color or provider_pdf source", () => {
    const r = parseProviderPdfText(CARFAX_FIXTURE, SAMPLE_VIN);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.form.year).toBe("2019");
    expect(r.form.make).toBe("Honda");
    expect(r.form.model).toMatch(/Civic/i);
    expect(r.form.engine).toMatch(/2\.0L/i);
    expect(r.form.fuelType).toMatch(/Gas/i);
    expect(r.form.bodyType).toMatch(/Sedan/i);
    expect(r.form.color).toBe("");
    expect(r.form.odometer).toBe(String(milesToKm(45230)));
    expect(r.form.mileageHistory.every((m) => m.source === "")).toBe(true);
    // Highest mileage first
    const odos = r.form.mileageHistory.map((m) => Number(m.odometer));
    expect(odos).toEqual([...odos].sort((a, b) => b - a));
    // Service rows
    expect(r.form.serviceHistory.length).toBeGreaterThanOrEqual(1);
    expect(r.form.serviceHistory[0]!.description.toLowerCase()).not.toMatch(/miles/);
  });

  it("uses labeled model year; keeps 2012/2025 history dates with real miles (not year-as-odo)", () => {
    const r = parseProviderPdfText(AUDI_FIXTURE, AUDI_VIN);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    // Model year from header — not confused with history dates
    expect(r.form.year).toBe("2013");
    expect(r.form.make).toBe("Audi");
    expect(r.form.model).toMatch(/A6 Prestige/i);
    expect(r.form.engine).toMatch(/3\.0L/i);
    expect(r.form.engine).toMatch(/V6/i);
    expect(r.form.color).toBe("");

    // History years stay — mileage uses real readings, never 2012/2025 as odometer
    const odoValues = r.form.mileageHistory.map((m) => Number(m.odometer));
    expect(odoValues).not.toContain(2012);
    expect(odoValues).not.toContain(2025);
    expect(odoValues).not.toContain(milesToKm(2012));
    expect(odoValues).not.toContain(milesToKm(2025));

    const dates = [
      ...r.form.mileageHistory.map((m) => m.date),
      ...r.form.serviceHistory.map((s) => s.date),
      ...r.form.ownerHistory.map((o) => o.date),
    ];
    expect(dates.some((d) => d.startsWith("2012"))).toBe(true);
    expect(dates.some((d) => d.startsWith("2025"))).toBe(true);
    expect(odoValues).toContain(milesToKm(10));
    expect(odoValues).toContain(milesToKm(90000));
  });

  it("does not treat calendar years as mileage readings", () => {
    expect(extractHistoryOdometerKm("Title issued Houston, TX", "2012-01-05")).toBe("");
    expect(extractHistoryOdometerKm("2012 Title issued", "2012-01-05")).toBe("");
    expect(extractHistoryOdometerKm("10 miles Title issued", "2012-01-05")).toBe(
      String(milesToKm(10)),
    );
    expect(extractHistoryOdometerKm("90,000 miles Service oil change", "2025-06-15")).toBe(
      String(milesToKm(90000)),
    );
  });

  it("parses engine richly", () => {
    expect(parseEngine("Engine: 3.0L V6 TFSI Supercharged\nFuel: Gasoline")).toMatch(/3\.0L.*V6/i);
  });

  it("parses AutoCheck salvage", () => {
    const r = parseProviderPdfText(AUTOCHECK_FIXTURE, SAMPLE_VIN);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.form.make).toMatch(/Toyota/i);
    expect(r.form.isSalvage).toBe(true);
    expect(r.form.color).toBe("");
  });
});

describe("provider-pdf-apply", () => {
  it("replaces draft but keeps photos", () => {
    const current = {
      ...EMPTY_VIN_CATALOG_FORM,
      make: "Old",
      photos: ["https://cdn.example.com/a.jpg"],
    };
    const parsed = parseProviderPdfText(CARFAX_FIXTURE, SAMPLE_VIN);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const next = applyProviderPdfToForm(current, parsed.form);
    expect(next.make).toBe("Honda");
    expect(next.photos).toEqual(["https://cdn.example.com/a.jpg"]);
    expect(next.color).toBe("");
  });
});
