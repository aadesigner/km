import { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  AlertTriangle,
  Camera,
  Database,
  Gauge,
  Gavel,
  Loader2,
  Radar,
  ShieldCheck,
  FileText,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n/context";

const PARTNER_KEYS = [
  "pending_partner_encar",
  "pending_partner_insurance",
  "pending_partner_auction",
  "pending_partner_registry",
  "pending_partner_nmvtis",
  "pending_partner_marketplace",
] as const;

const SCAN_KEYS = [
  { key: "pending_scan_mileage", icon: Gauge },
  { key: "pending_scan_accidents", icon: AlertTriangle },
  { key: "pending_scan_insurance", icon: FileText },
  { key: "pending_scan_registry", icon: Database },
  { key: "pending_scan_safety", icon: ShieldCheck },
  { key: "pending_scan_auction", icon: Gavel },
  { key: "pending_scan_photos", icon: Camera },
] as const;

function ScanRow({
  label,
  icon: Icon,
  active,
  scanningLabel,
  waitingLabel,
  delay,
}: {
  label: string;
  icon: LucideIcon;
  active: boolean;
  scanningLabel: string;
  waitingLabel: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.35 }}
      className={cn(
        "flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors",
        active
          ? "border-primary/35 bg-primary/[0.06] dark:bg-primary/10"
          : "border-border/60 bg-muted/20",
      )}
    >
      <div className={cn(
        "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
        active ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
      )}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs sm:text-[13px] font-semibold text-foreground truncate">{label}</p>
        <p className={cn(
          "text-[10px] sm:text-[11px] font-medium",
          active ? "text-primary" : "text-muted-foreground",
        )}>
          {active ? scanningLabel : waitingLabel}
        </p>
      </div>
      <div className="shrink-0">
        {active ? (
          <Loader2 className="h-4 w-4 text-primary animate-spin" />
        ) : (
          <span className="inline-block h-2 w-2 rounded-full bg-muted-foreground/25" />
        )}
      </div>
    </motion.div>
  );
}

export function PendingVinSearchPanel({ className }: { className?: string }) {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const [activeIdx, setActiveIdx] = useState(0);
  const [partnerIdx, setPartnerIdx] = useState(0);

  useEffect(() => {
    if (reduceMotion) return;
    const id = setInterval(() => {
      setActiveIdx((i) => (i + 1) % SCAN_KEYS.length);
    }, 2200);
    return () => clearInterval(id);
  }, [reduceMotion]);

  useEffect(() => {
    if (reduceMotion) return;
    const id = setInterval(() => {
      setPartnerIdx((i) => (i + 1) % PARTNER_KEYS.length);
    }, 2800);
    return () => clearInterval(id);
  }, [reduceMotion]);

  const activeLabel = t(SCAN_KEYS[activeIdx].key);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn(
        "rounded-2xl border border-primary/25 overflow-hidden shadow-sm",
        "bg-gradient-to-br from-primary/[0.04] via-background to-background",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      {/* Header — radar */}
      <div className="relative px-5 py-5 sm:px-6 sm:py-6 border-b border-primary/15 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_70%_at_50%_0%,rgba(34,197,94,0.12),transparent)]" />
        <div className="relative flex items-start gap-4">
          <div className="relative h-14 w-14 shrink-0">
            <div className="absolute inset-0 rounded-full border border-primary/20" />
            <div className="absolute inset-1 rounded-full border border-primary/15" />
            {!reduceMotion && (
              <motion.div
                className="absolute inset-0 rounded-full origin-center"
                style={{
                  background: "conic-gradient(from 0deg, transparent 0deg, rgba(34,197,94,0.35) 48deg, transparent 90deg)",
                }}
                animate={{ rotate: 360 }}
                transition={{ duration: 2.8, repeat: Infinity, ease: "linear" }}
              />
            )}
            <div className="absolute inset-0 flex items-center justify-center">
              <Radar className="h-6 w-6 text-primary" />
            </div>
          </div>
          <div className="min-w-0 flex-1 space-y-1.5">
            <p className="text-base sm:text-lg font-bold tracking-tight text-foreground leading-snug">
              {t("pending_search_title")}
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {t("pending_search_subtitle")}
            </p>
          </div>
        </div>

        {/* Active scan line */}
        <div className="relative mt-4 rounded-xl bg-muted/40 dark:bg-white/[0.04] border border-border/50 px-3 py-2.5 flex items-center gap-2.5 overflow-hidden">
          {!reduceMotion && (
            <motion.div
              className="absolute inset-y-0 w-24 bg-gradient-to-r from-transparent via-primary/15 to-transparent"
              animate={{ left: ["-30%", "130%"] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            />
          )}
          <Loader2 className="h-4 w-4 text-primary animate-spin shrink-0" />
          <AnimatePresence mode="wait">
            <motion.span
              key={activeIdx}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
              className="text-xs sm:text-sm font-medium text-foreground truncate"
            >
              {t("pending_search_active")}{" "}
              <span className="text-primary font-semibold">{activeLabel}</span>
            </motion.span>
          </AnimatePresence>
        </div>
      </div>

      {/* Scan grid */}
      <div className="px-4 py-4 sm:px-5 sm:py-5 space-y-2">
        {SCAN_KEYS.map(({ key, icon }, i) => (
          <ScanRow
            key={key}
            label={t(key)}
            icon={icon}
            active={i === activeIdx}
            waitingLabel={t("pending_scan_waiting")}
            scanningLabel={t("pending_scan_scanning")}
            delay={i * 0.04}
          />
        ))}
      </div>

      {/* Partner ticker + refund note */}
      <div className="px-4 py-3.5 sm:px-5 sm:py-4 border-t border-border/60 bg-muted/25 space-y-2">
        <div className="flex items-center gap-2 text-[11px] sm:text-xs text-muted-foreground">
          <Database className="h-3.5 w-3.5 shrink-0 text-primary/70" />
          <span className="font-medium uppercase tracking-wider shrink-0">{t("pending_search_partner_label")}</span>
          <AnimatePresence mode="wait">
            <motion.span
              key={partnerIdx}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.28 }}
              className="font-semibold text-foreground truncate"
            >
              {t(PARTNER_KEYS[partnerIdx])}
            </motion.span>
          </AnimatePresence>
        </div>
        <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
          {t("pending_report_desc")}
        </p>
      </div>
    </motion.div>
  );
}
