/** Shared VIN report page SEO — titles, descriptions, JSON-LD, URL parsing. */

export const VIN_RE = /^[A-HJ-NPR-Z0-9]{17}$/i;

export const VIN_SEO_LANGS = ["en", "de", "es", "fr", "sq", "pl", "ro", "bg", "ka", "ar", "uk", "ru"] as const;
export type VinSeoLang = (typeof VIN_SEO_LANGS)[number];

export type VinSeoVehicle = {
  vin: string;
  make?: string | null;
  model?: string | null;
  year?: number | null;
  trim?: string | null;
  engine?: string | null;
  transmission?: string | null;
  color?: string | null;
  country?: string | null;
  bodyType?: string | null;
  fuelType?: string | null;
  thumbnailUrl?: string | null;
};

export function normalizeVin(vin: string): string {
  return String(vin ?? "").trim().toUpperCase();
}

export function isValidVin(vin: string): boolean {
  return VIN_RE.test(normalizeVin(vin));
}

/** Path after lang prefix, e.g. `/vin/WBA…` or `/vin/processing`. */
export function isIndexableVinRest(rest: string): boolean {
  const m = rest.match(/^\/vin\/([^/]+)$/);
  if (!m) return false;
  const segment = m[1]!.toLowerCase();
  if (segment === "processing") return false;
  return isValidVin(segment);
}

export function parseVinPagePath(pathname: string): { lang: VinSeoLang; vin: string; rest: string } | null {
  const path = pathname.split("?")[0]!.replace(/\/$/, "") || "/";
  const m = path.match(/^\/(en|de|es|fr|sq|pl|ro|bg|ka|ar|uk|ru)(\/vin\/([A-HJ-NPR-Z0-9]{17}))$/i);
  if (!m?.[3]) return null;
  const vin = normalizeVin(m[3]);
  if (!isValidVin(vin)) return null;
  return { lang: m[1] as VinSeoLang, vin, rest: `/vin/${vin}` };
}

export function buildVehicleTitle(v: VinSeoVehicle): string {
  const vin = normalizeVin(v.vin);
  if (v.make) {
    return [v.year ? String(v.year) : null, v.make, v.model ?? null].filter(Boolean).join(" ");
  }
  return `VIN ${vin}`;
}

export function vehicleHasIdentity(v: VinSeoVehicle): boolean {
  return !!v.make;
}

function specSnippet(v: VinSeoVehicle): string {
  const parts: string[] = [];
  if (v.trim) parts.push(v.trim);
  if (v.engine) parts.push(v.engine);
  if (v.transmission) parts.push(v.transmission);
  if (v.bodyType) parts.push(v.bodyType);
  if (v.fuelType) parts.push(v.fuelType);
  if (v.color) parts.push(v.color);
  return parts.slice(0, 3).join(" · ");
}

type TitleFn = (vehicle: string, vin: string) => string;
type DescFn = (vehicle: string, vin: string, specs: string) => string;

const TITLES: Record<VinSeoLang, TitleFn> = {
  en: (vehicle, vin) => `${vehicle} — (${vin})`,
  de: (vehicle, vin) => `${vehicle} — (${vin})`,
  es: (vehicle, vin) => `${vehicle} — (${vin})`,
  fr: (vehicle, vin) => `${vehicle} — (${vin})`,
  ar: (vehicle, vin) => `${vehicle} — (${vin})`,
  uk: (vehicle, vin) => `${vehicle} — (${vin})`,
  ru: (vehicle, vin) => `${vehicle} — (${vin})`,
  ro: (vehicle, vin) => `${vehicle} — (${vin})`,
  pl: (vehicle, vin) => `${vehicle} — (${vin})`,
  ka: (vehicle, vin) => `${vehicle} — (${vin})`,
  bg: (vehicle, vin) => `${vehicle} — (${vin})`,
  sq: (vehicle, vin) => `${vehicle} — (${vin})`,
};

