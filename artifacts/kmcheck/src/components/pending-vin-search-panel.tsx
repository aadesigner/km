import { motion, useReducedMotion } from "framer-motion";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n/context";
import { TextWithObfuscatedEmail } from "@/components/obfuscated-email-link";

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

export function PendingVinTopNotice({
  vin,
  className,
}: {
  vin: string;
  className?: string;
}) {
  const { t } = useTranslation();

  return (
    <div
      className={cn(
        "rounded-xl border border-amber-500/30 bg-amber-500/[0.07] px-3.5 py-3.5 sm:px-4 sm:py-4",
        "flex items-start gap-3",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <div className="h-9 w-9 rounded-lg bg-amber-500/15 flex items-center justify-center shrink-0">
        <Search className="h-4 w-4 text-amber-700 dark:text-amber-400" aria-hidden />
      </div>
      <div className="min-w-0 space-y-2">
        <p className="text-sm sm:text-[15px] text-foreground leading-snug font-medium">
          {t("pending_report_top_notice")}{" "}
          <span className="whitespace-nowrap">
            (
            <span className="inline-flex items-center rounded-md border border-border/70 bg-background px-2 py-0.5 mx-0.5 font-mono text-[13px] sm:text-sm tracking-wide font-semibold tabular-nums">
              {vin}
            </span>
            )
          </span>{" "}
          {t("pending_report_top_notice_tail")}
        </p>
        <p className="text-sm sm:text-[15px] text-foreground leading-snug font-medium">
          {t("pending_report_top_notice_verify")}
        </p>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          <TextWithObfuscatedEmail
            text={t("pending_report_top_notice_sub")}
            linkClassName="font-medium text-foreground underline underline-offset-2 decoration-amber-600/50 hover:decoration-amber-600"
          />
        </p>
      </div>
    </div>
  );
}

function SearchingOrb({ reduceMotion }: { reduceMotion: boolean | null }) {
  return (
    <div className="relative flex h-14 w-14 items-center justify-center">
      {!reduceMotion ? (
        <>
          <span className="pending-search-ring absolute inset-0 rounded-full border border-primary/25" aria-hidden />
          <span
            className="pending-search-ring absolute inset-[-6px] rounded-full border border-primary/15"
            style={{ animationDelay: "0.75s" }}
            aria-hidden
          />
        </>
      ) : null}
      <div className="relative z-[1] flex h-11 w-11 items-center justify-center rounded-full border border-primary/20 bg-background shadow-sm">
        <Search className="h-5 w-5 text-primary" aria-hidden />
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
      <div className="px-4 py-5 sm:px-5 sm:py-6 flex flex-col items-center text-center gap-3.5 border-b bg-muted/20">
        <SearchingOrb reduceMotion={reduceMotion} />
        <div className="min-w-0 max-w-md">
          <h2 className="font-bold text-sm sm:text-base">{t("pending_search_title")}</h2>
          <p className="mt-1 text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
            {t("pending_search_subtitle")}
          </p>
        </div>
        <div className="h-1 w-full max-w-[14rem] rounded-full bg-muted overflow-hidden">
          {reduceMotion ? (
            <div className="h-full w-2/5 rounded-full bg-primary/40" />
          ) : (
            <motion.div
              className="h-full w-[42%] rounded-full bg-primary/50"
              animate={{ x: ["-110%", "260%"] }}
              transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
            />
          )}
        </div>
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

      <div className="px-3.5 py-2.5 sm:px-4 border-t bg-muted/15">
        <p className="text-[10px] sm:text-[11px] text-muted-foreground leading-relaxed text-center sm:text-left">
          {t("pending_report_desc")}
        </p>
      </div>
    </div>
  );
}
