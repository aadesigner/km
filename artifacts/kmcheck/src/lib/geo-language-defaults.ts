import type { GeoLanguageRuleForm } from "@/lib/plugin-config";

/** Mirrors server `DEFAULT_GEO_LANGUAGE_RULES` for admin plugin UI. */
export const DEFAULT_GEO_LANGUAGE_RULES: GeoLanguageRuleForm[] = [
  { countries: ["AL", "XK", "MK", "ME"], language: "sq" },
  { countries: ["UA"], language: "uk" },
  {
    countries: [
      "SA", "AE", "EG", "IQ", "JO", "LB", "KW", "QA", "BH", "OM",
      "MA", "DZ", "TN", "LY", "YE", "PS", "SY", "SD", "MR", "DJ", "SO", "KM",
    ],
    language: "ar",
  },
  { countries: ["RU", "BY", "KZ", "KG"], language: "ru" },
];
