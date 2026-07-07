import type { Language } from "@/i18n/context";

const LANG_KEY = "kmcheck_lang";
const GEO_EVAL_KEY = "kmcheck_geo_evaluated";

export const SUPPORTED_LANGS = ["en", "es", "uk", "ru", "ro", "ar", "sq"] as const;

export function isSupportedLang(seg: string): seg is Language {
  return (SUPPORTED_LANGS as readonly string[]).includes(seg);
}

export function getStoredLangPreference(): Language | null {
  try {
    const raw = localStorage.getItem(LANG_KEY);
    if (raw === "en" || raw === "es" || raw === "ar" || raw === "uk" || raw === "ru" || raw === "ro" || raw === "sq") return raw;
  } catch { /* private browsing */ }
  return null;
}

export function setStoredLangPreference(lang: Language): void {
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch { /* private browsing */ }
}

export function clearStoredLangPreference(): void {
  try {
    localStorage.removeItem(LANG_KEY);
  } catch { /* private browsing */ }
}

export function isGeoLanguageEvaluated(): boolean {
  try {
    if (localStorage.getItem(GEO_EVAL_KEY) === "1") return true;
  } catch { /* private browsing */ }
  try {
    return sessionStorage.getItem(GEO_EVAL_KEY) === "1";
  } catch {
    return false;
  }
}

export function markGeoLanguageEvaluated(): void {
  try {
    localStorage.setItem(GEO_EVAL_KEY, "1");
  } catch { /* private browsing */ }
  try {
    sessionStorage.setItem(GEO_EVAL_KEY, "1");
  } catch { /* private browsing */ }
}

/** Paths where geo language redirect must never run (admin, auth). */
export function isGeoRedirectExemptPath(pathname: string): boolean {
  if (pathname.startsWith("/adminx")) return true;
  if (/^\/(en|es|uk|ru|ro|ar|sq)\/(sign-in|sign-up|forgot-password|reset-password|set-password)(\/|$)/.test(pathname)) {
    return true;
  }
  if (/^\/(en|es|uk|ru|ro|ar|sq)\/maintenance(\/|$)/.test(pathname)) return true;
  return false;
}

export function extractPathLang(pathname: string): Language | null {
  const m = pathname.match(/^\/(en|es|uk|ru|ro|ar|sq)(\/|$)/);
  return (m?.[1] as Language | undefined) ?? null;
}

/**
 * Paths without a language prefix (e.g. /cars/usa, /vin/…) → /en/…
 * Returns null when no redirect is needed.
 */
export function isEnglishPrefixRedirectExempt(pathname: string): boolean {
  if (pathname === "/" || pathname === "") return true;
  if (pathname.startsWith("/adminx")) return true;
  if (/^\/(usa|korea|canada)-cars\/?$/.test(pathname)) return true;
  return false;
}

export function englishPrefixRedirectTarget(pathname: string): string | null {
  const rest = pathNeedingLangPrefix(pathname);
  if (rest === null) return null;
  return buildLocalizedPath("en", rest);
}

/** Path tail that needs a language prefix (e.g. `vin/ABC`); null when already localized or exempt. */
export function pathNeedingLangPrefix(pathname: string): string | null {
  if (isEnglishPrefixRedirectExempt(pathname)) return null;
  const segments = pathname.split("/").filter(Boolean);
  const first = segments[0];
  if (!first) return null;
  if (isSupportedLang(first)) return null;

  if (/^[a-z]{2}$/i.test(first)) {
    return segments.slice(1).join("/");
  }

  return segments.join("/");
}

export function buildLocalizedPath(lang: Language, rest: string): string {
  const trimmed = rest.replace(/^\/+/, "");
  return trimmed ? `/${lang}/${trimmed}` : `/${lang}`;
}

export function replacePathLang(pathname: string, fromLang: Language, toLang: Language): string {
  return pathname.replace(new RegExp(`^/${fromLang}(/|$)`), `/${toLang}$1`);
}
