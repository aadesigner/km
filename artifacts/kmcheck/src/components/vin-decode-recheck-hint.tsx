import { Info } from "lucide-react";
import { useTranslation } from "@/i18n/context";
import { cn } from "@/lib/utils";

type VinDecodeRecheckHintProps = {
  className?: string;
};

/** Gentle nudge to re-read the VIN — not an error or identification failure message. */
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
      <p className="text-sm leading-relaxed text-muted-foreground">{t("vin_hint_recheck")}</p>
    </div>
  );
}
