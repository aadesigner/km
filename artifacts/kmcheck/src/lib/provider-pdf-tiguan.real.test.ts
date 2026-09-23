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
    expect(r.form.ownerHistory.every((o) => !/-01-01$/.test(o.date))).toBe(true);
    // No invented Jan-1 purchase-year owner rows
    expect(r.form.ownerHistory.some((o) => o.date === "2012-01-01" || o.date === "2026-01-01")).toBe(false);
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
      expect(m.location).not.toMatch(/reported.*Gc Tire|Gc Tire.*905/i);
      expect(`${m.titleStatus} ${m.description} ${m.location}`).not.toMatch(/carfax/i);
    }

    for (const s of r.form.serviceHistory) {
      expect(junkRe.test(`${s.title} ${s.description} ${s.location}`), `svc junk: ${s.title}|${s.description}|${s.location}`).toBe(false);
      expect(`${s.title} ${s.description} ${s.location}`).not.toMatch(/carfax/i);
    }

    const doral = r.form.mileageHistory.find((m) => m.date.startsWith("2012-01-28"));
    expect(doral?.location).toMatch(/Doral Volkswagen/i);
    expect(doral?.titleStatus).toMatch(/Vehicle serviced/i);

    const tire = r.form.mileageHistory.find((m) => m.date.startsWith("2026-04-20"));
    expect(tire?.location).toBe("Gc Tire And Auto Brampton, ON");
    expect(tire?.location).not.toMatch(/j4yte|fbclid|tirecraft|0gi7/i);
    expect(tire?.titleStatus).toMatch(/Vehicle serviced/i);
    expect(tire?.description).toMatch(/Brake pads replaced/i);
    expect(tire?.description).toMatch(/Tire\(s\) changed|Brakes checked/i);
    expect(tire?.description).not.toMatch(/tirecraft|fbclid|Comments/i);

    const reg = r.form.mileageHistory.find(
      (m) => /registration issued or renewed/i.test(m.description),
    );
    expect(reg?.titleStatus ?? "").toBe("");
    expect(reg?.description).toBe("Registration issued or renewed");
    expect(reg?.description ?? "").not.toMatch(/ignition|spark|coil|tire/i);

    // Shop work from PDF dumps should land on Vehicle serviced, not stay empty for the Gc Tire visit
    const tireSvc = r.form.serviceHistory.find((s) => s.date.startsWith("2026-04-20"));
    expect(tireSvc?.description ?? "").toMatch(/Brake|Tire/i);

    for (const s of r.form.serviceHistory) {
      expect(s.description).not.toMatch(/importer|michigan|first owner|title issued|pre-delivery|titled or registered/i);
      expect(s.location).not.toMatch(/importer|manufacturer/i);
      expect(s.title).not.toMatch(/importer|michigan|title issued/i);
    }
  });
});
