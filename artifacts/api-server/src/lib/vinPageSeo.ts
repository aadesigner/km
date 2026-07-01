import type { VinSeoLang, VinSeoVehicle } from "@workspace/vin-page-seo";
import {
  buildVinPageSeo,
  normalizeVin,
} from "@workspace/vin-page-seo";

const SITE_ORIGIN = (process.env.SITE_URL ?? "https://kmcheck.com").replace(/\/$/, "");

export function buildVinSeoFromCatalogData(
  lang: VinSeoLang,
  vin: string,
  data: Record<string, unknown>,
  opts?: { thumbnailUrl?: string | null; odometer?: number | null; isUnlocked?: boolean },
) {
  const vehicle: VinSeoVehicle = {
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
    thumbnailUrl: opts?.thumbnailUrl ?? null,
  };
  return buildVinPageSeo(lang, vehicle, SITE_ORIGIN, {
    odometer: opts?.odometer,
    isUnlocked: opts?.isUnlocked,
  });
}
