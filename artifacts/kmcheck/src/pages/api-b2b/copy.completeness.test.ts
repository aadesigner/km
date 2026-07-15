import { describe, expect, it } from "vitest";
import { B2B_COPY, type B2bCopy } from "./copy";
import { SUPPORTED_LANGS } from "@/lib/languages";

/** Same across locales on purpose (brand / contact handles). */
const ALLOW_SAME_AS_EN = new Set([
  "contactEmail",
  "contactTelegram",
  "brandApi",
  "heroBrand",
  "contactTelegramLabel", // brand name in most locales
]);

describe("api-b2b copy completeness", () => {
  const en = B2B_COPY.en;
  const keys = Object.keys(en) as (keyof B2bCopy)[];

  it("provides every supported language", () => {
    for (const lang of SUPPORTED_LANGS) {
      expect(B2B_COPY[lang], lang).toBeTruthy();
    }
  });

  it("has no English leftovers in non-English packs (except allowlist)", () => {
    const failures: string[] = [];
    for (const lang of SUPPORTED_LANGS) {
      if (lang === "en") continue;
      const c = B2B_COPY[lang];
      for (const k of keys) {
        if (ALLOW_SAME_AS_EN.has(k)) continue;
        const a = en[k];
        const b = c[k];
        const same = Array.isArray(a)
          ? JSON.stringify(a) === JSON.stringify(b)
          : a === b;
        if (same) failures.push(`${lang}.${String(k)}`);
      }
    }
    expect(failures, failures.join("\n")).toEqual([]);
  });

  it("translates the user-flagged plan developer blurb", () => {
    for (const lang of SUPPORTED_LANGS) {
      if (lang === "en") continue;
      expect(B2B_COPY[lang].planDevDesc).not.toBe(en.planDevDesc);
      expect(B2B_COPY[lang].planDevPoints).not.toEqual(en.planDevPoints);
    }
  });
});
