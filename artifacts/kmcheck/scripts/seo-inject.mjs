/**
 * Shared SEO HTML injection — used by Vite dev plugin, prerender, and bootstrap generator.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dir = dirname(fileURLToPath(import.meta.url));
const seoData = JSON.parse(
  readFileSync(join(__dir, "../src/lib/seo-data.json"), "utf8"),
);

export const SEO_LANGS = ["en", "ar", "uk", "ru", "sq"];

export const PATH_TO_SEO_KEY = {
  "": "home",
  "/pricing": "pricing",
  "/free-vin-decoder": "free_decoder",
  "/how-it-works": "how_it_works",
  "/faq": "faq",
  "/terms": "terms",
  "/privacy": "privacy",
  "/cars/usa": "country_usa",
  "/cars/korea": "country_korea",
  "/cars/canada": "country_canada",
  "/sign-in": "auth",
  "/sign-up": "sign_up",
  "/dashboard": "dashboard",
  "/checkout": "checkout",
  "/purchases": "purchases",
  "/vin/processing": "vin_result",
  "/forgot-password": "forgot_password",
  "/reset-password": "reset_password",
};

const VALID_COUNTRY_SLUGS = new Set(["usa", "korea", "canada"]);

const NOINDEX_EXACT = new Set([
  "/sign-in",
  "/sign-up",
  "/dashboard",
  "/checkout",
  "/purchases",
  "/forgot-password",
  "/reset-password",
  "/vin/processing",
]);

const VIN_INDEX_RE = /^\/vin\/([A-HJ-NPR-Z0-9]{17})$/i;

function isIndexableVinRest(rest) {
  const m = rest.match(VIN_INDEX_RE);
  return !!m && m[1].toLowerCase() !== "processing";
}

function vinSeoFromRest(rest, lang) {
  const m = rest.match(VIN_INDEX_RE);
  if (!m) return null;
  const vin = m[1].toUpperCase();
  const titles = {
    en: `VIN ${vin} — Vehicle History Report | kmcheck`,
    ar: `VIN ${vin} — تقرير تاريخ المركبة | kmcheck`,
    uk: `VIN ${vin} — звіт історії авто | kmcheck`,
    ru: `VIN ${vin} — отчёт по истории авто | kmcheck`,
    sq: `VIN ${vin} — raport historiku automjeti | kmcheck`,
  };
  const descriptions = {
    en: `Check mileage, accidents and vehicle history for VIN ${vin}. Full instant report at kmcheck.com.`,
    ar: `تحقق من الكيلومترات والحوادث والتاريخ الكامل للمركبة لرقم VIN ${vin}. تقرير فوري على kmcheck.com.`,
    uk: `Перевірте пробіг, ДТП та повну історію авто для VIN ${vin}. Миттєвий звіт на kmcheck.com.`,
    ru: `Проверьте пробег, ДТП и полную историю авто для VIN ${vin}. Мгновенный отчёт на kmcheck.com.`,
    sq: `Kontrollo kilometrat, aksidentet dhe historinë për VIN ${vin}. Raport i plotë në kmcheck.com.`,
  };
  return {
    title: titles[lang] ?? titles.en,
    description: descriptions[lang] ?? descriptions.en,
  };
}

export function resolvePageKey(rest) {
  const exact = PATH_TO_SEO_KEY[rest];
  if (exact) return exact;

  if (rest.startsWith("/cars/")) {
    const slug = rest.split("/").filter(Boolean)[1]?.toLowerCase();
    if (slug && VALID_COUNTRY_SLUGS.has(slug)) {
      if (slug === "korea") return "country_korea";
      if (slug === "canada") return "country_canada";
      return "country_usa";
    }
    return "not_found";
  }

  if (rest.startsWith("/vin/")) return "vin_result";

  return "not_found";
}

export function isNoIndexPath(rest, pageKey) {
  if (pageKey === "not_found") return true;
  if (isIndexableVinRest(rest)) return false;
  return NOINDEX_EXACT.has(rest) || rest.startsWith("/vin/");
}

export const HREFLANG_MAP = {
  en: "en",
  ar: "ar",
  uk: "uk-UA",
  ru: "ru",
  sq: "sq-AL",
};

export const OG_LOCALE_MAP = {
  en: "en_US",
  ar: "ar_SA",
  uk: "uk_UA",
  ru: "ru_RU",
  sq: "sq_AL",
};

export const SITE_ORIGIN = "https://kmcheck.com";

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function stripBasePath(pathname, basePath = "") {
  const base = basePath.replace(/\/$/, "");
  if (!base) return pathname;
  if (pathname === base) return "/";
  if (pathname.startsWith(`${base}/`)) return pathname.slice(base.length) || "/";
  return pathname;
}

/** Resolve SEO for a URL pathname like /sq/pricing */
export function resolveSeoForPath(pathname, basePath = "") {
  const path = stripBasePath(pathname.split("?")[0], basePath);
  const m = path.match(/^\/(en|ar|uk|ru|sq)(\/.*)?$/);
  const lang = m?.[1] ?? "en";
  const rest = (m?.[2] ?? "").replace(/\/$/, "") || "";
  const vinSeo = isIndexableVinRest(rest) ? vinSeoFromRest(rest, lang) : null;
  const pageKey = resolvePageKey(rest);
  const page = seoData[pageKey] ?? seoData.not_found ?? seoData.home;
  const seo = vinSeo ?? (page[lang] ?? page.en ?? seoData.home.en);
  const noIndex = isNoIndexPath(rest, pageKey);
  const canonicalPath = rest ? `/${lang}${rest}` : `/${lang}`;
  const dir = lang === "ar" ? "rtl" : "ltr";

  return {
    lang,
    dir,
    title: seo.title,
    description: seo.description,
    pageKey,
    rest,
    noIndex,
    canonicalPath,
    canonicalUrl: `${SITE_ORIGIN}${canonicalPath}`,
  };
}

