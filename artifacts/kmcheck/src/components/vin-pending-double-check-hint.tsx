import { Info } from "lucide-react";
import { useTranslation } from "@/i18n/context";
import { cn } from "@/lib/utils";

type VinPendingDoubleCheckHintProps = {
  className?: string;
};

/** Info-style nudge when a valid decode is pending manual review — same tone as checkout. */
export function VinPendingDoubleCheckHint({ className }: VinPendingDoubleCheckHintProps) {
  const { t } = useTranslation();
  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-lg border border-sky-200/70 dark:border-sky-800/50 bg-sky-50/40 dark:bg-sky-950/20 px-3 py-2.5",
        className,
      )}
    >
      <Info className="h-4 w-4 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
      <p className="text-sm font-medium text-sky-800 dark:text-sky-300">{t("vin_warning_pending_double_check")}</p>
    </div>
  );
}
