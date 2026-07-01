import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { sortHistoryNewestFirst } from "@/lib/history-sort";
import { sliceForHistoryPreview } from "@/lib/history-section-limit";
import { HistoryShowAllButton } from "@/components/history-show-all-button";
import { KoreanWonAmount } from "@/components/korean-won-amount";
import { reportUsesKrwAmounts } from "@/lib/korean-currency";
import {
  type InsuranceClaimEntry,
  translateInsuranceClaimType,
  translateInsuranceClaimDescription,
  formatInsuranceClaimsCount,
  localizeInsuranceClaimDate,
} from "@/lib/insurance-claims";
import type { Language } from "@/i18n/context";

type Props = {
  claims: InsuranceClaimEntry[];
  country?: string | null;
  vehicleYear?: number | null;
  krwPerUsd?: number | null;
  t: (key: string) => string;
  language: Language;
  variant?: "report" | "public";
  className?: string;
  delay?: number;
};

function ClaimRow({
  claim,
  country,
  vehicleYear,
  krwPerUsd,
  t,
  language,
  index,
  total,
  formatAsKrw,
}: {
  claim: InsuranceClaimEntry;
  country?: string | null;
  vehicleYear?: number | null;
  krwPerUsd?: number | null;
  t: Props["t"];
  language: Language;
  index: number;
  total: number;
  formatAsKrw: boolean;
}) {
  const typeLabel = translateInsuranceClaimType(t, claim.type);
  const hasBreakdown = claim.partCost != null || claim.laborCost != null || claim.paintingCost != null;
  const displayDate = localizeInsuranceClaimDate(claim.date, language, vehicleYear, country);
  const displayDescription = translateInsuranceClaimDescription(t, claim.description);

  return (
    <div className="relative pl-4">
      <div className="absolute left-0 top-2.5 h-2 w-2 rounded-full shrink-0 bg-sky-500" />
      {index < total - 1 && (
        <div className="absolute left-[3.5px] top-5 bottom-0 w-px bg-border" />
      )}
      <div className="border rounded-lg bg-muted/20 overflow-hidden">
        <div className="px-3 py-2 space-y-0.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              {displayDate ? (
                <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3 shrink-0" />
                  {displayDate}
                </p>
              ) : null}
              {typeLabel && (
                <p className="text-xs font-semibold text-foreground mt-0.5 leading-snug">{typeLabel}</p>
              )}
            </div>
            {claim.lossAmount != null && (
              <span className="text-[11px] tabular-nums text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 rounded-full px-2 py-0.5 shrink-0">
                {formatAsKrw ? (
                  <KoreanWonAmount krw={claim.lossAmount} krwPerUsd={krwPerUsd} />
                ) : (
                  <span className="font-bold">${claim.lossAmount.toLocaleString()}</span>
                )}
              </span>
            )}
          </div>
          {hasBreakdown && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 pt-1.5 border-t border-border/60">
              {claim.partCost != null && (
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{t("insurance_claim_part_cost")}</p>
                  <p className="text-[11px] font-medium tabular-nums">
                    {formatAsKrw ? (
                      <KoreanWonAmount krw={claim.partCost} krwPerUsd={krwPerUsd} />
                    ) : (
                      `$${claim.partCost!.toLocaleString()}`
                    )}
                  </p>
                </div>
              )}
              {claim.laborCost != null && (
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{t("insurance_claim_labor_cost")}</p>
                  <p className="text-[11px] font-medium tabular-nums">
                    {formatAsKrw ? (
                      <KoreanWonAmount krw={claim.laborCost} krwPerUsd={krwPerUsd} />
                    ) : (
                      `$${claim.laborCost!.toLocaleString()}`
                    )}
                  </p>
                </div>
              )}
              {claim.paintingCost != null && (
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{t("insurance_claim_painting_cost")}</p>
                  <p className="text-[11px] font-medium tabular-nums">
                    {formatAsKrw ? (
                      <KoreanWonAmount krw={claim.paintingCost} krwPerUsd={krwPerUsd} />
                    ) : (
                      `$${claim.paintingCost!.toLocaleString()}`
                    )}
                  </p>
                </div>
              )}
            </div>
          )}
          {displayDescription && !hasBreakdown && (
            <p className="text-[11px] text-muted-foreground pt-0.5 leading-snug">{displayDescription}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function ClaimsList({
  claims,
  country,
  vehicleYear,
  krwPerUsd,
  t,
  language,
}: {
  claims: InsuranceClaimEntry[];
  country?: string | null;
  vehicleYear?: number | null;
  krwPerUsd?: number | null;
  t: Props["t"];
  language: Language;
}) {
  const [expanded, setExpanded] = useState(false);
  const visible = sliceForHistoryPreview(claims, expanded);
  const formatAsKrw = reportUsesKrwAmounts({ country, insuranceClaims: claims });

  return (
    <>
      <div className="space-y-2.5">
        {visible.map((claim, i) => (
          <ClaimRow
            key={`${claim.date}-${claim.type}-${i}`}
            claim={claim}
            country={country}
            vehicleYear={vehicleYear}
            krwPerUsd={krwPerUsd}
            t={t}
            language={language}
            index={i}
            total={visible.length}
            formatAsKrw={formatAsKrw}
          />
        ))}
      </div>
      <HistoryShowAllButton
        total={claims.length}
        expanded={expanded}
        onToggle={() => setExpanded((v) => !v)}
        t={t}
        className="mt-2.5"
      />
    </>
  );
}

export function InsuranceClaimsSection({
  claims,
  country,
  vehicleYear,
  krwPerUsd,
  t,
  language,
  variant = "report",
  className,
  delay = 0.1,
}: Props) {
  if (!claims.length) return null;

  const sortedClaims = sortHistoryNewestFirst(claims);
  const note = t("report_insurance_claims_note");

  if (variant === "public") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
        className={cn("rounded-2xl border bg-card overflow-hidden", className)}
      >
        <div className="px-4 py-2.5 sm:px-5 sm:py-3 border-b flex items-center justify-between gap-2">
          <h2 className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-muted-foreground">
            {t("report_insurance_claims")}
          </h2>
          <Badge variant="secondary" className="text-[11px] sm:text-xs shrink-0">
            {formatInsuranceClaimsCount(t, sortedClaims.length)}
          </Badge>
        </div>
        <div className="px-4 py-2.5 sm:px-5 sm:py-3 space-y-2">
          <p className="text-[11px] text-muted-foreground leading-snug">{note}</p>
          <ClaimsList claims={sortedClaims} country={country} vehicleYear={vehicleYear} krwPerUsd={krwPerUsd} t={t} language={language} />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.35, delay }}
      className={cn("rounded-2xl border bg-background overflow-hidden", className)}
    >
      <div className="px-4 py-2.5 border-b flex items-center justify-between gap-2 bg-muted/30">
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-5 w-5 rounded-md bg-sky-500/10 flex items-center justify-center shrink-0">
            <FileText className="h-3 w-3 text-sky-500" />
          </div>
          <div className="min-w-0">
            <h2 className="font-bold text-sm leading-tight">{t("report_insurance_claims")}</h2>
            <p className="text-[10px] text-muted-foreground leading-tight truncate sm:whitespace-normal">
              {note}
            </p>
          </div>
        </div>
        <Badge variant="secondary" className="text-xs shrink-0">
          {formatInsuranceClaimsCount(t, sortedClaims.length)}
        </Badge>
      </div>
      <div className="px-4 py-3">
        <ClaimsList claims={sortedClaims} country={country} vehicleYear={vehicleYear} krwPerUsd={krwPerUsd} t={t} language={language} />
      </div>
    </motion.div>
  );
}
