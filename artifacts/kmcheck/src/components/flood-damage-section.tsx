import { Droplets } from "lucide-react";
import { VinReportSection, VinReportSectionHeader } from "@/components/vin-report-section";
import { KoreanWonAmount } from "@/components/korean-won-amount";
import { formatAmountPlain, resolveAmountDisplayCurrency } from "@/lib/korean-currency";
import type { Language } from "@/i18n/context";

type Props = {
  isFlooded: boolean;
  floodCount?: number | null;
  floodLossAmount?: number | null;
  country?: string | null;
  krwPerUsd?: number | null;
  t: (key: string) => string;
  language: Language;
  variant?: "report" | "public";
};

/** Dedicated flood block — kept separate from collision accident history. */
export function FloodDamageSection({
  isFlooded,
  floodCount,
  floodLossAmount,
  country,
  krwPerUsd,
  t,
  language: _language,
  variant = "report",
}: Props) {
  if (!isFlooded) return null;

  const count = floodCount != null && floodCount > 0 ? floodCount : 1;
  const code = resolveAmountDisplayCurrency({
    currency: "KRW",
    vehicleCountry: country,
    accidentType: "flood",
  });

  return (
    <VinReportSection accent="sky">
      <VinReportSectionHeader
        icon={Droplets}
        accent="sky"
        title={t("report_flood_section")}
        trailing={
          <span className="text-xs font-semibold text-sky-700 dark:text-sky-300 tabular-nums">
            {t("report_flood_count").replace("{count}", String(count))}
          </span>
        }
      />
      <div className={variant === "public" ? "px-4 pb-4" : "px-4 pb-4 pt-1"}>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {t("report_flood_body")}
        </p>
        {floodLossAmount != null && floodLossAmount > 0 ? (
          <p className="mt-3 text-sm font-semibold tabular-nums">
            <span className="text-muted-foreground font-normal mr-2">{t("loss_amount")}:</span>
            {code === "KRW" ? (
              <KoreanWonAmount krw={floodLossAmount} krwPerUsd={krwPerUsd} />
            ) : (
              formatAmountPlain(floodLossAmount, code)
            )}
          </p>
        ) : null}
      </div>
    </VinReportSection>
  );
}
