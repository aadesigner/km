import { CircleHelp } from "lucide-react";
import { useTranslation } from "@/i18n/context";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { VinReportSectionAccent } from "@/components/vin-report-section";

/** Section header accent for ownership count risk. */
export function ownershipSectionAccent(ownerCount: number | null | undefined): VinReportSectionAccent {
  if (ownerCount == null || !Number.isFinite(ownerCount)) return "sky";
  if (ownerCount > 8) return "rose";
  if (ownerCount > 5) return "orange";
  return "sky";
}

/** Section header accent for safety — red when salvage or stolen. */
export function safetySectionAccent(
  isSalvage: boolean | null | undefined,
  isStolen: boolean | null | undefined,
): VinReportSectionAccent {
  if (isSalvage === true || isStolen === true) return "rose";
  return "emerald";
}

type SalvageMeaningHintProps = {
  className?: string;
  /** Compact icon-only trigger (default) vs labeled. */
  labeled?: boolean;
};

/**
 * Hover/click explanation of what a salvage / write-off title means.
 * Popover works on both desktop and mobile (tap).
 */
export function SalvageMeaningHint({ className, labeled = false }: SalvageMeaningHintProps) {
  const { t } = useTranslation();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-1 rounded-md text-red-700 dark:text-red-400",
            "hover:bg-red-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40",
            labeled ? "px-1.5 py-0.5 text-[11px] font-semibold" : "p-0.5",
            className,
          )}
          aria-label={t("salvage_meaning_title")}
        >
          <CircleHelp className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden />
          {labeled ? <span>{t("salvage_meaning_learn")}</span> : null}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        side="bottom"
        className="w-[min(20rem,calc(100vw-2rem))] p-3.5 space-y-1.5 border-red-200/70 dark:border-red-900/50 bg-card shadow-lg"
      >
        <p className="text-sm font-semibold text-foreground leading-snug">
          {t("salvage_meaning_title")}
        </p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {t("salvage_meaning_body")}
        </p>
      </PopoverContent>
    </Popover>
  );
}
