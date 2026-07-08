/** Shared VIN report page SEO — titles, descriptions, JSON-LD, URL parsing. */

export const VIN_RE = /^[A-HJ-NPR-Z0-9]{17}$/i;

export const VIN_SEO_LANGS = ["en", "de", "es", "fr", "sq", "pl", "ro", "bg", "ar", "uk", "ru"] as const;
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
  const m = path.match(/^\/(en|de|es|fr|sq|pl|ro|bg|ar|uk|ru)(\/vin\/([A-HJ-NPR-Z0-9]{17}))$/i);
  if (!m?.[3]) return null;
  const vin = normalizeVin(m[3]);
  if (!isValidVin(vin)) return null;
  return { lang: m[1] as VinSeoLang, vin, rest: `/vin/${vin}` };
}

export function buildVehicleTitle(v: VinSeoVehicle): string {
  const vin = normalizeVin(v.vin);
  if (v.year && v.make && v.model) return `${v.year} ${v.make} ${v.model}`;
  if (v.make && v.model) return `${v.make} ${v.model}`;
  return `VIN ${vin}`;
}

export function vehicleHasIdentity(v: VinSeoVehicle): boolean {
  return !!((v.year && v.make && v.model) || (v.make && v.model));
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
  en: (vehicle, vin) => `${vehicle} — Check VIN ${vin} | kmcheck`,
  de: (vehicle, vin) => `${vehicle} — VIN ${vin} prüfen | kmcheck`,
  es: (vehicle, vin) => `${vehicle} — Comprobar VIN ${vin} | kmcheck`,
  fr: (vehicle, vin) => `${vehicle} — Vérifier VIN ${vin} | kmcheck`,
  ar: (vehicle, vin) => `${vehicle} — تحقق من VIN ${vin} | kmcheck`,
  uk: (vehicle, vin) => `${vehicle} — перевірка VIN ${vin} | kmcheck`,
  ru: (vehicle, vin) => `${vehicle} — проверка VIN ${vin} | kmcheck`,
  ro: (vehicle, vin) => `${vehicle} — verificare VIN ${vin} | kmcheck`,
  pl: (vehicle, vin) => `${vehicle} — sprawdź VIN ${vin} | kmcheck`,
  bg: (vehicle, vin) => `${vehicle} — проверка VIN ${vin} | kmcheck`,
  sq: (vehicle, vin) => `${vehicle} — kontrollo VIN ${vin} | kmcheck`,
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
  bg: (vehicle, vin, specs) => {
    const specsPart = specs ? ` ${specs}.` : "";
    return `Проверете ${vehicle} (VIN ${vin}): пробег, катастрофи, история на собственици, застраховка и търгове.${specsPart} Пълен отчет мигновено на kmcheck.com.`;
  },
  sq: (vehicle, vin, specs) => {
    const specsPart = specs ? ` ${specs}.` : "";
    return `Kontrollo ${vehicle} (VIN ${vin}): kilometrazhin, aksidentet, historinë e pronarëve, sigurimin dhe ankandet.${specsPart} Raport i menjëhershëm në kmcheck.com.`;
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
  bg: (vin) => `Проверете VIN ${vin}: пробег, катастрофи, история на собственици, застраховка и търгове. Пълен отчет мигновено на kmcheck.com.`,
  sq: (vin) => `Kontrollo VIN ${vin}: kilometrazhin, aksidentet, historinë e pronarëve, sigurimin dhe ankandet. Raport i menjëhershëm në kmcheck.com.`,
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
  noIndex: false;
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
