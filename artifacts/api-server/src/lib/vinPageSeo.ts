import type { VinPageSeo, VinSeoLang, VinSeoVehicle } from "@workspace/vin-page-seo";
import {
  buildVinPageSeo,
  buildVinSsrBodyContent,
  normalizeVin,
  vehicleHasIdentity,
} from "@workspace/vin-page-seo";

export function catalogDataToVinSeoVehicle(
  vin: string,
  data: Record<string, unknown>,
  thumbnailUrl?: string | null,
): VinSeoVehicle {
  return {
    vin: normalizeVin(vin),
    make: (data.make as string | null) ?? null,
    model: (data.model as string | null) ?? null,
    year: (data.year as number | null) ?? null,
    trim: (data.trim as string | null) ?? null,
    engine: (data.engine as string | null) ?? null,
    transmission: (data.transmission as string | null) ?? null,
    color: (data.color as string | null) ?? null,
    country: (data.country as string | null) ?? null,
    bodyType: (data.bodyType as string | null) ?? null,
    fuelType: (data.fuelType as string | null) ?? null,
    thumbnailUrl: thumbnailUrl ?? null,
  };
}

export function buildVinSeoFromCatalogData(
  lang: VinSeoLang,
  vin: string,
  data: Record<string, unknown>,
  opts?: {
    thumbnailUrl?: string | null;
    odometer?: number | null;
    isUnlocked?: boolean;
    origin?: string;
  },
) {
  const siteOrigin = (opts?.origin ?? process.env.SITE_URL ?? "https://kmcheck.com").replace(/\/$/, "");
  const vehicle = catalogDataToVinSeoVehicle(vin, data, opts?.thumbnailUrl);
  return buildVinPageSeo(lang, vehicle, siteOrigin, {
    odometer: opts?.odometer,
    isUnlocked: opts?.isUnlocked,
  });
}
