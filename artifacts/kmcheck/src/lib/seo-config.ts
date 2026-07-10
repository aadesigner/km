import {
  SUPPORTED_LANGS,
  LANG_PATH_ALT,
  LANG_META,
  type Language,
} from "@/lib/languages";

/** Public site origin for canonical URLs and sitemap (production). */
export const SITE_ORIGIN = "https://kmcheck.com";
export { LANG_PATH_ALT };

export const SEO_LANGS = SUPPORTED_LANGS;
export type SeoLang = Language;

/** BCP 47 hreflang values */
export const HREFLANG_MAP: Record<SeoLang, string> = Object.fromEntries(
  SUPPORTED_LANGS.map((code) => [code, LANG_META[code].hreflang]),
) as Record<SeoLang, string>;

export const OG_LOCALE_MAP: Record<SeoLang, string> = Object.fromEntries(
  SUPPORTED_LANGS.map((code) => [code, LANG_META[code].ogLocale]),
) as Record<SeoLang, string>;

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
  "/cars/china",
  "/cars/uae",
] as const;

export function buildLocalizedPath(lang: SeoLang, path: string): string {
  if (!path || path === "/") return `/${lang}`;
  return `/${lang}${path.startsWith("/") ? path : `/${path}`}`;
}

export function stripLangPrefix(pathname: string): string {
  const stripped = pathname.replace(new RegExp(`^/(${LANG_PATH_ALT})(/|$)`), "/");
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
  const m = normalized.match(new RegExp(`^/(${LANG_PATH_ALT})(/|$)`));
  return m ? (m[1] as SeoLang) : null;
}
