import { FileDown } from "lucide-react";
import { useTranslation } from "@/i18n/context";
import {
  VinReportShareActions,
  VinReportPdfPreview,
  VinShareReportHighlights,
  VinReportDataDisclaimer,
  type VinShareActionsProps,
} from "@/components/vin-report-share-actions";
import { cn } from "@/lib/utils";

export function VinReportShareCard(props: VinShareActionsProps) {
  const { t } = useTranslation();
  const { vehicleTitle, vin, preview } = props;

  return (
    <section
      className="print:hidden mt-6 sm:mt-8"
      aria-labelledby="vin-share-section-title"
    >
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl border border-border/70",
          "bg-gradient-to-br from-card via-card to-primary/[0.04]",
          "shadow-[0_8px_32px_-12px_rgba(0,0,0,0.12)] dark:shadow-[0_12px_40px_-16px_rgba(0,0,0,0.45)]",
        )}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_100%_0%,hsl(var(--primary)/0.09),transparent_55%)]"
        />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

        <div className="relative p-4 sm:p-6 lg:p-7">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,200px)_1fr] lg:gap-8 lg:items-start">
            {/* Left — PDF preview mock + included highlights */}
            <div className="flex flex-col items-center lg:items-start gap-4">
              <VinReportPdfPreview vehicleTitle={vehicleTitle} vin={vin} preview={preview} />
              <VinShareReportHighlights className="w-full max-w-[240px] lg:max-w-none" />
            </div>

            {/* Right — actions */}
            <div className="min-w-0 space-y-4">
              <div className="space-y-1.5 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/[0.07] px-3 py-1 text-[11px] font-semibold text-primary">
                  <FileDown className="h-3.5 w-3.5" aria-hidden />
                  {t("vin_share_panel_badge")}
                </div>
                <h2
                  id="vin-share-section-title"
                  className="text-lg sm:text-xl font-bold tracking-tight text-foreground leading-snug pt-1"
                >
                  {t("vin_result_share_title")}
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-xl mx-auto lg:mx-0">
                  {t("vin_share_panel_desc")}
                </p>
                <p className="text-xs text-muted-foreground/90 truncate pt-0.5 max-w-xl mx-auto lg:mx-0">
                  <span className="font-medium text-foreground/90">{vehicleTitle}</span>
                  <span className="mx-1.5 text-border">·</span>
                  <span className="font-mono tracking-wide">{vin}</span>
                </p>
              </div>

              <VinReportShareActions {...props} disabled={props.disabled} />
            </div>
          </div>
        </div>
      </div>
      <VinReportDataDisclaimer className="mt-4 sm:mt-5" />
    </section>
  );
}
