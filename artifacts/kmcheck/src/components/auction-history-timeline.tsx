import { useState } from "react";
import { MapPin } from "lucide-react";
import { HistoryShowAllButton } from "@/components/history-show-all-button";
import { sliceForHistoryPreview } from "@/lib/history-section-limit";
import { sortHistoryNewestFirst } from "@/lib/history-sort";
import { localizeProviderDate } from "@/lib/korean-provider-text";
import { translateDamageLabel } from "@/lib/translate-damage-label";
import { translateTitleStatus } from "@/lib/translate-title-status";
import { translateLotStatus } from "@/lib/translate-lot-status";
import { cleanDisplayStr, type AuctionHistoryLike } from "@/lib/report-display";
import { formatLocationLabel, countryLabelsFromT } from "@/lib/format-country-name";
import type { Language } from "@/i18n/context";

type Props = {
  history: AuctionHistoryLike[];
  t: (key: string) => string;
  language: Language;
  vehicleYear?: number | null;
  vehicleCountry?: string | null;
};

function cleanStr(v: string | null | undefined): string | null {
  return cleanDisplayStr(v);
}

export function AuctionHistoryTimeline({ history, t, language, vehicleYear, vehicleCountry }: Props) {
  const [expanded, setExpanded] = useState(false);
  const countryLabels = countryLabelsFromT(t);
  const sorted = sortHistoryNewestFirst(history);
  const visible = sliceForHistoryPreview(sorted, expanded);

  return (
    <div className="space-y-2">
      {visible.map((entry, i) => {
        const locationParts = [entry.city, entry.state, entry.country].filter(Boolean);
        const locationStr = locationParts.length > 0
          ? formatLocationLabel(locationParts.join(", "), language, countryLabels)
          : null;
        const cond = translateLotStatus(t, cleanStr(entry.condition));
        const primaryDmg = translateDamageLabel(t, cleanStr(entry.primaryDamage) ?? cleanStr(entry.damage));
        const secondaryDmg = translateDamageLabel(t, cleanStr(entry.secondaryDamage));
        const status = translateLotStatus(t, cleanStr(entry.lotStatus));
        const titleLabel = translateTitleStatus(t, cleanStr(entry.titleStatus));
        const hasBids = entry.openingBid != null || entry.buyNowPrice != null || entry.finalPrice != null;
        return (
          <div key={i} className="rounded-lg border bg-muted/20 p-3 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  {t("auction_record_n")} #{i + 1}
                </p>
                {entry.date && (
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {localizeProviderDate(entry.date, language, vehicleYear, vehicleCountry)}
                  </p>
                )}
              </div>
              {status && (
                <span className="text-[10px] font-semibold uppercase tracking-wide bg-primary/10 text-primary rounded-full px-2 py-0.5 shrink-0">
                  {status}
                </span>
              )}
            </div>

            {locationStr && (
              <p className="text-[11px] text-muted-foreground flex items-center gap-1 leading-snug">
                <MapPin className="h-3 w-3 shrink-0" />
                {locationStr}
              </p>
            )}

            {(cond || primaryDmg || secondaryDmg || titleLabel) && (
              <div className="flex flex-wrap gap-1.5">
                {cond && (
                  <span className="text-[11px] bg-muted rounded-md px-2 py-0.5 text-muted-foreground">
                    {t("condition")}: {cond}
                  </span>
                )}
                {primaryDmg && (
                  <span className="text-[11px] bg-muted rounded-md px-2 py-0.5 text-muted-foreground">
                    {t("primary_damage")}: {primaryDmg}
                  </span>
                )}
                {secondaryDmg && (
                  <span className="text-[11px] bg-muted rounded-md px-2 py-0.5 text-muted-foreground">
                    {t("secondary_damage")}: {secondaryDmg}
                  </span>
                )}
                {titleLabel && (
                  <span className="text-[11px] bg-amber-500/10 text-amber-800 dark:text-amber-300 rounded-md px-2 py-0.5">
                    {t("title_status")}: {titleLabel}
                  </span>
                )}
              </div>
            )}

            {hasBids && (
              <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-border/60">
                {entry.openingBid != null && (
                  <div className="space-y-0.5">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{t("auction_opening_bid")}</p>
                    <p className="text-[11px] font-semibold tabular-nums">
                      ${entry.openingBid.toLocaleString()}
                    </p>
                  </div>
                )}
                {entry.buyNowPrice != null && (
                  <div className="space-y-0.5">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{t("auction_buy_now")}</p>
                    <p className="text-[11px] font-semibold tabular-nums">
                      ${entry.buyNowPrice.toLocaleString()}
                    </p>
                  </div>
                )}
                {entry.finalPrice != null && (
                  <div className="space-y-0.5">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{t("auction_final_price")}</p>
                    <p className="text-[11px] font-bold tabular-nums text-blue-700 dark:text-blue-400">
                      ${entry.finalPrice.toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
      <HistoryShowAllButton
        total={sorted.length}
        expanded={expanded}
        onToggle={() => setExpanded((v) => !v)}
        t={t}
      />
    </div>
  );
}
