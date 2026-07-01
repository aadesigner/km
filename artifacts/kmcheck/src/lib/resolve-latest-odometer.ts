import {
  resolveLatestOdometerKm,
  type OdometerResolveInput,
} from "@workspace/odometer-resolve";

export {
  isKoreaVehicleCountry,
  parseKmFromText,
  resolveLatestOdometerKm,
  type OdometerResolveInput,
} from "@workspace/odometer-resolve";

export type MileageSourceInput = OdometerResolveInput;

/** Highest km reading from listing odometer + mileage/ownership/registry history. */
export function resolveLatestRecordedOdometer(input: MileageSourceInput): number | null {
  return resolveLatestOdometerKm(input);
}
