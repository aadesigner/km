import { readFileSync } from "fs";
import { describe, expect, it } from "vitest";
import { parseProviderPdfText } from "./provider-pdf-parse";

describe("real Carfax Tiguan PDF extract", () => {
  const text = readFileSync(new URL("./fixtures-tiguan-carfax.txt", import.meta.url), "utf8");
  const r = parseProviderPdfText(text, "WVGAV7AX1CW554218");

  it("parses ok with 4 owners and clean mileage fields", () => {
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.form.ownerCount).toBe("4");
    expect(r.form.ownerHistory).toHaveLength(4);
    expect(r.form.model).toMatch(/Tiguan/i);
    expect(r.form.model).not.toMatch(/164/);
    expect(r.form.odometer).toBe(String(Math.round(164714 * 1.609344)));

    const junkRe =
      /tirecraft|fbclid|customer favorites|doralvw|westherr|schmitts\.com|\d\.\d\s*\/\s*\d/i;

    for (const m of r.form.mileageHistory) {
      expect(junkRe.test(m.titleStatus), `title junk: ${m.titleStatus}`).toBe(false);
      expect(junkRe.test(m.description), `desc junk: ${m.description}`).toBe(false);
      expect(junkRe.test(m.location), `loc junk: ${m.location}`).toBe(false);
      expect(m.titleStatus).not.toMatch(/Doral Volkswagen\s*305/i);
    }

    const doral = r.form.mileageHistory.find((m) => m.date.startsWith("2012-01-28"));
    expect(doral?.location).toMatch(/Doral Volkswagen/i);
    expect(doral?.titleStatus).toMatch(/Vehicle serviced/i);

    const tire = r.form.mileageHistory.find((m) => m.date.startsWith("2026-04-20"));
    expect(tire?.location).toMatch(/Gc Tire/i);
    expect(tire?.titleStatus).toMatch(/Vehicle serviced/i);
    expect(tire?.description).not.toMatch(/tirecraft|fbclid/i);
  });
});
