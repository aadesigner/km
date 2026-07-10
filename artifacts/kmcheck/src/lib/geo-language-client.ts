import type { Language } from "@/i18n/context";
import { getStoredLangPreference } from "@/lib/lang-preference";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

const GEO_HINT_CACHE_KEY = "kmcheck_geo_hint_v1";
const GEO_HINT_TTL_MS = 5 * 60 * 1000;

export type GeoLanguageResponse = {
  enabled: boolean;
  suggestedLanguage: Language | null;
  countryCode: string | null;
  crawler?: boolean;
};

type CachedGeoHint = { at: number; data: GeoLanguageResponse };

function readCachedGeoHint(): GeoLanguageResponse | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(GEO_HINT_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedGeoHint;
    if (Date.now() - parsed.at > GEO_HINT_TTL_MS) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

function writeCachedGeoHint(data: GeoLanguageResponse): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(
      GEO_HINT_CACHE_KEY,
      JSON.stringify({ at: Date.now(), data } satisfies CachedGeoHint),
    );
  } catch {
    // quota / private mode
  }
}

export function geoLanguageApiUrl(): string {
  const params = new URLSearchParams();
  if (import.meta.env.DEV && typeof window !== "undefined") {
    const fromUrl = new URLSearchParams(window.location.search).get("geo_country");
    if (fromUrl) params.set("debug_country", fromUrl.trim().toUpperCase());
  }
  const qs = params.toString();
  return `${basePath}/api/plugins/geo-language${qs ? `?${qs}` : ""}`;
}

export async function fetchGeoLanguageHint(): Promise<GeoLanguageResponse | null> {
  const cached = readCachedGeoHint();
  if (cached) return cached;

  try {
    const r = await fetch(geoLanguageApiUrl(), {
      credentials: "include",
      headers: { Accept: "application/json" },
    });
    if (!r.ok) return null;
    const data = (await r.json()) as GeoLanguageResponse;
    if (!data.crawler) writeCachedGeoHint(data);
    return data;
  } catch {
    return null;
  }
}

/** First visit to `/` — stored preference, then geo hint, then English. */
export async function resolveRootEntryLanguage(): Promise<Language> {
  const stored = getStoredLangPreference();
  if (stored) return stored;

  const data = await fetchGeoLanguageHint();
  if (!data || data.crawler || !data.enabled || !data.countryCode) return "en";
  return data.suggestedLanguage ?? "en";
}

/** Geo redirect target when already on a localized path (typically `/en`). */
export function geoRedirectTarget(
  data: GeoLanguageResponse,
  currentLang: Language,
): Language | null {
  if (data.crawler || !data.enabled || !data.countryCode) return null;
  if (!data.suggestedLanguage || data.suggestedLanguage === currentLang) return null;
  return data.suggestedLanguage;
}