const VIN_ONLY_TITLES: Record<VinSeoLang, (vin: string) => string> = {
  en: (vin) => `VIN ${vin} — Vehicle History Report | kmcheck`,
  de: (vin) => `VIN ${vin} — Fahrzeughistorienbericht | kmcheck`,
  es: (vin) => `VIN ${vin} — Informe historial del vehículo | kmcheck`,
  fr: (vin) => `VIN ${vin} — Rapport historique véhicule | kmcheck`,
  ar: (vin) => `VIN ${vin} — تقرير تاريخ المركبة | kmcheck`,
  uk: (vin) => `VIN ${vin} — звіт історії авто | kmcheck`,
  ru: (vin) => `VIN ${vin} — отчёт по истории авто | kmcheck`,
  ro: (vin) => `VIN ${vin} — raport istoric vehicul | kmcheck`,
  pl: (vin) => `VIN ${vin} — raport historii pojazdu | kmcheck`,
  ka: (vin) => `VIN ${vin} — \u10D0\u10D5\u10E2\u10DD\u10DB\u10DD\u10D1\u10D8\u10DA\u10D8\u10E1 \u10D8\u10E1\u10E2\u10DD\u10E0\u10D8\u10D8\u10E1 \u10D0\u10DC\u10D2\u10D0\u10E0\u10D8\u10E8\u10D8 | kmcheck`,
  bg: (vin) => `VIN ${vin} — отчет за история на автомобил | kmcheck`,
  sq: (vin) => `VIN ${vin} — raport historiku automjeti | kmcheck`,
};

const DESCRIPTIONS: Record<VinSeoLang, DescFn> = {
  en: (vehicle, vin, specs) => {
    const specsPart = specs ? ` ${specs}.` : "";
    return `Check ${vehicle} (VIN ${vin}): mileage, accidents, ownership history, insurance & auction records.${specsPart} Instant full report on kmcheck.com.`;
  },
  de: (vehicle, vin, specs) => {
    const specsPart = specs ? ` ${specs}.` : "";
    return `Prüfen Sie ${vehicle} (VIN ${vin}): Kilometerstand, Unfälle, Halterhistorie, Versicherung und Auktionen.${specsPart} Sofortiger Vollbericht auf kmcheck.com.`;
  },
  es: (vehicle, vin, specs) => {
    const specsPart = specs ? ` ${specs}.` : "";
    return `Verifique ${vehicle} (VIN ${vin}): kilometraje, accidentes, historial de propietarios, seguro y subastas.${specsPart} Informe completo al instante en kmcheck.com.`;
  },
  fr: (vehicle, vin, specs) => {
    const specsPart = specs ? ` ${specs}.` : "";
    return `Vérifiez ${vehicle} (VIN ${vin}) : kilométrage, accidents, historique des propriétaires, assurance et enchères.${specsPart} Rapport complet instantané sur kmcheck.com.`;
  },
  ar: (vehicle, vin, specs) => {
    const specsPart = specs ? ` ${specs}.` : "";
    return `تحقق من ${vehicle} (VIN ${vin}): الكيلومترات، الحوادث، سجل الملكية، التأمين ومزادات البيع.${specsPart} تقرير فوري على kmcheck.com.`;
  },
  uk: (vehicle, vin, specs) => {
    const specsPart = specs ? ` ${specs}.` : "";
    return `Перевірте ${vehicle} (VIN ${vin}): пробіг, ДТП, історія власників, страхування та аукціони.${specsPart} Миттєвий звіт на kmcheck.com.`;
  },
  ru: (vehicle, vin, specs) => {
    const specsPart = specs ? ` ${specs}.` : "";
    return `Проверьте ${vehicle} (VIN ${vin}): пробег, ДТП, история владельцев, страхование и аукционы.${specsPart} Мгновенный отчёт на kmcheck.com.`;
  },
  ro: (vehicle, vin, specs) => {
    const specsPart = specs ? ` ${specs}.` : "";
    return `Verificați ${vehicle} (VIN ${vin}): kilometraj, accidente, istoric proprietari, asigurare și licitații.${specsPart} Raport complet instant pe kmcheck.com.`;
  },
  pl: (vehicle, vin, specs) => {
    const specsPart = specs ? ` ${specs}.` : "";
    return `Sprawdź ${vehicle} (VIN ${vin}): przebieg, wypadki, historia właścicieli, ubezpieczenie i aukcje.${specsPart} Pełny raport natychmiast na kmcheck.com.`;
  },
  ka: (vehicle, vin, specs) => {
    const specsPart = specs ? ` ${specs}.` : "";
    return `\u10E8\u10D4\u10D0\u10DB\u10DD\u10EC\u10DB\u10D4\u10D7 ${vehicle} (VIN ${vin}): \u10D2\u10D0\u10E0\u10D1\u10D4\u10DC\u10D8, \u10D0\u10D5\u10D0\u10E0\u10D8\u10D4\u10D1\u10D8, \u10DB\u10E4\u10DA\u10DD\u10D1\u10D4\u10DA\u10D7\u10D0 \u10D8\u10E1\u10E2\u10DD\u10E0\u10D8\u10D0, \u10D3\u10D0\u10D6\u10E6\u10D5\u10D4\u10D5\u10D0 \u10D3\u10D0 \u10D0\u10E3\u10E5\u10EA\u10D8\u10DD\u10DC\u10D4\u10D1\u10D8.${specsPart} \u10E1\u10E0\u10E3\u10DA\u10D8 \u10D0\u10DC\u10D2\u10D0\u10E0\u10D8\u10E8\u10D8 \u10DB\u10D0\u10E8\u10D8\u10DC\u10D5\u10D4 kmcheck.com-\u10D6\u10D4.`;
  },
  bg: (vehicle, vin, specs) => {
    const specsPart = specs ? ` ${specs}.` : "";
    return `Проверете ${vehicle} (VIN ${vin}): пробег, катастрофи, история на собственици, застраховка и търгове.${specsPart} Пълен отчет мигновено на kmcheck.com.`;
  },
  sq: (vehicle, vin, specs) => {
    const specsPart = specs ? ` ${specs}.` : "";
    return `Kontrollo ${vehicle} (VIN ${vin}): kilometrat, aksidentet, historinë e pronarëve, sigurimin dhe ankandet.${specsPart} Raport i menjëhershëm në kmcheck.com.`;
  },
};

