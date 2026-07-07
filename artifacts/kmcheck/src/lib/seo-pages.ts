import seoData from "./seo-data.json";
import {
  stripAppBasePath,
  SITE_ORIGIN,
  type SeoLang,
} from "./seo-config";
import { isIndexableVinRest, buildVinPageSeo, normalizeVin, type VinSeoLang } from "@workspace/vin-page-seo";
import { resolveFavicons } from "./country-favicons";
import { resolvePageOgImage } from "./seo-og-images";

export type SeoPageKey = keyof typeof seoData;

export const SEO_DATA = seoData as {
  [K in SeoPageKey]: Record<SeoLang, { title: string; description: string }>;
};

const VALID_COUNTRY_SLUGS = new Set(["usa", "korea", "canada"]);

/** Map URL path (without lang prefix) → SEO_DATA key */
export const PATH_TO_SEO_KEY: Record<string, SeoPageKey> = {
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
  "/dashboard/account": "dashboard",
  "/dashboard/help": "dashboard",
  "/checkout": "checkout",
  "/purchases": "purchases",
  "/vin/processing": "vin_result",
  "/forgot-password": "forgot_password",
  "/reset-password": "reset_password",
};

const NOINDEX_PREFIXES = [
  "/adminx",
  "/sign-in",
  "/sign-up",
  "/dashboard",
  "/checkout",
  "/purchases",
  "/vin/",
  "/forgot-password",
  "/reset-password",
];

export function resolvePageKey(rest: string): SeoPageKey {
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

export function isNoIndexPath(rest: string, pageKey: SeoPageKey): boolean {
  if (pageKey === "not_found") return true;
  if (isIndexableVinRest(rest)) return false;
  return (
    NOINDEX_PREFIXES.some((p) => rest === p.slice(1) || rest.startsWith(p.slice(1))) ||
    (rest.startsWith("/vin/") && !isIndexableVinRest(rest))
  );
}

export function resolveSeoFromPath(
  pathname: string,
  basePath = "",
): {
  lang: SeoLang;
  rest: string;
  pageKey: SeoPageKey;
  noIndex: boolean;
} {
  const normalized = stripAppBasePath(pathname.split("?")[0], basePath);
  const m = normalized.match(/^\/(en|es|uk|ru|ro|ar|sq)(\/.*)?$/);
  const lang = (m?.[1] ?? "en") as SeoLang;
  const rest = (m?.[2] ?? "").replace(/\/$/, "") || "";
  const pageKey = resolvePageKey(rest);
  const noIndex = isNoIndexPath(rest, pageKey);
  return { lang, rest, pageKey, noIndex };
}

export function getSeoEntry(lang: SeoLang, pageKey: SeoPageKey) {
  const page = SEO_DATA[pageKey] ?? SEO_DATA.not_found;
  return page[lang] ?? page.en;
}

export function buildCanonicalPath(lang: SeoLang, rest: string): string {
  return rest ? `/${lang}${rest}` : `/${lang}`;
}

export function getRouteSeo(
  pathname: string,
  basePath = "",
  pageKeyOverride?: SeoPageKey,
) {
  const resolved = resolveSeoFromPath(pathname, basePath);
  const pageKey = pageKeyOverride ?? resolved.pageKey;

  if (isIndexableVinRest(resolved.rest)) {
    const vin = normalizeVin(resolved.rest.replace(/^\/vin\//, ""));
    const lang = resolved.lang as VinSeoLang;
    const seo = buildVinPageSeo(lang, { vin }, SITE_ORIGIN);
    return {
      title: seo.title,
      description: seo.description,
      lang: resolved.lang,
      canonicalPath: seo.canonicalPath,
      noIndex: false,
      jsonLd: seo.jsonLd,
      ogImage: seo.ogImage,
      favicons: resolveFavicons(undefined, basePath),
    };
  }

  const seo = getSeoEntry(resolved.lang, pageKey);
  const ogImage = resolvePageOgImage(pageKey, resolved.lang, basePath);
  return {
    ...seo,
    lang: resolved.lang,
    canonicalPath: buildCanonicalPath(resolved.lang, resolved.rest),
    noIndex: resolved.noIndex || pageKey === "not_found",
    favicons: resolveFavicons(pageKey, basePath),
    ogImage,
    ogImageAlt: seo.title,
  };
}
