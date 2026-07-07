import type { VinPageSeo, VinSeoLang } from "@workspace/vin-page-seo";
import { buildVinOnlyPageDescription, buildVinOnlyPageTitle, buildVinPageSeo, normalizeVin } from "@workspace/vin-page-seo";

const OG_LOCALE_MAP: Record<VinSeoLang, string> = {
  en: "en_US",
  es: "es_ES",
  ar: "ar_SA",
  uk: "uk_UA",
  ru: "ru_RU",
  ro: "ro_RO",
  sq: "sq_AL",
};

const HREFLANG_MAP: Record<VinSeoLang, string> = {
  en: "en",
  es: "es",
  ar: "ar",
  uk: "uk-UA",
  ru: "ru",
  ro: "ro",
  sq: "sq-AL",
};

const SEO_LANGS: VinSeoLang[] = ["en", "es", "uk", "ru", "ro", "ar", "sq"];

function escapeHtml(value: string): string {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function removeGeneratedSeoTags(html: string): string {
  return html
    .replace(/\n?\s*<meta name="description"[^>]*>/g, "")
    .replace(/\n?\s*<meta name="robots"[^>]*>/g, "")
    .replace(/\n?\s*<meta property="og:[^"]+"[^>]*>/g, "")
    .replace(/\n?\s*<meta name="twitter:[^"]+"[^>]*>/g, "")
    .replace(/\n?\s*<link rel="canonical"[^>]*>/g, "")
    .replace(/\n?\s*<link rel="alternate" hreflang="[^"]+"[^>]*>/g, "")
    .replace(/\n?\s*<meta property="og:locale:alternate"[^>]*>/g, "")
    .replace(/\n?\s*<script id="kmcheck-json-ld"[^>]*>[\s\S]*?<\/script>/g, "");
}

function buildSeoHeadBlock(seo: VinPageSeo, lang: VinSeoLang, origin: string): string {
  const canonicalUrl = `${origin.replace(/\/$/, "")}${seo.canonicalPath}`;
  const rest = seo.canonicalPath.replace(/^\/(en|es|uk|ru|ro|ar|sq)/, "");
  const lines = [
    `<meta name="description" content="${escapeHtml(seo.description)}" />`,
    `<meta name="robots" content="index, follow" />`,
    `<link rel="canonical" href="${escapeHtml(canonicalUrl)}" />`,
    `<meta property="og:title" content="${escapeHtml(seo.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(seo.description)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:url" content="${escapeHtml(canonicalUrl)}" />`,
    `<meta property="og:locale" content="${OG_LOCALE_MAP[lang]}" />`,
    `<meta property="og:site_name" content="kmcheck.com" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeHtml(seo.title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(seo.description)}" />`,
  ];

  if (seo.ogImage) {
    lines.push(`<meta property="og:image" content="${escapeHtml(seo.ogImage)}" />`);
    lines.push(`<meta name="twitter:image" content="${escapeHtml(seo.ogImage)}" />`);
    if (seo.ogImage.startsWith("https://")) {
      lines.push(`<meta property="og:image:secure_url" content="${escapeHtml(seo.ogImage)}" />`);
    }
    if (seo.ogImageAlt) {
      lines.push(`<meta property="og:image:alt" content="${escapeHtml(seo.ogImageAlt)}" />`);
    }
  }

  for (const l of SEO_LANGS) {
    const href = `${origin.replace(/\/$/, "")}/${l}${rest}`;
    lines.push(`<link rel="alternate" hreflang="${HREFLANG_MAP[l]}" href="${escapeHtml(href)}" />`);
  }
  lines.push(
    `<link rel="alternate" hreflang="x-default" href="${escapeHtml(`${origin.replace(/\/$/, "")}/en${rest}`)}" />`,
  );
  for (const l of SEO_LANGS) {
    if (l === lang) continue;
    lines.push(`<meta property="og:locale:alternate" content="${OG_LOCALE_MAP[l]}" />`);
  }

  if (seo.jsonLd.length > 0) {
    lines.push(
      `<script id="kmcheck-json-ld" type="application/ld+json">${JSON.stringify(seo.jsonLd)}</script>`,
    );
  }

  return `\n    ${lines.join("\n    ")}\n`;
}

export function injectVinPageSeoIntoHtml(
  html: string,
  seo: VinPageSeo,
  lang: VinSeoLang,
  origin: string,
): string {
  const dir = lang === "ar" ? "rtl" : "ltr";
  let out = removeGeneratedSeoTags(html);

  out = out.replace(/<html([^>]*)>/i, (_match, attrs) => {
    const cleaned = String(attrs)
      .replace(/\s*lang="[^"]*"/gi, "")
      .replace(/\s*dir="[^"]*"/gi, "");
    return `<html${cleaned} lang="${lang}" dir="${dir}">`;
  });

  out = out.replace(
    /<title>[^<]*<\/title>/i,
    `<title>${escapeHtml(seo.title)}</title>`,
  );

  const seoBlock = buildSeoHeadBlock(seo, lang, origin);
  out = out.replace(/<\/title>/i, `</title>${seoBlock}`);

  return out;
}

export function buildVinOnlyFallbackSeo(lang: VinSeoLang, vin: string, origin: string): VinPageSeo {
  const normalized = normalizeVin(vin);
  return buildVinPageSeo(lang, { vin: normalized }, origin);
}

export function buildVinOnlyFallbackSeoLegacy(lang: VinSeoLang, vin: string): { title: string; description: string } {
  const normalized = normalizeVin(vin);
  return {
    title: buildVinOnlyPageTitle(lang, normalized),
    description: buildVinOnlyPageDescription(lang, normalized),
  };
}
