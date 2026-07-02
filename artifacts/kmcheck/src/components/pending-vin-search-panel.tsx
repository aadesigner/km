import { motion, useReducedMotion } from "framer-motion";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n/context";

const SECTION_KEYS = [
  "pending_scan_vehicle",
  "pending_scan_mileage",
  "pending_scan_accidents",
  "pending_scan_insurance",
  "pending_scan_registry",
  "pending_scan_safety",
  "pending_scan_auction",
  "pending_scan_photos",
] as const;

function GeneralSearchBar({ reduceMotion }: { reduceMotion: boolean | null }) {
  if (reduceMotion) {
    return (
      <div className="h-1 w-full max-w-[12rem] rounded-full bg-muted overflow-hidden">
        <div className="h-full w-2/5 rounded-full bg-primary/35" />
      </div>
    );
  }

  return (
    <div className="h-1 w-full max-w-[12rem] rounded-full bg-muted overflow-hidden">
      <motion.div
        className="h-full w-2/5 rounded-full bg-primary/45"
        animate={{ x: ["-120%", "320%"] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

export function PendingVinTopNotice({ className }: { className?: string }) {
  const { t } = useTranslation();

  return (
    <div
      className={cn(
        "rounded-lg border border-primary/20 bg-primary/[0.05] px-3.5 py-2.5 sm:px-4",
        "flex items-center gap-2.5",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <div className="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
        <Search className="h-3.5 w-3.5 text-primary" />
      </div>
      <div className="min-w-0 space-y-1">
        <p className="text-xs sm:text-sm text-foreground leading-snug">
          {t("pending_report_top_notice")}
        </p>
        <p className="text-[11px] sm:text-xs text-muted-foreground leading-snug">
          {t("pending_report_top_notice_sub")}
        </p>
      </div>
    </div>
  );
}

export function PendingVinSearchPanel({ className }: { className?: string }) {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();

  return (
    <div
      className={cn(
        "rounded-xl border bg-background overflow-hidden shadow-sm",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <div className="px-4 py-5 sm:py-6 flex flex-col items-center text-center gap-3 border-b bg-muted/20">
        <div className="relative flex h-11 w-11 items-center justify-center rounded-full border border-border/80 bg-background shadow-sm">
          {!reduceMotion ? (
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/20 opacity-50" />
          ) : null}
          <Search className="h-5 w-5 text-primary relative" aria-hidden />
        </div>
        <div className="min-w-0 max-w-md">
          <h2 className="font-bold text-sm sm:text-base">{t("pending_search_title")}</h2>
          <p className="mt-1 text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
            {t("pending_search_subtitle")}
          </p>
        </div>
        <GeneralSearchBar reduceMotion={reduceMotion} />
      </div>

      <div className="p-3 sm:p-3.5 flex flex-wrap gap-1.5 justify-center">
        {SECTION_KEYS.map((key) => (
          <span
            key={key}
            className="text-[10px] sm:text-[11px] px-2 py-1 rounded-md border border-border/50 bg-muted/25 text-muted-foreground"
          >
            {t(key)}
          </span>
        ))}
      </div>

      <div className="px-3.5 py-2 sm:px-4 border-t bg-muted/15">
        <p className="text-[10px] text-muted-foreground leading-relaxed text-center sm:text-left">
          {t("pending_report_desc")}
        </p>
      </div>
    </div>
  );
}
