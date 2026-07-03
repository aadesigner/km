/** Shared OG screenshot targets — used by capture script and SEO inject. */

export const SEO_OG_LANGS = ["en", "ar", "uk", "ru", "sq"];

/** pageKey → URL path without lang prefix */
export const SEO_OG_PAGES = [
  { pageKey: "home", rest: "" },
  { pageKey: "country_usa", rest: "/cars/usa" },
  { pageKey: "country_korea", rest: "/cars/korea" },
  { pageKey: "country_canada", rest: "/cars/canada" },
];

export const SEO_OG_WIDTH = 1200;
export const SEO_OG_HEIGHT = 630;

export function seoOgImageRelPath(pageKey, lang) {
  return `/seo/og/${pageKey}-${lang}.webp`;
}

export function seoOgImagePath(pageKey, lang, basePath = "") {
  const base = String(basePath).replace(/\/$/, "");
  return `${base}${seoOgImageRelPath(pageKey, lang)}`;
}

export function isSeoOgPageKey(pageKey) {
  return SEO_OG_PAGES.some((p) => p.pageKey === pageKey);
}
