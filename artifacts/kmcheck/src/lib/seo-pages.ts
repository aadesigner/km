import seoData from "./seo-data.json";
import b2bSeoData from "./b2b-seo-data.json";
import {
  stripAppBasePath,
  SITE_ORIGIN,
  HREFLANG_MAP,
  LANG_PATH_ALT,
  type SeoLang,
} from "./seo-config";
import { isIndexableVinRest, buildVinPageSeo, normalizeVin, type VinSeoLang } from "@workspace/vin-page-seo";
import { resolveFavicons } from "./country-favicons";
import { resolvePageOgImage } from "./seo-og-images";
// @ts-expect-error ESM build script — no generated .d.ts
import { buildCountryPageJsonLd } from "../../scripts/country-page-json-ld.mjs";

export type SeoPageKey = keyof typeof seoData;

export const SEO_DATA = seoData as {
  [K in SeoPageKey]: Record<SeoLang, { title: string; description: string }>;
};

const VALID_COUNTRY_SLUGS = new Set(["usa", "korea", "canada", "china", "japan", "uae"]);

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
  "/cars/china": "country_china",
  "/cars/japan": "country_japan",
  "/cars/uae": "country_uae",
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

export function resolvePageKey(rest: string): SeoPageKey {
  const exact = PATH_TO_SEO_KEY[rest];
  if (exact) return exact;

  // Indexable B2B marketing — titles come from resolveApiB2bSeo (not SEO_DATA keys).
  if (rest === "/api-b2b" || rest.startsWith("/api-b2b/")) {
    return "home";
  }

  if (rest.startsWith("/cars/")) {
    const slug = rest.split("/").filter(Boolean)[1]?.toLowerCase();
    if (slug && VALID_COUNTRY_SLUGS.has(slug)) {
      if (slug === "korea") return "country_korea";
      if (slug === "canada") return "country_canada";
      if (slug === "china") return "country_china";
      if (slug === "japan") return "country_japan";
      if (slug === "uae") return "country_uae";
      return "country_usa";
    }
    return "not_found";
  }

  if (rest.startsWith("/vin/")) return "vin_result";

  return "not_found";
}

function resolveApiB2bSeo(lang: SeoLang, rest: string): {
  title: string;
  description: string;
} | null {
  if (rest !== "/api-b2b" && !rest.startsWith("/api-b2b/")) return null;
  const pages = b2bSeoData as Record<string, Partial<Record<SeoLang, { title: string; description: string }>>>;
  const pathKey = rest || "/api-b2b";
  const page = pages[pathKey] ?? pages["/api-b2b"];
  if (!page) return null;
  const entry = page[lang] ?? page.en;
  if (!entry?.title || !entry?.description) return null;
  return { title: entry.title, description: entry.description };
}

const NOINDEX_PREFIXES = [
  "/adminx",
  "/sign-in",
  "/sign-up",
  "/dashboard",
  "/checkout",
  "/purchases",
  "/forgot-password",
  "/reset-password",
  "/set-password",
  "/terms",
  "/privacy",
];

export function isNoIndexPath(rest: string, pageKey: SeoPageKey): boolean {
  if (pageKey === "not_found") return true;
  // Secondary B2B URLs stay crawlable but out of the index (avoid cannibalizing consumer pages).
  if (rest.startsWith("/api-b2b/")) return true;
  if (isIndexableVinRest(rest)) return false;
  if (NOINDEX_PREFIXES.some((p) => rest === p || rest.startsWith(`${p}/`))) return true;
  if (rest === "/vin/processing" || rest.startsWith("/vin/processing/")) return true;
  return rest.startsWith("/vin/");
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
  const m = normalized.match(new RegExp(`^/(${LANG_PATH_ALT})(/.*)?$`));
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
      ogImageAlt: seo.title,
      favicons: resolveFavicons(undefined, basePath),
    };
  }

  const apiB2b = resolveApiB2bSeo(resolved.lang, resolved.rest);
  const seo = apiB2b
    ? { title: apiB2b.title, description: apiB2b.description }
    : getSeoEntry(resolved.lang, pageKey);
  const ogImage = resolvePageOgImage(apiB2b ? "home" : pageKey, resolved.lang, basePath);
  const canonicalPath = buildCanonicalPath(resolved.lang, resolved.rest);
  const canonicalUrl = `${SITE_ORIGIN}${canonicalPath}`;
  const absoluteOgImage = ogImage
    ? (ogImage.startsWith("http") ? ogImage : `${SITE_ORIGIN}${ogImage}`)
    : undefined;

  const countryJsonLd =
    !apiB2b && (pageKey === "country_usa" || pageKey === "country_korea" || pageKey === "country_canada"
      || pageKey === "country_china" || pageKey === "country_japan" || pageKey === "country_uae")
      ? buildCountryPageJsonLd({
          pageKey,
          title: seo.title,
          description: seo.description,
          canonicalUrl,
          lang: HREFLANG_MAP[resolved.lang],
          ogImage: absoluteOgImage,
        })
      : undefined;

  const apiB2bJsonLd = apiB2b && resolved.rest === "/api-b2b"
    ? [
        {
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: apiB2b.title,
          description: apiB2b.description,
          url: canonicalUrl,
          inLanguage: HREFLANG_MAP[resolved.lang],
          isPartOf: { "@type": "WebSite", name: "kmcheck API", url: `${SITE_ORIGIN}/${resolved.lang}/api-b2b` },
        },
        {
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "kmcheck",
          url: SITE_ORIGIN,
          logo: `${SITE_ORIGIN}/brand/logo-dark.png`,
          contactPoint: {
            "@type": "ContactPoint",
            contactType: "sales",
            email: "info@kmcheck.com",
            availableLanguage: ["en", "de", "es", "fr", "sq", "pl", "ro", "bg", "ka", "ar", "uk", "ru", "zh"],
          },
        },
      ]
    : undefined;

  return {
    ...seo,
    lang: resolved.lang,
    canonicalPath,
    noIndex: apiB2b
      ? resolved.rest.startsWith("/api-b2b/")
      : (resolved.noIndex || pageKey === "not_found"),
    favicons: resolveFavicons(pageKey, basePath),
    ogImage,
    ogImageAlt: seo.title,
    jsonLd: apiB2bJsonLd ?? countryJsonLd,
  };
}
