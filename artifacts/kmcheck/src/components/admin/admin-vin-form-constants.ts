/** @deprecated Prefer vehicle-attr-options — kept for older imports. */
export {
  ADMIN_COUNTRY_CODES as ADMIN_COUNTRY_SUGGESTIONS,
  ADMIN_TRANSMISSION_OPTIONS,
  ADMIN_FUEL_OPTIONS,
  ADMIN_BODY_OPTIONS,
  ADMIN_COLOR_OPTIONS,
} from "@/lib/vehicle-attr-options";

export const ADMIN_MILEAGE_UNITS = ["km", "mi", "miles"];

/** Flat value lists for legacy datalist sync / tests. */
export const ADMIN_TRANSMISSION_SUGGESTIONS = [
  "automatic", "manual", "cvt", "dct", "amt", "semi-automatic",
];
export const ADMIN_FUEL_SUGGESTIONS = [
  "gasoline", "diesel", "electric", "hybrid", "plug-in hybrid", "lpg", "cng", "hydrogen", "flex", "biodiesel", "e85",
];
export const ADMIN_BODY_SUGGESTIONS = [
  "sedan", "suv", "hatchback", "coupe", "convertible", "wagon", "van", "minivan", "pickup", "truck", "crossover",
];