const VIN_ONLY_DESCRIPTIONS: Record<VinSeoLang, (vin: string) => string> = {
  en: (vin) => `Check VIN ${vin}: mileage, accidents, ownership history, insurance & auction records. Instant full report on kmcheck.com.`,
  de: (vin) => `VIN ${vin} prüfen: Kilometerstand, Unfälle, Halterhistorie, Versicherung und Auktionen. Sofortiger Vollbericht auf kmcheck.com.`,
  es: (vin) => `Verifique VIN ${vin}: kilometraje, accidentes, historial de propietarios, seguro y subastas. Informe completo al instante en kmcheck.com.`,
  fr: (vin) => `Vérifiez VIN ${vin} : kilométrage, accidents, historique des propriétaires, assurance et enchères. Rapport complet instantané sur kmcheck.com.`,
  ar: (vin) => `تحقق من VIN ${vin}: الكيلومترات، الحوادث، سجل الملكية، التأمين ومزادات البيع. تقرير فوري على kmcheck.com.`,
  uk: (vin) => `Перевірте VIN ${vin}: пробіг, ДТП, історія власників, страхування та аукціони. Миттєвий звіт на kmcheck.com.`,
  ru: (vin) => `Проверьте VIN ${vin}: пробег, ДТП, история владельцев, страхование и аукционы. Мгновенный отчёт на kmcheck.com.`,
  ro: (vin) => `Verificați VIN ${vin}: kilometraj, accidente, istoric proprietari, asigurare și licitații. Raport complet instant pe kmcheck.com.`,
  pl: (vin) => `Sprawdź VIN ${vin}: przebieg, wypadki, historia właścicieli, ubezpieczenie i aukcje. Pełny raport natychmiast na kmcheck.com.`,
  ka: (vin) => `\u10E8\u10D4\u10D0\u10DB\u10DD\u10EC\u10DB\u10D4\u10D7 VIN ${vin}: \u10D2\u10D0\u10E0\u10D1\u10D4\u10DC\u10D8, \u10D0\u10D5\u10D0\u10E0\u10D8\u10D4\u10D1\u10D8, \u10DB\u10E4\u10DA\u10DD\u10D1\u10D4\u10DA\u10D7\u10D0 \u10D8\u10E1\u10E2\u10DD\u10E0\u10D8\u10D0, \u10D3\u10D0\u10D6\u10E6\u10D5\u10D4\u10D5\u10D0 \u10D3\u10D0 \u10D0\u10E3\u10E5\u10EA\u10D8\u10DD\u10DC\u10D4\u10D1\u10D8. \u10E1\u10E0\u10E3\u10DA\u10D8 \u10D0\u10DC\u10D2\u10D0\u10E0\u10D8\u10E8\u10D8 \u10DB\u10D0\u10E8\u10D8\u10DC\u10D5\u10D4 kmcheck.com-\u10D6\u10D4.`,
  bg: (vin) => `Проверете VIN ${vin}: пробег, катастрофи, история на собственици, застраховка и търгове. Пълен отчет мигновено на kmcheck.com.`,
  sq: (vin) => `Kontrollo VIN ${vin}: kilometrat, aksidentet, historinë e pronarëve, sigurimin dhe ankandet. Raport i menjëhershëm në kmcheck.com.`,
};

