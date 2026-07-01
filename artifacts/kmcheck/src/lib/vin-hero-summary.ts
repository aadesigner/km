import type { VinHeroSummaryItem } from "@/components/vin-report-hero";
import { formatAccidentCount } from "@/lib/format-accident-count";

type BuildOpts = {
  t: (key: string) => string;
  locked?: boolean;
  accidentsCount: number;
  odometer?: number | null;
  hasMileage: boolean;
  hasSalvageData: boolean;
  isSalvage?: boolean | null;
  hasTheftData: boolean;
  isStolen?: boolean | null;
};

/** Only includes summary chips when the provider returned real data for that field. */
export function buildVinHeroSummaryItems(opts: BuildOpts): VinHeroSummaryItem[] {
  const { t, locked } = opts;

  if (locked) {
    return [];
  }

  const items: VinHeroSummaryItem[] = [];

  if (opts.accidentsCount > 0) {
    items.push({
      kind: "accidents",
      label: formatAccidentCount(t, opts.accidentsCount),
      tone: "negative",
    });
  }

  if (opts.hasMileage && opts.odometer != null) {
    items.push({
      kind: "mileage",
      label: `${opts.odometer.toLocaleString()} km`,
      tone: "neutral",
    });
  }

  if (opts.hasSalvageData) {
    items.push({
      kind: "salvage",
      label: opts.isSalvage ? t("salvage_flagged") : t("report_no_salvage"),
      tone: opts.isSalvage ? "negative" : "positive",
    });
  }

  if (opts.hasTheftData) {
    items.push({
      kind: "theft",
      label: opts.isStolen ? t("theft_flagged") : t("report_not_stolen"),
      tone: opts.isStolen ? "negative" : "positive",
    });
  }

  return items;
}
