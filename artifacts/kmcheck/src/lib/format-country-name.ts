export type CountryLabelOverrides = {
  usa?: string;
  korea?: string;
  canada?: string;
};

const ISO_ALIASES: Record<string, string> = {
  USA: "US",
  US: "US",
  UK: "GB",
  GB: "GB",
  KR: "KR",
  KOR: "KR",
  KOREA: "KR",
  DE: "DE",
  GER: "DE",
  DEU: "DE",
  JP: "JP",
  JPN: "JP",
  FR: "FR",
  FRA: "FR",
  IT: "IT",
  ITA: "IT",
  CA: "CA",
  CAN: "CA",
  AU: "AU",
  AUS: "AU",
  CN: "CN",
  CHN: "CN",
  PL: "PL",
  POL: "PL",
  NL: "NL",
  NLD: "NL",
  ES: "ES",
  ESP: "ES",
  AE: "AE",
  ARE: "AE",
  UA: "UA",
  UKR: "UA",
  RU: "RU",
  RUS: "RU",
  MX: "MX",
  MEX: "MX",
  SE: "SE",
  SWE: "SE",
  AT: "AT",
  AUT: "AT",
  BE: "BE",
  BEL: "BE",
  HU: "HU",
  HUN: "HU",
  SK: "SK",
  SVK: "SK",
  CZ: "CZ",
  CZE: "CZ",
  IN: "IN",
  IND: "IN",
  TR: "TR",
  TUR: "TR",
  BR: "BR",
  BRA: "BR",
  ZA: "ZA",
  ZAF: "ZA",
  TW: "TW",
  TWN: "TW",
  TH: "TH",
  THA: "TH",
  NO: "NO",
  NOR: "NO",
  DK: "DK",
  DNK: "DK",
  FI: "FI",
  FIN: "FI",
  PT: "PT",
  PRT: "PT",
  GR: "GR",
  GRC: "GR",
  RO: "RO",
  ROU: "RO",
  CH: "CH",
  CHE: "CH",
  IE: "IE",
  IRL: "IE",
  NZ: "NZ",
  NZL: "NZ",
  IL: "IL",
  ISR: "IL",
  SA: "SA",
  SAU: "SA",
};

/** English / provider country names → ISO 3166-1 alpha-2 (VIN decoder, pending reports). */
const ENGLISH_NAME_TO_ISO: Record<string, string> = {
  "united states": "US",
  "united states of america": "US",
  usa: "US",
  "u.s.a.": "US",
  "u.s.": "US",
  canada: "CA",
  mexico: "MX",
  "south korea": "KR",
  "republic of korea": "KR",
  korea: "KR",
  "north korea": "KP",
  japan: "JP",
  china: "CN",
  "people's republic of china": "CN",
  germany: "DE",
  "united kingdom": "GB",
  uk: "GB",
  "great britain": "GB",
  england: "GB",
  france: "FR",
  italy: "IT",
  spain: "ES",
  sweden: "SE",
  austria: "AT",
  belgium: "BE",
  hungary: "HU",
  poland: "PL",
  slovakia: "SK",
  "czech republic": "CZ",
  czechia: "CZ",
  india: "IN",
  australia: "AU",
  netherlands: "NL",
  ukraine: "UA",
  russia: "RU",
  "russian federation": "RU",
  "united arab emirates": "AE",
  uae: "AE",
  turkey: "TR",
  türkiye: "TR",
  brazil: "BR",
  argentina: "AR",
  "south africa": "ZA",
  taiwan: "TW",
  thailand: "TH",
  vietnam: "VN",
  malaysia: "MY",
  indonesia: "ID",
  philippines: "PH",
  norway: "NO",
  denmark: "DK",
  finland: "FI",
  portugal: "PT",
  greece: "GR",
  romania: "RO",
  bulgaria: "BG",
  croatia: "HR",
  serbia: "RS",
  slovenia: "SI",
  ireland: "IE",
  switzerland: "CH",
  luxembourg: "LU",
  "new zealand": "NZ",
  israel: "IL",
  egypt: "EG",
  "saudi arabia": "SA",
};

const LOCALE_MAP: Record<string, string> = {
  sq: "sq-AL",
  en: "en-US",
  ar: "ar",
  uk: "uk-UA",
  ru: "ru-RU",
};

function normalizeCountryKey(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, " ");
}

function resolveIso2(raw: string): string | null {
  const upper = raw.trim().toUpperCase();
  if (ISO_ALIASES[upper]) return ISO_ALIASES[upper];
  if (/^[A-Z]{2}$/.test(upper)) return upper;
  return ENGLISH_NAME_TO_ISO[normalizeCountryKey(raw)] ?? null;
}

function localizedRegionName(iso2: string, lang: string): string | null {
  const locale = LOCALE_MAP[lang] ?? lang;
  try {
    const display = new Intl.DisplayNames([locale], { type: "region" });
    return display.of(iso2) ?? null;
  } catch {
    return null;
  }
}

function applyOverrides(iso2: string, overrides?: CountryLabelOverrides): string | null {
  if (iso2 === "US" && overrides?.usa) return overrides.usa;
  if (iso2 === "KR" && overrides?.korea) return overrides.korea;
  if (iso2 === "CA" && overrides?.canada) return overrides.canada;
  return null;
}

/** Expand ISO / short codes or English names to a localized country label. */
export function formatCountryName(
  raw: string | null | undefined,
  lang = "en",
  overrides?: CountryLabelOverrides,
): string {
  if (!raw?.trim()) return "";

  const trimmed = raw.trim();
  const iso2 = resolveIso2(trimmed);

  if (!iso2) return trimmed;

  const override = applyOverrides(iso2, overrides);
  if (override) return override;

  return localizedRegionName(iso2, lang) ?? trimmed;
}

/** Location line — translates trailing country segment when present (e.g. "Asan, South Korea"). */
export function formatLocationLabel(
  raw: string | null | undefined,
  lang = "en",
  overrides?: CountryLabelOverrides,
): string {
  if (!raw?.trim()) return "";

  const trimmed = raw.trim();
  const parts = trimmed.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return trimmed;

  if (parts.length === 1) {
    return formatCountryName(parts[0], lang, overrides) || parts[0];
  }

  const countryPart = parts[parts.length - 1];
  const translatedCountry = formatCountryName(countryPart, lang, overrides);
  if (translatedCountry && translatedCountry !== countryPart) {
    return [...parts.slice(0, -1), translatedCountry].join(", ");
  }

  return trimmed;
}

export function countryLabelsFromT(t: (key: string) => string): CountryLabelOverrides {
  return {
    usa: t("country_usa_name"),
    korea: t("country_korea_name"),
    canada: t("country_canada_name"),
  };
}
