import { describe, expect, it } from "vitest";
import { milesToKm, readingToKm, parseOdometerNumber } from "./provider-pdf-miles";
import {
  detectProviderPdfKind,
  extractVinsFromText,
  parseProviderPdfText,
} from "./provider-pdf-parse";
import { applyProviderPdfToForm } from "./provider-pdf-apply";
import { EMPTY_VIN_CATALOG_FORM } from "@/components/admin/vin-catalog-data-form";

const SAMPLE_VIN = "1HGCM82633A004352";
const OTHER_VIN = "5YJSA1E14HF000001";

const CARFAX_FIXTURE = `
CARFAX Vehicle History Report
VIN: ${SAMPLE_VIN}
Year: 2019
Make: Honda
Model: Civic
Trim: EX
Engine: 2.0L I4
Transmission: Automatic
Fuel Type: Gasoline
Body Style: Sedan
Exterior Color: Blue
Title: Clean Title
Number of Owners: 2
Odometer: 45,230 miles

Accident / Damage History
03/15/2021 Collision reported 32,100 miles Austin, TX Front impact damage
No flood damage reported

Owner History
01/10/2019 Title issued Personal lease Houston, TX 12 miles
06/20/2021 Sold / Ownership transferred 33,400 miles Austin, TX

Odometer History
01/10/2019 12 miles Title / Registration
03/15/2021 32,100 miles Accident reported
11/02/2023 45,230 miles Inspection
`;

const AUTOCHECK_FIXTURE = `
AutoCheck Vehicle History Report
Experian AutoCheck
VIN ${SAMPLE_VIN}
2018 Toyota Camry SE
Engine 2.5L
Transmission Automatic
Fuel Gasoline
Body Sedan
Color White
Owners 1
Last reported odometer 28,500 mi
Title brand: Salvage
Accident Information
07/04/2020 Accident 18,200 miles Dallas, TX Side impact
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

describe("provider-pdf-parse", () => {
  it("detects Carfax and AutoCheck", () => {
    expect(detectProviderPdfKind(CARFAX_FIXTURE)).toBe("carfax");
    expect(detectProviderPdfKind(AUTOCHECK_FIXTURE)).toBe("autocheck");
    expect(detectProviderPdfKind("random text without brands")).toBe("unknown");
  });

  it("extracts VINs", () => {
    expect(extractVinsFromText(CARFAX_FIXTURE)).toContain(SAMPLE_VIN);
  });

  it("fails on empty / tiny text", () => {
    const r = parseProviderPdfText("hi", SAMPLE_VIN);
    expect(r.ok).toBe(false);
  });

  it("fails when PDF VIN mismatches pending VIN", () => {
    const r = parseProviderPdfText(CARFAX_FIXTURE, OTHER_VIN);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/does not match/i);
  });

  it("parses Carfax specs and converts miles to km", () => {
    const r = parseProviderPdfText(CARFAX_FIXTURE, SAMPLE_VIN);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.provider).toBe("carfax");
    expect(r.form.year).toBe("2019");
    expect(r.form.make).toBe("Honda");
    expect(r.form.model).toMatch(/Civic/i);
    expect(r.form.odometer).toBe(String(milesToKm(45230)));
    expect(r.form.ownerCount).toBe("2");
    expect(r.form.accidents.length).toBeGreaterThanOrEqual(1);
    expect(r.form.accidents[0]!.odometerAtLoss).toBe(String(milesToKm(32100)));
    expect(r.form.mileageHistory.some((m) => m.unit === "km")).toBe(true);
    expect(r.form.country).toBe("us");
  });

  it("parses AutoCheck salvage and accident", () => {
    const r = parseProviderPdfText(AUTOCHECK_FIXTURE, SAMPLE_VIN);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.provider).toBe("autocheck");
    expect(r.form.make).toMatch(/Toyota/i);
    expect(r.form.isSalvage).toBe(true);
    expect(r.form.odometer).toBe(String(milesToKm(28500)));
    expect(r.form.accidents.length).toBeGreaterThanOrEqual(1);
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
    expect(next.year).toBe("2019");
  });
});
