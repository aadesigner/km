import { Info } from "lucide-react";
import { useTranslation } from "@/i18n/context";
import { cn } from "@/lib/utils";

type VinDecodeRecheckHintProps = {
  className?: string;
};

/** Soft nudge when the decoder couldn't identify the vehicle — not a VIN error warning. */
export function VinDecodeRecheckHint({ className }: VinDecodeRecheckHintProps) {
  const { t } = useTranslation();
  return (
    <div
      className={cn(
        "flex items-start gap-2.5 rounded-lg border border-border/80 bg-muted/40 dark:bg-muted/20 px-3 py-2.5",
        className,
      )}
    >
      <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-medium text-foreground">{t("vin_hint_recheck")}</p>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{t("vin_hint_recheck_sub")}</p>
      </div>
    </div>
  );
}
