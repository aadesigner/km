import { resolveCheckDigitValid } from "./check-digit";
import { isValidVinFormat } from "./validation";
import { isPlausibleMake, isPlausibleModel, isYearLikeModelName } from "./plausibility";
import { decodeVin, decodeCountry } from "./vinDecoder";
import { decodeVinDiagnostics, type VinDiagnostic } from "./vin-diagnostics";
import { decodeLocalSeries, decodeLocalTrim } from "./local-trim";

export type LocalFreeDecodeResult = {
  vin: string;
  year: number | null;
  /** Always null — manufacture/calendar year is not encoded in the VIN. */
  manufactureYear: null;
  make: string | null;
  model: string | null;
  /** Platform / chassis / generation (e.g. Touareg 7P). */
  series: string | null;
  /** Equipment trim / grade — usually null locally; NHTSA fills when available. */
  trim: string | null;
  manufacturer: string | null;
  vehicleType: string | null;
  bodyStyle: string | null;
  engineCylinders: string | null;
  engineDisplacementL: string | null;
  engineDecoded: string | null;
  engineCode: string | null;
  fuelType: string | null;
  driveType: string | null;
  transmissionStyle: string | null;
  plantCountry: string | null;
  plantCity: string | null;
  plantCode: string | null;
  countryOfOrigin: string | null;
  wmi: string;
  checkDigitValid: boolean;
  source: "local";
  diagnostics: VinDiagnostic[];
};

export function decodeVinLocalFree(vin: string): LocalFreeDecodeResult | null {
  const normalized = vin.trim().toUpperCase();
  if (!isValidVinFormat(normalized)) return null;

  const local = decodeVin(normalized);
  const checkDigitValid = resolveCheckDigitValid(normalized);
  const diagnostics = decodeVinDiagnostics(normalized, local);
  const rawModel = local.model;
  const modelPlausible = isPlausibleModel(rawModel, normalized)
    && !isYearLikeModelName(rawModel);
  const model = modelPlausible ? rawModel : null;

  return {
    vin: local.vin,
    year: local.year,
    manufactureYear: null,
    make: isPlausibleMake(local.make, normalized) ? local.make : null,
    model,
    series: decodeLocalSeries(normalized, model),
    trim: decodeLocalTrim(normalized, model),
    manufacturer: isPlausibleMake(local.make, normalized) ? local.make : null,
    vehicleType: null,
    bodyStyle: local.bodyStyleDecoded,
    engineCylinders: local.engineCylinders,
    engineDisplacementL: local.engineDisplacement,
    engineDecoded: local.engineDecoded,
    engineCode: local.engineCode,
    fuelType: local.fuelType,
    driveType: local.driveType,
    transmissionStyle: local.transmissionDecoded,
    plantCountry: local.plantCountry,
    plantCity: local.plantCity,
    plantCode: local.plantCode,
    countryOfOrigin: local.country ?? decodeCountry(normalized),
    wmi: local.wmi,
    checkDigitValid,
    source: "local",
    diagnostics,
  };
}
