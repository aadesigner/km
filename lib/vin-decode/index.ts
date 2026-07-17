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
export { isPlausibleMake, isPlausibleModel, isYearLikeModelName } from "./plausibility";
export {
  MIN_VEHICLE_LOOKUP_YEAR,
  plausibleDecodedYear,
  isVehicleTooOldForLookup,
  isVehicleEligibleForHistoryLookup,
} from "./lookup-eligibility";
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
  decodePremiumEuropeanSeries,
  decodePremiumEuropeanTrim,
  isPremiumEuropeanVin,
  type PremiumEuropeanDecode,
} from "./european-premium";
export { decodeVinLocalFree, type LocalFreeDecodeResult } from "./local-free-decode";
export { decodeLocalSeries, decodeLocalTrim } from "./local-trim";
export { decodeUsVdsModel, matchUsVdsRule } from "./us-vds";
export { decodeMazdaModel, matchMazdaRule, isMazdaVin } from "./mazda";
export { decodeHyundaiModel, matchHyundaiRule, isHyundaiVin, decodeHyundaiEngine } from "./hyundai";
export {
  inferBodyStyleFromModel,
  inferVagTransmissionFromModel,
  inferVagDriveFromModel,
} from "./vag-infer";
export {
  decodeVolkswagenModern,
  decodeAudiModern,
  decodeSkodaModern,
  decodePorscheModern,
  isVolkswagenVin,
  isAudiVin,
  isSkodaVin,
  isPorscheVin,
  resolveChinaJointVentureMake,
  vagModelYear,
  type VagModernHit,
} from "./vag-modern";
export {
  decodeVinDiagnostics,
  type VinDiagnostic,
  type DiagnosticCategory,
} from "./vin-diagnostics";
export {
  decodeSeatEuHomologation,
  decodeSeatEuModel,
  formatSeatDisplay,
  SEAT_EU_WMIS,
} from "./seat-eu";
export {
  decodeVolvoModel,
  decodeVolvoSpec,
  isVolvoVin,
  VOLVO_WMIS,
  type VolvoSpec,
} from "./volvo";
export {
  decodeTeslaModel,
  decodeTeslaSpec,
  isTeslaVin,
  TESLA_WMIS,
} from "./tesla";
export {
  decodeBydModel,
  decodeBydSpec,
  isBydVin,
  BYD_WMIS,
} from "./byd";
export {
  decodeZeekrModel,
  decodeZeekrSpec,
  isZeekrVin,
  ZEEKR_WMIS,
} from "./zeekr";
export {
  decodeXiaomiModel,
  decodeXiaomiSpec,
  isXiaomiVin,
  XIAOMI_WMIS,
} from "./xiaomi";
export {
  resolveBrandVinSpec,
  resolveBrandVinModel,
  resolveBrandVinMake,
  type BrandVinSpec,
} from "./brand-vin-spec";