function removeGeneratedSeoTags(html) {
  return html
    .replace(/\n?\s*<meta name="description"[^>]*>/g, "")
    .replace(/\n?\s*<meta name="robots"[^>]*>/g, "")
    .replace(/\n?\s*<meta property="og:[^"]+"[^>]*>/g, "")
    .replace(/\n?\s*<meta name="twitter:[^"]+"[^>]*>/g, "")
    .replace(/\n?\s*<link rel="canonical"[^>]*>/g, "")
    .replace(/\n?\s*<link rel="alternate" hreflang="[^"]+"[^>]*>/g, "")
    .replace(/\n?\s*<meta property="og:locale:alternate"[^>]*>/g, "");
}

function buildSeoHeadBlock(resolved) {
  const { lang, title, description, noIndex, canonicalUrl, rest } = resolved;
  const lines = [
    `<meta name="description" content="${escapeHtml(description)}" />`,
    `<meta name="robots" content="${noIndex ? "noindex, nofollow" : "index, follow"}" />`,
    `<link rel="canonical" href="${escapeHtml(canonicalUrl)}" />`,
    `<meta property="og:title" content="${escapeHtml(title)}" />`,
    `<meta property="og:description" content="${escapeHtml(description)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:url" content="${escapeHtml(canonicalUrl)}" />`,
    `<meta property="og:locale" content="${OG_LOCALE_MAP[lang]}" />`,
    `<meta property="og:site_name" content="kmcheck.com" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeHtml(title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(description)}" />`,
  ];

  if (!noIndex) {
    for (const l of SEO_LANGS) {
      const href = rest ? `${SITE_ORIGIN}/${l}${rest}` : `${SITE_ORIGIN}/${l}`;
      lines.push(
        `<link rel="alternate" hreflang="${HREFLANG_MAP[l]}" href="${escapeHtml(href)}" />`,
      );
    }
    lines.push(
      `<link rel="alternate" hreflang="x-default" href="${escapeHtml(
        rest ? `${SITE_ORIGIN}/en${rest}` : `${SITE_ORIGIN}/en`,
      )}" />`,
    );
    for (const l of SEO_LANGS) {
      if (l === lang) continue;
      lines.push(
        `<meta property="og:locale:alternate" content="${OG_LOCALE_MAP[l]}" />`,
      );
    }
  }

  return `\n    ${lines.join("\n    ")}\n`;
}

/** Inject localized SEO into an HTML document string (for SSR-like prerender + Vite dev). */
export function injectSeoIntoHtml(html, pathname, basePath = "") {
  const resolved = resolveSeoForPath(pathname, basePath);
  let out = removeGeneratedSeoTags(html);

  out = out.replace(/<html([^>]*)>/i, (_match, attrs) => {
    const cleaned = String(attrs)
      .replace(/\s*lang="[^"]*"/gi, "")
      .replace(/\s*dir="[^"]*"/gi, "");
    return `<html${cleaned} lang="${resolved.lang}" dir="${resolved.dir}">`;
  });

  out = out.replace(
    /<title>[^<]*<\/title>/i,
    `<title>${escapeHtml(resolved.title)}</title>`,
  );

  const seoBlock = buildSeoHeadBlock(resolved);
  out = out.replace(/<\/title>/i, `</title>${seoBlock}`);

  return out;
}

/** Paths to prerender as static HTML (lang prefix added separately). */
export function getPrerenderPaths() {
  return Object.keys(PATH_TO_SEO_KEY);
}

export { seoData };
