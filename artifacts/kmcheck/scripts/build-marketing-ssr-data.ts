/**
 * Snapshot marketing SSR body copy for prerender + server inject.
 * Run: pnpm exec tsx scripts/build-marketing-ssr-data.ts
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { MarketingSsrContent, MarketingSsrData } from "@workspace/marketing-page-seo";
import { SUPPORTED_LANGS, type Language } from "../src/lib/languages";
import { getB2bCopy, getRegionHeadlineLabel } from "../src/pages/api-b2b/copy";
import { API_B2B_REGIONS } from "../src/pages/api-b2b/regions";

const __dir = dirname(fileURLToPath(import.meta.url));
const i18nDir = join(__dir, "../src/i18n");
const outPath = join(__dir, "marketing-ssr-data.json");
const libOutPath = join(__dir, "../src/lib/marketing-ssr-data.json");
const workspaceOutPath = join(__dir, "../../../lib/marketing-page-seo/marketing-ssr-data.json");

type Dict = Record<string, string>;

function loadI18n(lang: Language): Dict {
  const raw = readFileSync(join(i18nDir, `${lang}.json`), "utf8").replace(/^\uFEFF/, "");
  return JSON.parse(raw) as Dict;
}

function pick(t: Dict, key: string): string {
  return (t[key] ?? "").trim();
}

function bullets(t: Dict, keys: string[]): string[] {
  return keys.map((key) => pick(t, key)).filter(Boolean);
}

function section(t: Dict, titleKey: string, bodyKey: string) {
  const title = pick(t, titleKey);
  const body = pick(t, bodyKey);
  if (!title || !body) return null;
  return { title, body };
}

function homeContent(t: Dict, lang: Language): MarketingSsrContent {
  const h1 = lang === "sq"
    ? `${pick(t, "hero_headline_1")}, ${pick(t, "hero_headline_2")}`
    : `${pick(t, "hero_headline_1")} ${pick(t, "hero_headline_2")}`.replace(/\s+/g, " ").trim();

  return {
    h1,
    lead: pick(t, "hero_subtext"),
    bullets: bullets(t, [
      "cycling_hidden_accidents",
      "cycling_salvage_titles",
      "cycling_mileage_rollbacks",
      "cycling_theft_records",
    ]),
    sections: [
      section(t, "what_we_check", "what_we_check_sub"),
      section(t, "how_it_works", "how_it_works_desc"),
    ].filter((row): row is { title: string; body: string } => row != null),
  };
}

function pricingContent(t: Dict): MarketingSsrContent {
  return {
    h1: `${pick(t, "pricing_hero_title_1")} ${pick(t, "pricing_hero_title_2")}`.trim(),
    lead: pick(t, "pricing_hero_lead"),
    bullets: bullets(t, [
      "pricing_feature_accidents",
      "pricing_seo_value_delivery_title",
      "pricing_guarantee_band_title",
    ]),
    sections: [
      section(t, "pricing_seo_title", "pricing_seo_sub"),
      section(t, "pricing_guarantee_band_title", "pricing_guarantee_band_sub"),
    ].filter((row): row is { title: string; body: string } => row != null),
  };
}

function howItWorksContent(t: Dict): MarketingSsrContent {
  return {
    h1: pick(t, "how_it_works"),
    lead: pick(t, "how_it_works_desc"),
    bullets: bullets(t, ["step_1_title", "step_2_title", "step_3_title"]),
  };
}

function faqContent(t: Dict): MarketingSsrContent {
  return {
    h1: pick(t, "faq_title"),
    lead: pick(t, "faq_subtitle"),
    bullets: bullets(t, ["faq_1_q", "faq_2_q", "faq_3_q"]),
    sections: [
      section(t, "faq_1_q", "faq_1_a"),
      section(t, "faq_2_q", "faq_2_a"),
    ].filter((row): row is { title: string; body: string } => row != null),
  };
}

function freeDecoderContent(t: Dict): MarketingSsrContent {
  return {
    h1: `${pick(t, "free_decoder_title_lead")} ${pick(t, "free_decoder_title_highlight")}`.trim(),
    lead: pick(t, "free_decoder_subtitle"),
    bullets: bullets(t, ["free_decoder_badge"]),
  };
}

function countryContent(t: Dict, prefix: string): MarketingSsrContent {
  const origin = pick(t, `${prefix}_headline_origin`);
  const originPrefix = pick(t, `${prefix}_headline_origin_prefix`);
  const originWord = pick(t, `${prefix}_name`) || origin.replace(originPrefix, "").trim();
  const h1 = `${pick(t, `${prefix}_headline_verb`)} ${pick(t, `${prefix}_cycling_0`)} ${originPrefix}${originWord}`.replace(/\s+/g, " ").trim();

  return {
    h1,
    lead: pick(t, `${prefix}_description`),
    bullets: bullets(t, [
      `${prefix}_included_0`,
      `${prefix}_included_1`,
      `${prefix}_included_2`,
    ]),
    sections: [
      section(t, `${prefix}_issues_sub`, `${prefix}_included_sub`),
    ].filter((row): row is { title: string; body: string } => row != null),
  };
}

function b2bContent(lang: Language, rest: string): MarketingSsrContent {
  const c = getB2bCopy(lang);
  let title = c.seoHomeTitle;
  let description = c.seoHomeDesc;
  const tail = rest.replace(/^\/api-b2b/, "") || "";
  if (tail === "/plans") {
    title = c.seoPlansTitle;
    description = c.seoPlansDesc;
  } else if (tail === "/contact") {
    title = c.seoContactTitle;
    description = c.seoContactDesc;
  } else if (tail === "/vin-decoder") {
    title = c.seoDecoderTitle;
    description = c.seoDecoderDesc;
  } else if (tail.startsWith("/")) {
    const slug = tail.slice(1);
    const region = API_B2B_REGIONS.find((r) => r.slug === slug);
    if (region) {
      const label = getRegionHeadlineLabel(c, region.slug, lang);
      title = c.seoRegionTitle.replace(/\{region\}/g, label);
      description = c.seoRegionDesc.replace(/\{region\}/g, label);
    }
  }
  return { h1: title, lead: description };
}

const PAGE_BUILDERS: Record<string, (t: Dict, lang: Language) => MarketingSsrContent> = {
  home: homeContent,
  pricing: (t) => pricingContent(t),
  how_it_works: (t) => howItWorksContent(t),
  faq: (t) => faqContent(t),
  free_decoder: (t) => freeDecoderContent(t),
  country_usa: (t) => countryContent(t, "country_usa"),
  country_korea: (t) => countryContent(t, "country_korea"),
  country_canada: (t) => countryContent(t, "country_canada"),
  country_china: (t) => countryContent(t, "country_china"),
  country_uae: (t) => countryContent(t, "country_uae"),
};

const data: MarketingSsrData = {};

for (const pageKey of Object.keys(PAGE_BUILDERS)) {
  data[pageKey as keyof MarketingSsrData] = {};
  const build = PAGE_BUILDERS[pageKey]!;
  for (const lang of SUPPORTED_LANGS) {
    const t = loadI18n(lang);
    const content = build(t, lang);
    if (content.h1 && content.lead) {
      data[pageKey as keyof MarketingSsrData]![lang] = content;
    }
  }
}

const b2bPaths = [
  "/api-b2b",
  "/api-b2b/plans",
  "/api-b2b/contact",
  "/api-b2b/vin-decoder",
  ...API_B2B_REGIONS.map((r) => `/api-b2b/${r.slug}`),
] as const;

for (const rest of b2bPaths) {
  const key = rest === "/api-b2b" ? "api_b2b" : `api_b2b${rest.replace(/\//g, "_")}`;
  const bucket: Record<string, MarketingSsrContent> = {};
  for (const lang of SUPPORTED_LANGS) {
    const content = b2bContent(lang, rest);
    if (content.h1 && content.lead) bucket[lang] = content;
  }
  (data as Record<string, Record<string, MarketingSsrContent>>)[key] = bucket;
}

const json = `${JSON.stringify(data, null, 2)}\n`;
writeFileSync(outPath, json, "utf8");
writeFileSync(libOutPath, json, "utf8");
writeFileSync(workspaceOutPath, json, "utf8");
console.log(`Wrote marketing SSR data → ${outPath}`);
