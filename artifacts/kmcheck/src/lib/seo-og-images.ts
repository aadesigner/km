import type { SeoLang } from "./seo-config";
import type { SeoPageKey } from "./seo-pages";

export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;

const OG_PAGE_KEYS = new Set<SeoPageKey>([
  "home",
  "country_usa",
  "country_korea",
  "country_canada",
  "country_china",
  "country_japan",
  "country_uae",
]);

const AUTH_OG_FALLBACK_KEYS = new Set<SeoPageKey>(["sign_up", "auth"]);

export function resolvePageOgImage(
  pageKey: SeoPageKey,
  lang: SeoLang,
  basePath = "",
): string | undefined {
  const key = AUTH_OG_FALLBACK_KEYS.has(pageKey) ? "home" : pageKey;
  if (!OG_PAGE_KEYS.has(key)) return undefined;
  const base = basePath.replace(/\/$/, "");
  return `${base}/seo/og/${key}-${lang}.webp`;
}
