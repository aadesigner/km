import type { Language } from "@/i18n/context";
import {
  localizeProviderDate,
  translateKoreanProviderPhrase,
  translateKoreanProviderText,
  translateProviderAmount,
  translateProviderDateInText,
  translateProviderMultiline,
  translateRegistryFieldValue,
} from "@/lib/korean-provider-text";

export type RegistryHistoryEntry = {
  date?: string | null;
  type?: string | null;
  title?: string | null;
  subtitle?: string | null;
  mileage?: number | null;
  amount?: string | null;
  location?: string | null;
  details?: Array<{ label: string; value: string }>;
};

const TYPE_KEYS: Record<string, string> = {
  new_car_delivery: "registry_type_new_car_delivery",
  inspection: "registry_type_inspection",
  registration_change: "registry_type_registration_change",
  owner_change: "registry_type_owner_change",
  no_insurance: "registry_type_no_insurance",
  insurance_event: "registry_type_insurance_event",
  recall: "registry_type_recall",
  other: "registry_type_other",
};

const FIELD_LABEL_KEYS: Record<string, string> = {
  "production country": "registry_field_production_country",
  "date of production": "registry_field_production_date",
  "first registration date": "registry_field_first_registration",
  "initial registration date": "registry_field_first_registration",
  "production date": "registry_field_production_date",
  "date of production": "registry_field_production_date",
  "new car list price": "registry_field_list_price",
  "new car delivery price": "registry_field_delivery_price",
  "new car shipping": "registry_field_shipping_price",
  "first time buyer": "registry_field_first_buyer",
  "address at time of purchase": "registry_field_purchase_address",
  "address when purchasing": "registry_field_purchase_address",
  "date of occurrence": "registry_field_occurrence_date",
  "processing type": "registry_field_processing_type",
  "total repair cost": "registry_field_repair_cost",
  "inspection date": "registry_field_inspection_date",
  "driving distance during inspection": "registry_field_inspection_mileage",
  "drone during inspection": "registry_field_inspection_mileage",
  "inspection category": "registry_field_inspection_category",
  "inspection station": "registry_field_inspection_station",
  "inspection center": "registry_field_inspection_station",
  inspection: "registry_field_inspection_category",
  "recall date": "registry_field_recall_date",
  target: "registry_field_recall_target",
  correction: "registry_field_correction_method",
  "completion date": "registry_field_completion_date",
  "car inspection completion date": "registry_field_completion_date",
  "inspection completion date": "registry_field_completion_date",
  "mileage": "mileage",
  "mileage during inspection": "registry_field_inspection_mileage",
  "date of change": "registry_field_change_date",
  "change date": "registry_field_change_date",
  "address after change": "registry_field_address_after",
  "classification of change": "registry_field_change_type",
  "driving distance when changing": "registry_field_change_mileage",
  "drown distance when changing": "registry_field_change_mileage",
  "transaction type": "registry_field_transaction_type",
  transaction: "registry_field_transaction_type",
  flag: "registry_field_sale_channel",
  period: "registry_field_period",
  "recall post date": "registry_field_recall_date",
  target: "registry_field_recall_target",
  "defect details": "registry_field_defect_details",
  "target device": "registry_field_target_device",
  "correction method": "registry_field_correction_method",
  "correction period": "registry_field_correction_period",
  "contact us": "registry_field_contact",
};

export function translateRegistryEventType(
  t: (key: string) => string,
  type?: string | null,
  fallbackTitle?: string | null,
  language?: Language,
): string {
  if (type) {
    const key = TYPE_KEYS[type];
    if (key) {
      const translated = t(key);
      if (translated !== key) return translated;
    }
  }
  const rawTitle = fallbackTitle?.replace(/\n/g, " ").trim();
  if (rawTitle) {
    const fromPhrase = translateKoreanProviderPhrase(t, rawTitle)
      ?? translateKoreanProviderText(t, rawTitle);
    if (fromPhrase && fromPhrase !== rawTitle) {
      if (language && language !== "en") {
        return translateProviderDateInText(fromPhrase, language) ?? fromPhrase;
      }
      return fromPhrase;
    }
    if (language) {
      const localized = localizeProviderDate(rawTitle, language);
      if (localized) return localized;
    }
    return rawTitle;
  }
  return t("registry_type_other");
}

export function translateRegistryFieldLabel(t: (key: string) => string, label: string): string {
  const norm = label.toLowerCase().trim();
  const key = FIELD_LABEL_KEYS[norm];
  if (key) {
    const translated = t(key);
    if (translated !== key) return translated;
  }
  const fromPhrase = translateKoreanProviderPhrase(t, label)
    ?? translateKoreanProviderText(t, label);
  if (fromPhrase && fromPhrase.toLowerCase().trim() !== norm) return fromPhrase;
  return label;
}

export function translateRegistryDetailValue(
  t: (key: string) => string,
  language: Language,
  label: string,
  value: string,
  vehicleYear?: number | null,
): string {
  return translateRegistryFieldValue(t, language, label, value, undefined, undefined, undefined, vehicleYear);
}

export function localizeRegistryDate(
  language: Language,
  date?: string | null,
  vehicleYear?: number | null,
  vehicleCountry?: string | null,
): string | null {
  return localizeProviderDate(date, language, vehicleYear, vehicleCountry);
}

export function localizeRegistrySubtitle(
  t: (key: string) => string,
  language: Language,
  subtitle?: string | null,
  country?: string | null,
  krwPerUsd?: number | null,
): string | null {
  return translateProviderMultiline(t, language, subtitle, { country, krwPerUsd });
}

export function localizeRegistryAmount(
  t: (key: string) => string,
  amount?: string | null,
  country?: string | null,
  krwPerUsd?: number | null,
): string | null {
  if (!amount) return null;
  return translateProviderAmount(t, amount, { country, krwPerUsd });
}

export function formatRegistryEventsCount(t: (key: string) => string, count: number): string {
  return t("registry_events_count").replace("{count}", String(count));
}

export function formatRegistryMileage(mileage: number): string {
  return `${mileage.toLocaleString()} km`;
}

/** Recall rows are hidden from the Korean registry timeline. */
export function isRecallRegistryEvent(event: RegistryHistoryEntry): boolean {
  if (event.type === "recall") return true;
  const title = (event.title ?? "").toLowerCase();
  const subtitle = (event.subtitle ?? "").toLowerCase();
  if (/recall/.test(title) || /recall/.test(subtitle)) return true;
  return (event.details ?? []).some((row) => /recall/i.test(row.label));
}

export function excludeRecallRegistryEvents<T extends RegistryHistoryEntry>(events: T[]): T[] {
  return events.filter((event) => !isRecallRegistryEvent(event));
}
