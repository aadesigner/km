/** Shared VIN report page SEO — titles, descriptions, JSON-LD, URL parsing. */

export const VIN_RE = /^[A-HJ-NPR-Z0-9]{17}$/i;

export const VIN_SEO_LANGS = ["en", "ar", "uk", "ru", "sq"] as const;
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
  const m = path.match(/^\/(en|ar|uk|ru|sq)(\/vin\/([A-HJ-NPR-Z0-9]{17}))$/i);
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

function specSnippet(v: VinSeoVehicle): string {
  const parts: string[] = [];
  if (v.trim) parts.push(v.trim);
  if (v.engine) parts.push(v.engine);
  if (v.transmission) parts.push(v.transmission);
  if (v.bodyType) parts.push(v.bodyType);
  if (v.fuelType) parts.push(v.fuelType);
  if (v.color) parts.push(v.color);
  if (v.country) parts.push(v.country);
  return parts.slice(0, 4).join(" · ");
}

type TitleFn = (vehicle: string, vin: string) => string;
type DescFn = (vehicle: string, vin: string, specs: string) => string;

const TITLES: Record<VinSeoLang, TitleFn> = {
  en: (vehicle, vin) => `${vehicle} — VIN ${vin} History Report | kmcheck`,
  ar: (vehicle, vin) => `${vehicle} — تقرير VIN ${vin} | kmcheck`,
  uk: (vehicle, vin) => `${vehicle} — звіт VIN ${vin} | kmcheck`,
  ru: (vehicle, vin) => `${vehicle} — отчёт VIN ${vin} | kmcheck`,
  sq: (vehicle, vin) => `${vehicle} — raport VIN ${vin} | kmcheck`,
};

const DESCRIPTIONS: Record<VinSeoLang, DescFn> = {
  en: (vehicle, vin, specs) => {
    const specsPart = specs ? ` ${specs}.` : "";
    return `Check mileage, accidents and vehicle history for ${vehicle} (VIN ${vin}).${specsPart} Full instant report at kmcheck.com.`;
  },
  ar: (vehicle, vin, specs) => {
    const specsPart = specs ? ` ${specs}.` : "";
    return `تحقق من الكيلومترات والحوادث والتاريخ الكامل لـ ${vehicle} (VIN ${vin}).${specsPart} تقرير فوري على kmcheck.com.`;
  },
  uk: (vehicle, vin, specs) => {
    const specsPart = specs ? ` ${specs}.` : "";
    return `Перевірте пробіг, ДТП та повну історію для ${vehicle} (VIN ${vin}).${specsPart} Миттєвий звіт на kmcheck.com.`;
  },
  ru: (vehicle, vin, specs) => {
    const specsPart = specs ? ` ${specs}.` : "";
    return `Проверьте пробег, ДТП и полную историю для ${vehicle} (VIN ${vin}).${specsPart} Мгновенный отчёт на kmcheck.com.`;
  },
  sq: (vehicle, vin, specs) => {
    const specsPart = specs ? ` ${specs}.` : "";
    return `Kontrollo kilometrat, aksidentet dhe historinë për ${vehicle} (VIN ${vin}).${specsPart} Raport i plotë në kmcheck.com.`;
  },
};

const VIN_ONLY_DESCRIPTIONS: Record<VinSeoLang, (vin: string) => string> = {
  en: (vin) => `Check mileage, accidents and vehicle history for VIN ${vin}. Full instant report at kmcheck.com.`,
  ar: (vin) => `تحقق من الكيلومترات والحوادث والتاريخ الكامل للمركبة لرقم VIN ${vin}. تقرير فوري على kmcheck.com.`,
  uk: (vin) => `Перевірте пробіг, ДТП та повну історію авто для VIN ${vin}. Миттєвий звіт на kmcheck.com.`,
  ru: (vin) => `Проверьте пробег, ДТП и полную историю авто для VIN ${vin}. Мгновенный отчёт на kmcheck.com.`,
  sq: (vin) => `Kontrollo kilometrat, aksidentet dhe historinë për VIN ${vin}. Raport i plotë në kmcheck.com.`,
};

export function buildVinOnlyPageDescription(lang: VinSeoLang, vin: string): string {
  const fn = VIN_ONLY_DESCRIPTIONS[lang] ?? VIN_ONLY_DESCRIPTIONS.en;
  return fn(normalizeVin(vin));
}

export function buildVinPageTitle(lang: VinSeoLang, vehicle: VinSeoVehicle): string {
  const vin = normalizeVin(vehicle.vin);
  const fn = TITLES[lang] ?? TITLES.en;
  return fn(buildVehicleTitle(vehicle), vin);
}

export function buildVinPageDescription(lang: VinSeoLang, vehicle: VinSeoVehicle): string {
  const vin = normalizeVin(vehicle.vin);
  const fn = DESCRIPTIONS[lang] ?? DESCRIPTIONS.en;
  return fn(buildVehicleTitle(vehicle), vin, specSnippet(vehicle));
}

export type VinPageSeo = {
  title: string;
  description: string;
  canonicalPath: string;
  noIndex: false;
  jsonLd: Record<string, unknown>[];
  ogImage?: string;
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
  const pageUrl = `${origin.replace(/\/$/, "")}${canonicalPath}`;

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
    ...(vehicle.thumbnailUrl && { image: vehicle.thumbnailUrl }),
  };

  const webPageLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${pageUrl}#webpage`,
    url: pageUrl,
    name: buildVinPageTitle(lang, vehicle),
    description: buildVinPageDescription(lang, vehicle),
    inLanguage: lang,
    isPartOf: { "@type": "WebSite", name: "kmcheck.com", url: origin },
    about: { "@id": `${pageUrl}#vehicle` },
    primaryImageOfPage: vehicle.thumbnailUrl ?? undefined,
  };

  return {
    title: buildVinPageTitle(lang, vehicle),
    description: buildVinPageDescription(lang, vehicle),
    canonicalPath,
    noIndex: false,
    jsonLd: [webPageLd, vehicleLd],
    ogImage: vehicle.thumbnailUrl ?? undefined,
  };
}
