import type { VinPageSeo, VinSeoLang, VinSeoVehicle } from "@workspace/vin-page-seo";
import {
  VIN_SEO_LANGS,
  buildVinOnlyPageDescription,
  buildVinOnlyPageTitle,
  buildVinPageSeo,
  buildVinSsrBodyContent,
  normalizeVin,
  vehicleHasIdentity,
} from "@workspace/vin-page-seo";

const OG_LOCALE_MAP: Record<VinSeoLang, string> = {
  en: "en_US",
  de: "de_DE",
  es: "es_ES",
  fr: "fr_FR",
  sq: "sq_AL",
  pl: "pl_PL",
  ro: "ro_RO",
  bg: "bg_BG",
  ka: "ka_GE",
  ar: "ar_SA",
  uk: "uk_UA",
  ru: "ru_RU",
};

const HREFLANG_MAP: Record<VinSeoLang, string> = {
  en: "en",
  de: "de",
  es: "es",
  fr: "fr",
  sq: "sq-AL",
  pl: "pl",
  ro: "ro",
  bg: "bg",
  ka: "ka",
  ar: "ar",
  uk: "uk-UA",
  ru: "ru",
};

const SEO_LANGS: readonly VinSeoLang[] = VIN_SEO_LANGS;

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
    .replace(/\n?\s*<script id="kmcheck-json-ld"[^>]*>[\s\S]*?<\/script>/g, "")
    .replace(/\n?\s*<style id="kmcheck-vin-ssr-style"[^>]*>[\s\S]*?<\/style>/g, "")
    .replace(/\n?\s*<main id="kmcheck-vin-ssr"[\s\S]*?<\/main>/g, "");
}

function buildVinSsrStyleBlock(): string {
  return `<style id="kmcheck-vin-ssr-style">
      .kmcheck-vin-ssr{max-width:48rem;margin:2rem auto;padding:0 1rem;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;line-height:1.55;color:#0f172a}
      .kmcheck-vin-ssr h1{margin:0 0 .5rem;font-size:1.5rem;line-height:1.25}
      .kmcheck-vin-ssr p{margin:.75rem 0}
      .kmcheck-vin-ssr dl{display:grid;grid-template-columns:minmax(6rem,max-content) 1fr;gap:.35rem .75rem;margin:1rem 0 0}
      .kmcheck-vin-ssr dt{font-weight:600;color:#334155}
      .kmcheck-vin-ssr dd{margin:0}
      .dark .kmcheck-vin-ssr{color:#f8fafc}
      .dark .kmcheck-vin-ssr dt{color:#cbd5e1}
    </style>`;
}

function buildVinSsrBodyBlock(lang: VinSeoLang, vehicle: VinSeoVehicle): string | null {
  const content = buildVinSsrBodyContent(lang, vehicle);
  if (!content) return null;

  const specRows = content.specs
    .map(
      (row) =>
        `          <dt>${escapeHtml(row.label)}</dt><dd>${escapeHtml(row.value)}</dd>`,
    )
    .join("\n");

  return `<main id="kmcheck-vin-ssr" class="kmcheck-vin-ssr">
      <article>
        <h1>${escapeHtml(content.heading)}</h1>
        <p><strong>${escapeHtml(content.vinLabel)}:</strong> ${escapeHtml(content.vin)}</p>
        <p>${escapeHtml(content.intro)}</p>
        <dl>
${specRows}
        </dl>
        <p>${escapeHtml(content.cta)}</p>
      </article>
    </main>`;
}

function injectVinSsrBody(html: string, lang: VinSeoLang, vehicle: VinSeoVehicle): string {
  if (!vehicleHasIdentity(vehicle)) return html;
  const bodyBlock = buildVinSsrBodyBlock(lang, vehicle);
  if (!bodyBlock) return html;

  let out = html.replace(
    /<div id="root">[\s\S]*?<\/div>\s*(?=<script type="module")/i,
    `<div id="root">\n    ${bodyBlock}\n    </div>\n    `,
  );

  if (!out.includes('id="kmcheck-vin-ssr-style"')) {
    out = out.replace(/<\/head>/i, `${buildVinSsrStyleBlock()}\n  </head>`);
  }

  return out;
}

function buildSeoHeadBlock(seo: VinPageSeo, lang: VinSeoLang, origin: string): string {
  const canonicalUrl = `${origin.replace(/\/$/, "")}${seo.canonicalPath}`;
  const rest = seo.canonicalPath.replace(/^\/(en|es|uk|ru|ro|pl|ka|ar|sq|de|fr|bg|zh)/, "");
  const robots = seo.noIndex ? "noindex, follow" : "index, follow";
  const lines = [
    `<meta name="description" content="${escapeHtml(seo.description)}" />`,
    `<meta name="robots" content="${robots}" />`,
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

  // Hreflang only when the page is meant to be indexed.
  if (!seo.noIndex) {
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
  }

  if (!seo.noIndex && seo.jsonLd.length > 0) {
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
  vehicle?: VinSeoVehicle | null,
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

  if (!seo.noIndex && vehicle && vehicleHasIdentity(vehicle)) {
    out = injectVinSsrBody(out, lang, vehicle);
  }

  return out;
}

export function buildVinOnlyFallbackSeo(lang: VinSeoLang, vin: string, origin: string): VinPageSeo {
  const normalized = normalizeVin(vin);
  return {
    ...buildVinPageSeo(lang, { vin: normalized }, origin),
    // Empty / unknown VIN shells must stay out of the index (thin-content risk).
    noIndex: true,
    jsonLd: [],
    ogImage: undefined,
    ogImageAlt: undefined,
  };
}

export function buildVinOnlyFallbackSeoLegacy(lang: VinSeoLang, vin: string): { title: string; description: string } {
  const normalized = normalizeVin(vin);
  return {
    title: buildVinOnlyPageTitle(lang, normalized),
    description: buildVinOnlyPageDescription(lang, normalized),
  };
}
