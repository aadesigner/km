/**
 * Mercedes model + year QA — Baumuster vs ISO year encoding.
 */
import { describe, expect, it } from "vitest";
import {
  decodePremiumEuropean,
  decodeVin,
  isMercedesEuroBaumusterVin,
  premiumVinModelYear,
} from "./index";

describe("Mercedes Euro Baumuster year encoding", () => {
  const baumuster = [
    "WDB2030081A880979", // real C 220 CDI
    "WDB2030081A559171", // known LastVIN C 220 CDI (2003 build — year NOT in VIN)
    "WDD2030491A123456",
    "WDD2020491A123456",
    "WDD2100651A123456", // E-Class W210-style
    "WDB2201751A432136",
    "WDD2130421A123456",
    "WDD4632761A123456",
  ];

  const isoYear = [
    { vin: "WDD205037FA123456", year: 2015, model: /C-Class/i, chassis: "W205" },
    { vin: "WDD204049AA123456", year: 2010, model: /C-Class/i, chassis: "W204" },
    { vin: "WDD213042GA123456", year: 2016, model: /E-Class/i, chassis: "W213" },
    { vin: "WDD206087MA123456", year: 2021, model: /C-Class/i, chassis: "W206" },
    { vin: "WDD177087KA123456", year: 2019, model: /A-Class/i, chassis: "W177" },
    { vin: "WDDGF8HB6LA123456", year: 2020, model: /C-Class/i },
    { vin: "WDDHF5KB6FA123456", year: 2015, model: /E-Class/i },
    { vin: "WDDZF4JB0LA123456", year: 2020, model: /E-Class/i },
    { vin: "WDCDA5HB6HA123456", year: 2017, model: /GLE/i },
    { vin: "WDDZZZ213GAA12345", year: 2016, model: /E-Class/i },
  ];

  it.each(baumuster)("does not invent year for Baumuster %s", (vin) => {
    expect(vin).toHaveLength(17);
    expect(isMercedesEuroBaumusterVin(vin)).toBe(true);
    expect(premiumVinModelYear(vin)).toBeNull();
    expect(decodeVin(vin).year).toBeNull();
    expect(decodeVin(vin).make).toBe("Mercedes-Benz");
  });

  it.each(isoYear)("keeps ISO year for $vin", ({ vin, year, model, chassis }) => {
    expect(isMercedesEuroBaumusterVin(vin)).toBe(false);
    expect(premiumVinModelYear(vin)).toBe(year);
    expect(decodeVin(vin).year).toBe(year);
    expect(decodeVin(vin).model).toMatch(model);
    if (chassis) {
      expect(decodePremiumEuropean(vin)?.chassis).toBe(chassis);
    }
  });

  it("keeps W203 chassis when year is unknown", () => {
    const prem = decodePremiumEuropean("WDB2030081A880979");
    expect(prem?.model).toMatch(/C-Class/i);
    expect(prem?.chassis).toBe("W203");
    expect(prem?.displayModel).toMatch(/W203/);
  });

  it("ML→GLE rename still year-gated on ISO VINs", () => {
    expect(decodeVin("WDD166087FA123456").model).toMatch(/ML/i);
    expect(decodeVin("WDD166087GA123456").model).toMatch(/GLE/i);
  });
});

describe("Mercedes model-line coverage smoke", () => {
  const lines: Array<{ vin: string; model: RegExp }> = [
    { vin: "WDD177087KA123456", model: /A-Class/i },
    { vin: "WDD118087KA123456", model: /CLA/i },
    { vin: "WDD246087JA123456", model: /B-Class/i },
    { vin: "WDD2030491A123456", model: /C-Class/i },
    { vin: "WDD204049AA123456", model: /C-Class/i },
    { vin: "WDD205037FA123456", model: /C-Class/i },
    { vin: "WDD206087MA123456", model: /C-Class/i },
    { vin: "WDD213042GA123456", model: /E-Class/i },
    { vin: "WDD214087PA123456", model: /E-Class/i },
    { vin: "WDD222087HA123456", model: /S-Class/i },
    { vin: "WDD223087LA123456", model: /S-Class/i },
    { vin: "WDDLJ7EB5KA123456", model: /CLS/i },
    { vin: "WDD236087PA123456", model: /CLE/i },
    { vin: "WDD253149GA123456", model: /GLC/i },
    { vin: "WDD254087NA123456", model: /GLC/i },
    { vin: "WDD166087FA123456", model: /ML/i },
    { vin: "WDD166087GA123456", model: /GLE/i },
    { vin: "WDD167087KA123456", model: /GLE/i },
    { vin: "WDD247087LA123456", model: /GLA/i },
    { vin: "WDD463276LA123456", model: /G-Class/i },
    { vin: "WDD290087MA123456", model: /EQS/i },
    { vin: "WDD294087NA123456", model: /EQE/i },
    { vin: "WDD296087NA123456", model: /EQS SUV/i },
    { vin: "WDD243000MA123456", model: /EQ/i },
    { vin: "WDD293087KA123456", model: /EQC/i },
    { vin: "W1K213046GA123456", model: /E-Class/i },
    { vin: "4JGDA5HB6HA123456", model: /GLE/i },
  ];

  it.each(lines)("$vin → $model", ({ vin, model }) => {
    const r = decodeVin(vin);
    expect(r.make).toBe("Mercedes-Benz");
    expect(r.model).toMatch(model);
  });
});
