import { AlertTriangle, Car, CheckCircle2, ShieldCheck, XCircle } from "lucide-react";
import { VinReportSection, VinReportSectionHeader, type VinReportSectionAccent } from "@/components/vin-report-section";
import { cn } from "@/lib/utils";

type Props = {
  isTaxi: boolean;
  t: (key: string) => string;
  variant?: "report" | "public";
  className?: string;
};

function StatusPill({ ok, labelOk, labelFail }: { ok: boolean; labelOk: string; labelFail: string }) {
  return ok ? (
    <div className="inline-flex items-center gap-1 sm:gap-1.5 rounded-full bg-green-50 dark:bg-green-950/60 border border-green-200 dark:border-green-800 px-2.5 py-0.5 sm:px-3 sm:py-1">
      <CheckCircle2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-green-600 shrink-0" />
      <span className="text-[11px] sm:text-xs font-semibold text-green-700 dark:text-green-400">{labelOk}</span>
    </div>
  ) : (
    <div className="inline-flex items-center gap-1 sm:gap-1.5 rounded-full bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 px-2.5 py-0.5 sm:px-3 sm:py-1">
      <XCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-red-600 shrink-0" />
      <span className="text-[11px] sm:text-xs font-semibold text-red-700 dark:text-red-400">{labelFail}</span>
    </div>
  );
}

/** Taxi-use status card — same pattern as FloodDamageSection / Safety Status. */
export function TaxiUseSection({
  isTaxi,
  t,
  variant = "report",
  className,
}: Props) {
  const accent: VinReportSectionAccent = isTaxi ? "amber" : "emerald";

  return (
    <VinReportSection accent={accent} className={className}>
      <VinReportSectionHeader
        icon={Car}
        accent={accent}
        title={t("report_taxi")}
        variant={variant === "public" ? "public" : "report"}
        trailing={
          <StatusPill
            ok={!isTaxi}
            labelOk={t("all_clear")}
            labelFail={t("issue_found")}
          />
        }
      />
      <div className="px-6 py-5">
        <div
          className={cn(
            "rounded-xl p-4 flex items-start gap-3",
            isTaxi
              ? "bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40"
              : "bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800/40",
          )}
        >
          <div
            className={cn(
              "h-9 w-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
              isTaxi ? "bg-amber-100 dark:bg-amber-900/40" : "bg-green-100 dark:bg-green-900/40",
            )}
          >
            {isTaxi
              ? <AlertTriangle className="h-4 w-4 text-amber-600" />
              : <ShieldCheck className="h-4 w-4 text-green-600" />}
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t("report_taxi")}
            </p>
            <p
              className={cn(
                "text-sm font-bold mt-0.5",
                isTaxi ? "text-amber-800 dark:text-amber-400" : "text-green-700 dark:text-green-400",
              )}
            >
              {isTaxi ? t("taxi_flagged") : t("report_not_taxi")}
            </p>
          </div>
        </div>
      </div>
    </VinReportSection>
  );
}
