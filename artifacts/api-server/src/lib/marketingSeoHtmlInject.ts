import type { MarketingSsrData } from "@workspace/marketing-page-seo";
import {
  injectMarketingSsrIntoHtml,
  resolveMarketingSsrContent,
} from "@workspace/marketing-page-seo";
import marketingSsrData from "@workspace/marketing-page-seo/marketing-ssr-data.json" with { type: "json" };

const data = marketingSsrData as MarketingSsrData;

const LANG_PATH_ALT = "en|de|es|fr|sq|pl|ro|bg|ka|ar|uk|ru|zh";
const LANG_PATH_RE = new RegExp(`^/(${LANG_PATH_ALT})(/.*)?$`);

const PATH_TO_PAGE_KEY: Record<string, string> = {
  "": "home",
  "/pricing": "pricing",
  "/free-vin-decoder": "free_decoder",
  "/how-it-works": "how_it_works",
  "/faq": "faq",
  "/cars/usa": "country_usa",
  "/cars/korea": "country_korea",
  "/cars/canada": "country_canada",
  "/cars/china": "country_china",
  "/cars/uae": "country_uae",
};

const VALID_COUNTRY_SLUGS = new Set(["usa", "korea", "canada", "china", "uae"]);

function resolvePageKey(rest: string): string | null {
  const exact = PATH_TO_PAGE_KEY[rest];
  if (exact) return exact;
  if (rest === "/api-b2b" || rest.startsWith("/api-b2b/")) return "api_b2b";
  if (rest.startsWith("/cars/")) {
    const slug = rest.split("/").filter(Boolean)[1]?.toLowerCase();
    if (slug && VALID_COUNTRY_SLUGS.has(slug)) {
      if (slug === "korea") return "country_korea";
      if (slug === "canada") return "country_canada";
      if (slug === "china") return "country_china";
      if (slug === "uae") return "country_uae";
      return "country_usa";
    }
    return null;
  }
  return null;
}

function parseMarketingPath(reqPath: string): { pageKey: string; rest: string; lang: string } | null {
  const path = reqPath.replace(/\/$/, "") || "/";
  const m = path.match(LANG_PATH_RE);
  if (!m) return null;
  const lang = m[1] ?? "en";
  const rest = (m[2] ?? "").replace(/\/$/, "") || "";
  const pageKey = resolvePageKey(rest);
  if (!pageKey) return null;
  return { pageKey, rest, lang };
}

/** Inject marketing H1/hero SSR body for indexable routes (fallback when prerender shell missing). */
export function injectMarketingPageSsrIntoHtml(
  html: string,
  pageKey: string,
  rest: string,
  lang: string,
): string {
  const content = resolveMarketingSsrContent(data, pageKey, rest, lang);
  if (!content) return html;
  return injectMarketingSsrIntoHtml(html, content);
}

export function injectMarketingPageSsrFromPath(html: string, reqPath: string): string {
  const parsed = parseMarketingPath(reqPath);
  if (!parsed) return html;
  return injectMarketingPageSsrIntoHtml(html, parsed.pageKey, parsed.rest, parsed.lang);
}