export function buildVinOnlyPageTitle(lang: VinSeoLang, vin: string): string {
  const fn = VIN_ONLY_TITLES[lang] ?? VIN_ONLY_TITLES.en;
  return fn(normalizeVin(vin));
}

export function buildVinOnlyPageDescription(lang: VinSeoLang, vin: string): string {
  const fn = VIN_ONLY_DESCRIPTIONS[lang] ?? VIN_ONLY_DESCRIPTIONS.en;
  return fn(normalizeVin(vin));
}

export function buildVinPageTitle(lang: VinSeoLang, vehicle: VinSeoVehicle): string {
  const vin = normalizeVin(vehicle.vin);
  if (!vehicleHasIdentity(vehicle)) {
    return buildVinOnlyPageTitle(lang, vin);
  }
  const fn = TITLES[lang] ?? TITLES.en;
  return fn(buildVehicleTitle(vehicle), vin);
}

export function buildVinPageDescription(lang: VinSeoLang, vehicle: VinSeoVehicle): string {
  const vin = normalizeVin(vehicle.vin);
  if (!vehicleHasIdentity(vehicle)) {
    return buildVinOnlyPageDescription(lang, vin);
  }
  const fn = DESCRIPTIONS[lang] ?? DESCRIPTIONS.en;
  return fn(buildVehicleTitle(vehicle), vin, specSnippet(vehicle));
}

/** Resolve relative API image paths to absolute URLs for Open Graph / Twitter cards. */
export function resolveAbsoluteAssetUrl(origin: string, url: string | null | undefined): string | undefined {
  const trimmed = String(url ?? "").trim();
  if (!trimmed) return undefined;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const base = origin.replace(/\/$/, "");
  return trimmed.startsWith("/") ? `${base}${trimmed}` : `${base}/${trimmed}`;
}

export type VinPageSeo = {
  title: string;
  description: string;
  canonicalPath: string;
  /** When true, emit noindex (empty / missing report shells). Catalog reports stay indexable. */
  noIndex: boolean;
  jsonLd: Record<string, unknown>[];
  ogImage?: string;
  ogImageAlt?: string;
};

export function buildVinPageSeo(
  lang: VinSeoLang,
  vehicle: VinSeoVehicle,
  origin: string,
  opts?: { odometer?: number | null; isUnlocked?: boolean },
): VinPageSeo {
  const vin = normalizeVin(vehicle.vin);
  const vehicleTitle = buildVehicleTitle(vehicle);
  const canonicalPath = `/${lang}/vin/${vin}`;
  const siteOrigin = origin.replace(/\/$/, "");
  const pageUrl = `${siteOrigin}${canonicalPath}`;
  const absoluteImage = resolveAbsoluteAssetUrl(siteOrigin, vehicle.thumbnailUrl);

  const vehicleLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Vehicle",
    "@id": `${pageUrl}#vehicle`,
    vehicleIdentificationNumber: vin,
    name: vehicleTitle,
    url: pageUrl,
    ...(vehicle.year && { modelDate: String(vehicle.year) }),
    ...(vehicle.make && { brand: { "@type": "Brand", name: vehicle.make }, manufacturer: { "@type": "Organization", name: vehicle.make } }),
    ...(vehicle.model && { model: vehicle.model }),
    ...(vehicle.color && { color: vehicle.color }),
    ...(vehicle.bodyType && { bodyType: vehicle.bodyType }),
    ...(vehicle.fuelType && { fuelType: vehicle.fuelType }),
    ...(opts?.isUnlocked && opts.odometer != null && {
      mileageFromOdometer: {
        "@type": "QuantitativeValue",
        value: opts.odometer,
        unitCode: "KMT",
      },
    }),
    ...(absoluteImage && { image: absoluteImage }),
  };

  const webPageLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${pageUrl}#webpage`,
    url: pageUrl,
    name: buildVinPageTitle(lang, vehicle),
    description: buildVinPageDescription(lang, vehicle),
    inLanguage: lang,
    isPartOf: { "@type": "WebSite", name: "kmcheck.com", url: siteOrigin },
    about: { "@id": `${pageUrl}#vehicle` },
    primaryImageOfPage: absoluteImage ?? undefined,
  };

  return {
    title: buildVinPageTitle(lang, vehicle),
    description: buildVinPageDescription(lang, vehicle),
    canonicalPath,
    noIndex: false,
    jsonLd: [webPageLd, vehicleLd],
    ogImage: absoluteImage,
    ogImageAlt: vehicleTitle,
  };
}
