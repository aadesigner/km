import type { ElementType } from "react";
import {
  Lock,
  Gauge,
  AlertTriangle,
  ShieldCheck,
  Users,
  TrendingUp,
  FileText,
  Shield,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { VinReportSection, ACCENT_HEADER_WASH, type VinReportSectionAccent } from "@/components/vin-report-section";

/** Blurred placeholder body shown inside locked report sections. */
export function VinLockedSectionBody({
  hint,
  variant = "rows",
}: {
  hint: string;
  variant?: "rows" | "stats" | "timeline";
}) {
  return (
    <div className="relative min-h-[112px] overflow-hidden">
      <div className="px-5 py-4 sm:px-6 sm:py-5">
        <div className="select-none pointer-events-none blur-[3.5px] opacity-80" aria-hidden>
          {variant === "stats" ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border bg-muted/40 p-3 space-y-2">
                <div className="h-2 w-14 rounded-full bg-muted-foreground/25" />
                <div className="h-5 w-20 rounded-md bg-muted-foreground/20" />
              </div>
              <div className="rounded-xl border bg-muted/40 p-3 space-y-2">
                <div className="h-2 w-16 rounded-full bg-muted-foreground/25" />
                <div className="h-5 w-16 rounded-md bg-muted-foreground/20" />
              </div>
              <div className="col-span-2 rounded-xl border bg-muted/30 p-3 space-y-2">
                <div className="h-2 w-24 rounded-full bg-muted-foreground/20" />
                <div className="h-2 w-full rounded-full bg-muted-foreground/15" />
                <div className="h-2 w-2/3 rounded-full bg-muted-foreground/15" />
              </div>
            </div>
          ) : variant === "timeline" ? (
            <LockedTimelineSketch className="h-28 w-full" />
          ) : (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex gap-3 items-start">
                  <div className="mt-1 h-2.5 w-2.5 rounded-full bg-muted-foreground/30 shrink-0" />
                  <div className="flex-1 space-y-1.5 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="h-2.5 rounded-full bg-muted-foreground/25" style={{ width: `${55 - i * 8}%` }} />
                      <div className="h-2 w-12 rounded-full bg-muted-foreground/20 shrink-0" />
                    </div>
                    <div className="h-2 rounded-full bg-muted-foreground/15" style={{ width: `${78 - i * 12}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div
        className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 px-4 bg-gradient-to-b from-background/25 via-background/70 to-background/90"
        style={{
          backgroundImage:
            "repeating-linear-gradient(135deg, transparent, transparent 8px, rgba(0,0,0,0.03) 8px, rgba(0,0,0,0.03) 10px)",
        }}
      >
        <div className="bg-background/95 border shadow-md rounded-2xl px-3.5 py-2.5 flex items-center gap-2.5 max-w-[92%]">
          <div className="h-8 w-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            <Lock className="h-3.5 w-3.5 text-primary" />
          </div>
          <p className="text-xs font-semibold text-foreground/85 leading-snug">{hint}</p>
        </div>
      </div>
    </div>
  );
}

/** Decorative mileage curve used under blur on locked pages (no real VIN data). */
function LockedTimelineSketch({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 120" className={cn("overflow-visible", className)} aria-hidden preserveAspectRatio="none">
      <defs>
        <linearGradient id="locked-tl-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.22" />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {[30, 60, 90].map((y) => (
        <line key={y} x1="8" x2="392" y1={y} y2={y} className="stroke-border/70" strokeWidth="1" strokeDasharray="4 6" />
      ))}
      <path
        d="M 12 98 C 70 92, 90 70, 130 62 S 190 55, 220 48 S 280 40, 310 28 S 360 22, 388 18"
        fill="none"
        className="stroke-primary"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M 12 98 C 70 92, 90 70, 130 62 S 190 55, 220 48 S 280 40, 310 28 S 360 22, 388 18 L 388 110 L 12 110 Z"
        fill="url(#locked-tl-fill)"
      />
      {[
        { x: 12, y: 98, c: "fill-slate-400" },
        { x: 130, y: 62, c: "fill-red-500" },
        { x: 220, y: 48, c: "fill-amber-500" },
        { x: 310, y: 28, c: "fill-sky-500" },
        { x: 388, y: 18, c: "fill-primary" },
      ].map((p) => (
        <circle key={p.x} cx={p.x} cy={p.y} r="4.5" className={cn(p.c, "stroke-background")} strokeWidth="2" />
      ))}
    </svg>
  );
}

function sectionToneFromChip(accent: string): VinReportSectionAccent {
  if (/\borange\b/.test(accent)) return "orange";
  if (/\bemerald\b|\bteal\b/.test(accent)) return "emerald";
  if (/\bsky\b/.test(accent)) return "sky";
  if (/\bviolet\b|\bpurple\b/.test(accent)) return "purple";
  if (/\brose\b|\bred\b/.test(accent)) return "rose";
  if (/\bamber\b/.test(accent)) return "amber";
  if (/\bslate\b/.test(accent)) return "slate";
  return "primary";
}

type LockedSectionCardProps = {
  title: string;
  icon?: ElementType;
  delay?: number;
  hint: string;
  variant?: "rows" | "stats" | "timeline";
  accent?: string;
  className?: string;
};

export function VinLockedSectionCard({
  title,
  icon: Icon,
  delay = 0,
  hint,
  variant = "rows",
  accent = "bg-muted text-muted-foreground",
  className,
}: LockedSectionCardProps) {
  const tone = sectionToneFromChip(accent);
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
      className={className}
    >
      <VinReportSection accent={tone}>
        <div
          className={cn(
            "px-5 py-3.5 sm:px-6 sm:py-4 border-b border-border/60 flex items-center gap-2.5",
            ACCENT_HEADER_WASH[tone],
          )}
        >
          {Icon && (
            <div className={cn("h-8 w-8 rounded-xl flex items-center justify-center shrink-0", accent)}>
              <Icon className="h-3.5 w-3.5" />
            </div>
          )}
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{title}</h2>
          <Lock className="h-3 w-3 text-muted-foreground/50 ml-auto shrink-0" />
        </div>
        <VinLockedSectionBody hint={hint} variant={variant} />
      </VinReportSection>
    </motion.div>
  );
}

export function VinLockedHeroStat({ label }: { label: string }) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full bg-muted/80 border border-border/60 px-2.5 py-1 w-full justify-center">
      <Lock className="h-3 w-3 shrink-0 text-muted-foreground" />
      <span className="text-[10px] font-medium text-muted-foreground truncate">{label}</span>
    </div>
  );
}

type VinLockedTimelinePreviewProps = {
  t: (key: string) => string;
  priceLabel?: string | null;
  onUnlock?: () => void;
};

/** Full-width locked history graph teaser (decorative, no real report data). */
export function VinLockedTimelinePreview({ t, priceLabel, onUnlock }: VinLockedTimelinePreviewProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08, duration: 0.35 }}
      className="print:hidden"
    >
      <VinReportSection>
      <div className="flex items-center justify-between gap-3 px-3 pt-3 sm:px-5 sm:pt-4">
        <h2 className="text-sm font-semibold tracking-tight text-foreground">
          {t("report_timeline_title")}
        </h2>
        <div className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-muted/50 px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">
          <Lock className="h-3 w-3" />
          {t("vin_public_timeline_locked")}
        </div>
      </div>

      <div className="relative mt-1 px-2 pb-3 sm:px-3">
        <div className="select-none pointer-events-none blur-[4px] opacity-75 scale-[1.01]" aria-hidden>
          <LockedTimelineSketch className="h-[11.5rem] w-full sm:h-[14rem]" />
          <div className="mt-1 flex justify-between px-6 text-[10px] tabular-nums text-muted-foreground">
            <span>’18</span>
            <span>’20</span>
            <span>’22</span>
            <span>’24</span>
            <span>’26</span>
          </div>
          <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5 border-t border-border/60 px-2 pt-2.5">
            {[
              t("report_timeline_accident"),
              t("report_timeline_insurance"),
              t("report_timeline_auction"),
              t("report_timeline_owner"),
            ].map((label) => (
              <li key={label} className="inline-flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-muted-foreground/40" />
                {label}
              </li>
            ))}
          </ul>
        </div>

        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-b from-background/20 via-background/65 to-background/90 px-4">
          <div className="h-11 w-11 rounded-2xl bg-primary/10 border border-primary/25 flex items-center justify-center shadow-sm">
            <Lock className="h-5 w-5 text-primary" />
          </div>
          <div className="text-center max-w-sm">
            <p className="text-sm font-semibold text-foreground">{t("vin_public_timeline_locked_title")}</p>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              {t("vin_public_timeline_locked_desc")}
            </p>
          </div>
          {onUnlock ? (
            <Button
              type="button"
              size="sm"
              className="font-bold rounded-full h-9 px-5 text-xs shadow-md shadow-primary/20 gap-1"
              onClick={onUnlock}
            >
              {priceLabel
                ? `${t("vin_public_check_cta")} — ${priceLabel}`
                : t("vin_public_check_cta")}
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          ) : null}
        </div>
      </div>
      </VinReportSection>
    </motion.section>
  );
}

type TeaserCard = {
  icon: ElementType;
  title: string;
  sample: string;
  color: string;
  bg: string;
  border: string;
};

type VinLockedTeaserPanelProps = {
  t: (key: string) => string;
  priceLabel: string | null;
  onUnlock: () => void;
  /** When false, hide Korean-registry teaser (non-KR vehicles). Default true for backward compat. */
  showKoreanRegistry?: boolean;
};

export function VinLockedTeaserPanel({
  t,
  priceLabel,
  onUnlock,
  showKoreanRegistry = true,
}: VinLockedTeaserPanelProps) {
  const cards: TeaserCard[] = [
    {
      icon: AlertTriangle,
      title: t("vin_public_accidents_section"),
      sample: t("free_decoder_teaser_accidents_sample"),
      color: "text-orange-500",
      bg: "bg-orange-500/10",
      border: "border-orange-200/80 dark:border-orange-900/40",
    },
    {
      icon: Gauge,
      title: t("vin_public_mileage_section"),
      sample: t("free_decoder_teaser_mileage_sample"),
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      border: "border-blue-200/80 dark:border-blue-900/40",
    },
    {
      icon: ShieldCheck,
      title: t("vin_public_safety_section"),
      sample: t("free_decoder_teaser_salvage_sample"),
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      border: "border-emerald-200/80 dark:border-emerald-900/40",
    },
    {
      icon: Users,
      title: t("vin_result_owners_title"),
      sample: t("vin_public_owners_label"),
      color: "text-violet-500",
      bg: "bg-violet-500/10",
      border: "border-violet-200/80 dark:border-violet-900/40",
    },
  ];

  const extraSections = [
    { icon: FileText, label: t("report_insurance_claims") },
    ...(showKoreanRegistry
      ? [{ icon: Shield, label: t("report_registry_history") }]
      : []),
    { icon: TrendingUp, label: t("report_market_data") },
  ];

  return (
    <div className="space-y-6 print:hidden">
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-border" />
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full border bg-muted/50 text-sm font-semibold text-muted-foreground">
          <Lock className="h-3.5 w-3.5" />
          {t("free_decoder_locked_section")}
        </div>
        <div className="flex-1 h-px bg-border" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {cards.map(({ icon: Icon, title, sample, color, bg, border }) => (
          <VinReportSection
            key={title}
            className={cn(border)}
          >
            <div className="p-5 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center shrink-0", bg)}>
                  <Icon className={cn("h-4 w-4", color)} />
                </div>
                <p className="font-semibold text-sm">{title}</p>
              </div>
              <div className="select-none pointer-events-none space-y-2" aria-hidden>
                <div className="blur-sm text-xs text-muted-foreground font-mono">{sample}</div>
                <div className="blur-sm space-y-1.5">
                  <div className="h-2 bg-muted-foreground/20 rounded-full w-full" />
                  <div className="h-2 bg-muted-foreground/20 rounded-full w-3/4" />
                  <div className="h-2 bg-muted-foreground/20 rounded-full w-1/2" />
                </div>
              </div>
            </div>
            <div className="absolute inset-0 bg-background/75 backdrop-blur-[3px] flex flex-col items-center justify-center gap-3 p-4">
              <div className="h-10 w-10 rounded-full bg-muted border-2 border-border flex items-center justify-center">
                <Lock className="h-4 w-4 text-muted-foreground" />
              </div>
              <Button
                type="button"
                size="sm"
                className="font-bold rounded-xl h-9 px-5 text-xs w-full max-w-[180px] shadow-md shadow-primary/20"
                onClick={onUnlock}
              >
                {priceLabel
                  ? `${t("vin_public_check_cta")} — ${priceLabel}`
                  : t("vin_public_check_cta")}
              </Button>
            </div>
          </VinReportSection>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {extraSections.map(({ icon: Icon, label }) => (
          <div
            key={label}
            className="rounded-xl border bg-card/80 px-3 py-3 flex items-center gap-2.5 opacity-90"
          >
            <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <Icon className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground truncate">{label}</p>
              <p className="text-[10px] text-muted-foreground/70 flex items-center gap-1 mt-0.5">
                <Lock className="h-2.5 w-2.5 shrink-0" />
                {t("vin_public_locked_hint")}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

type VinLockedIntroBannerProps = {
  t: (key: string) => string;
  priceLabel?: string | null;
  onUnlock: () => void;
};

export function VinLockedIntroBanner({ t, priceLabel, onUnlock }: VinLockedIntroBannerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="print:hidden relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/[0.07] via-card to-card px-4 py-4 sm:px-5 sm:py-4"
    >
      <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-primary/10 blur-2xl" />
      <div className="relative flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <div className="h-10 w-10 rounded-2xl bg-primary/15 border border-primary/25 flex items-center justify-center shrink-0">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-foreground">{t("vin_public_unlock_title")}</p>
          <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
            {t("vin_public_unlock_desc")}
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          className="shrink-0 font-bold rounded-full h-9 px-4 text-xs gap-1 shadow-md shadow-primary/15"
          onClick={onUnlock}
        >
          {priceLabel
            ? `${t("vin_public_check_cta")} — ${priceLabel}`
            : t("vin_public_check_cta")}
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </motion.div>
  );
}
