import type { Language } from "@/i18n/context";
import { getStoredLangPreference } from "@/lib/lang-preference";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export type GeoLanguageResponse = {
  enabled: boolean;
  suggestedLanguage: Language | null;
  countryCode: string | null;
  crawler?: boolean;
};

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
  try {
    const r = await fetch(geoLanguageApiUrl(), {
      credentials: "include",
      headers: { Accept: "application/json" },
    });
    if (!r.ok) return null;
    return (await r.json()) as GeoLanguageResponse;
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
