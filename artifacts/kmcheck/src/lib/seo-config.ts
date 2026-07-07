/** Public site origin for canonical URLs and sitemap (production). */
export const SITE_ORIGIN = "https://kmcheck.com";

export const SEO_LANGS = ["en", "es", "uk", "ru", "ro", "ar", "sq"] as const;
export type SeoLang = (typeof SEO_LANGS)[number];

/** BCP 47 hreflang values */
export const HREFLANG_MAP: Record<SeoLang, string> = {
  en: "en",
  es: "es",
  ar: "ar",
  uk: "uk-UA",
  ru: "ru",
  ro: "ro",
  sq: "sq-AL",
};

export const OG_LOCALE_MAP: Record<SeoLang, string> = {
  en: "en_US",
  es: "es_ES",
  ar: "ar_SA",
  uk: "uk_UA",
  ru: "ru_RU",
  ro: "ro_RO",
  sq: "sq_AL",
};

/** Paths indexed in sitemap (without language prefix). Home = "". */
export const INDEXABLE_PATHS = [
  "",
  "/pricing",
  "/free-vin-decoder",
  "/how-it-works",
  "/faq",
  "/terms",
  "/privacy",
  "/cars/usa",
  "/cars/korea",
  "/cars/canada",
] as const;

export function buildLocalizedPath(lang: SeoLang, path: string): string {
  if (!path || path === "/") return `/${lang}`;
  return `/${lang}${path.startsWith("/") ? path : `/${path}`}`;
}

export function stripLangPrefix(pathname: string): string {
  const stripped = pathname.replace(/^\/(en|es|uk|ru|ro|ar|sq)(\/|$)/, "/");
  return stripped === "/" ? "" : stripped.replace(/\/$/, "") || "";
}

/** Strip Vite `base` prefix so SEO parsing sees `/{lang}/…`. */
export function stripAppBasePath(pathname: string, basePath = ""): string {
  const base = basePath.replace(/\/$/, "");
  if (!base) return pathname;
  if (pathname === base) return "/";
  if (pathname.startsWith(`${base}/`)) return pathname.slice(base.length) || "/";
  return pathname;
}

export function parseLangFromPath(pathname: string, basePath = ""): SeoLang | null {
  const normalized = stripAppBasePath(pathname.split("?")[0], basePath);
  const m = normalized.match(/^\/(en|es|uk|ru|ro|ar|sq)(\/|$)/);
  return m ? (m[1] as SeoLang) : null;
}
