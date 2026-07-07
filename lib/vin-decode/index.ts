export {
  validateCheckDigit,
  isNorthAmericanMarketVin,
  resolveCheckDigitValid,
} from "./check-digit";
export {
  VIN_CHARSET_RE,
  inspectVinFormat,
  isValidVinFormat,
  type VinFormatIssue,
} from "./validation";
export { isPlausibleMake, isPlausibleModel } from "./plausibility";
export {
  decodeVin,
  decodeCountry,
  decodeEngineCode,
  decodeBodyStyleLocal,
  decodeTransmission,
  decodePlantInfo,
  extractEngineSpecs,
  inferFuelType,
  inferDriveType,
  type VinDecodeResult,
  type PlantInfo,
  type EngineSpecs,
} from "./vinDecoder";
export { decodeModelEuropean, hasEuZzzTypeApprovalDescriptor, isEuZzzTypeApprovalVin } from "./vinDecoder-european";
export { decodeEuropeanBrandModel } from "./european-brands";
export { decodeGlobalBrandModel, decodeGlobalBrand, resolveGlobalBrandMake } from "./global-brands";
export {
  decodePremiumEuropean,
  decodePremiumEuropeanModel,
  decodePremiumEuropeanTrim,
  isPremiumEuropeanVin,
  type PremiumEuropeanDecode,
} from "./european-premium";
export { decodeVinLocalFree, type LocalFreeDecodeResult } from "./local-free-decode";
export {
  decodeVinDiagnostics,
  type VinDiagnostic,
  type DiagnosticCategory,
} from "./vin-diagnostics";
