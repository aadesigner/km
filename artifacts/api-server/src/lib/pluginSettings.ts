export const PLUGIN_LANGS = ["en", "es", "uk", "ru", "ro", "ar", "sq"] as const;
export type PluginLanguage = (typeof PLUGIN_LANGS)[number];

/** Never geo-redirect these ISO codes — even if added to a rule by mistake. */
export const GEO_REDIRECT_BLOCKLIST = ["IL"] as const;

export type GeoLanguageRule = {
  countries: string[];
  language: PluginLanguage;
};

export type GeoLanguageRedirectPlugin = {
  enabled: boolean;
  /** When true, a manual language switch is stored and overrides geo redirect. */
  rememberUserChoice: boolean;
  rules: GeoLanguageRule[];
};

export type PluginSettings = {
  geoLanguageRedirect: GeoLanguageRedirectPlugin;
};

/** Pre-configured country → language rules (first match wins). */
export const DEFAULT_GEO_LANGUAGE_RULES: GeoLanguageRule[] = [
  { countries: ["AL", "XK", "MK", "ME"], language: "sq" },
  {
    countries: [
      "ES", "MX", "AR", "CO", "PE", "CL", "VE", "EC", "GT", "BO", "DO", "HN", "PY", "SV", "NI", "CR", "PA", "UY",
    ],
    language: "es",
  },
  { countries: ["UA"], language: "uk" },
  { countries: ["RO", "MD"], language: "ro" },
  {
    countries: [
      "SA", "AE", "EG", "IQ", "JO", "LB", "KW", "QA", "BH", "OM",
      "MA", "DZ", "TN", "LY", "YE", "PS", "SY", "SD", "MR", "DJ", "SO", "KM",
    ],
    language: "ar",
  },
  { countries: ["RU", "BY", "KZ", "KG"], language: "ru" },
];

export const DEFAULT_PLUGIN_SETTINGS: PluginSettings = {
  geoLanguageRedirect: {
    enabled: true,
    rememberUserChoice: true,
    rules: DEFAULT_GEO_LANGUAGE_RULES,
  },
};

const LANG_SET = new Set<string>(PLUGIN_LANGS);
const COUNTRY_RE = /^[A-Z]{2}$/;
const BLOCKLIST = new Set<string>(GEO_REDIRECT_BLOCKLIST);

function isBlocklistedCountry(code: string): boolean {
  return BLOCKLIST.has(code);
}

function normalizeCountry(code: unknown): string | null {
  if (typeof code !== "string") return null;
  const upper = code.trim().toUpperCase();
  if (!COUNTRY_RE.test(upper)) return null;
  return upper;
}

function normalizeLanguage(value: unknown): PluginLanguage | null {
  if (typeof value !== "string") return null;
  const lower = value.trim().toLowerCase();
  return LANG_SET.has(lower) ? (lower as PluginLanguage) : null;
}

export function normalizeGeoLanguageRules(input: unknown): GeoLanguageRule[] {
  if (!Array.isArray(input)) return [];
  const out: GeoLanguageRule[] = [];
  for (const row of input) {
    if (!row || typeof row !== "object" || Array.isArray(row)) continue;
    const language = normalizeLanguage((row as { language?: unknown }).language);
    if (!language) continue;
    const rawCountries = (row as { countries?: unknown }).countries;
    const countries: string[] = [];
    if (Array.isArray(rawCountries)) {
      for (const c of rawCountries) {
        const norm = normalizeCountry(c);
        if (norm && !countries.includes(norm) && !isBlocklistedCountry(norm)) countries.push(norm);
      }
    }
    if (countries.length === 0) continue;
    out.push({ countries, language });
  }
  return out;
}

export function normalizePluginSettings(input: unknown): PluginSettings {
  const base = { ...DEFAULT_PLUGIN_SETTINGS };
  if (!input || typeof input !== "object" || Array.isArray(input)) return base;
  const obj = input as Record<string, unknown>;
  const geo = obj.geoLanguageRedirect;
  if (!geo || typeof geo !== "object" || Array.isArray(geo)) return base;
  const g = geo as Record<string, unknown>;
  const rules = normalizeGeoLanguageRules(g.rules);
  return {
    geoLanguageRedirect: {
      enabled: g.enabled !== false,
      rememberUserChoice: g.rememberUserChoice !== false,
      rules: rules.length > 0 ? rules : DEFAULT_PLUGIN_SETTINGS.geoLanguageRedirect.rules,
    },
  };
}

export function resolveLanguageForCountry(
  countryCode: string | null,
  settings: PluginSettings,
): PluginLanguage | null {
  if (!countryCode || !settings.geoLanguageRedirect.enabled) return null;
  const upper = countryCode.toUpperCase();
  if (isBlocklistedCountry(upper)) return null;
  for (const rule of settings.geoLanguageRedirect.rules) {
    if (rule.countries.includes(upper)) return rule.language;
  }
  return null;
}
