import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, CheckCircle2, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n/context";
import { Badge } from "@/components/ui/badge";
import {
  useWhatWeCheckFeatures,
  whatWeCheckSubtitle,
  type WhatWeCheckFeature,
  type WhatWeCheckMarket,
} from "@/lib/what-we-check-features";

type Props = {
  subtitle?: string;
  market?: WhatWeCheckMarket;
  autoRotate?: boolean;
  className?: string;
};

const ROTATE_MS = 5500;

const DEMO_VIN = "KNDPM3AC9K7583241";
const DEMO_VEHICLE = "2019 Kia Sportage";

function demoOriginKey(market?: WhatWeCheckMarket): string {
  if (market === "usa") return "country_usa_name";
  if (market === "canada") return "country_canada_name";
  if (market === "china") return "country_china_name";
  if (market === "uae") return "country_uae_name";
  return "country_korea_name";
}

function featureBadge(feature: WhatWeCheckFeature, t: (k: string) => string) {
  if (feature.id === "mileage" || feature.id === "accidents") {
    return {
      label: t("report_caution"),
      className: "border-amber-500/35 bg-amber-500/10 text-amber-700 dark:text-amber-400",
    };
  }
  return {
    label: t("report_clean"),
    className: "border-emerald-500/35 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  };
}

function summaryPills(feature: WhatWeCheckFeature, t: (k: string) => string) {
  if (feature.id === "mileage") {
    return [
      { value: "138,600 km", label: t("mock_label_mileage") },
      { value: feature.stat, label: feature.statLabel },
      { value: t("wwc_preview_mileage_status"), label: t("demo_odometer"), warn: true },
    ];
  }
  if (feature.id === "accidents") {
    return [
      { value: "2", label: t("mock_label_accidents") },
      { value: feature.stat, label: feature.statLabel },
      { value: "DE · KR", label: t("what_we_check_summary") },
    ];
  }
  if (feature.id === "salvage") {
    return [
      { value: t("mock_value_salvage"), label: t("mock_label_salvage") },
      { value: feature.stat, label: feature.statLabel },
      { value: t("wwc_preview_salvage_status"), label: t("report_salvage") },
    ];
  }
  return [
    { value: feature.stat, label: feature.statLabel },
    { value: t("mock_value_stolen"), label: t("mock_label_stolen") },
    { value: t("wwc_preview_theft_status"), label: t("report_theft") },
  ];
}

function CarZoneDiagram({ active }: { active: boolean }) {
  const zones = [
    { id: "front", label: "Front", hot: active },
    { id: "left", label: "Left", hot: active },
    { id: "rear", label: "Rear", hot: false },
    { id: "right", label: "Right", hot: active },
  ];

  return (
    <div className="grid grid-cols-4 gap-1.5" aria-hidden>
      {zones.map((zone) => (
        <div
          key={zone.id}
          className={cn(
            "rounded-lg border px-1 py-2 text-center text-[9px] font-semibold uppercase tracking-wide",
            zone.hot
              ? "border-red-400/50 bg-red-500/10 text-red-600 dark:text-red-400"
              : "border-border/60 bg-muted/30 text-muted-foreground",
          )}
        >
          {zone.label}
        </div>
      ))}
    </div>
  );
}

function ReportPreviewCard({
  feature,
  market,
}: {
  feature: WhatWeCheckFeature;
  market?: WhatWeCheckMarket;
}) {
  const { t } = useTranslation();
  const badge = featureBadge(feature, t);
  const pills = summaryPills(feature, t);
  const timeline = feature.includes.slice(0, 3).map((text, i) => ({
    year: String(2022 - i),
    text,
  }));

  return (
    <div className="relative">
      <div className="absolute -inset-4 sm:-inset-6 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-[1.75rem] blur-2xl -z-10 opacity-90" />

      <div className="rounded-2xl border border-border/80 bg-card shadow-[0_20px_60px_-24px_rgba(0,0,0,0.18)] dark:shadow-[0_24px_64px_-28px_rgba(0,0,0,0.55)] overflow-hidden ring-1 ring-black/[0.03] dark:ring-white/[0.05]">
        <div className="h-[3px] bg-gradient-to-r from-primary via-emerald-500 to-primary/60" />

        <div className="px-5 py-4 border-b border-border/60 bg-gradient-to-br from-primary/[0.06] via-background to-background">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                {t("what_we_check_report_title")}
              </p>
              <p className="text-[10px] font-mono tracking-wider text-muted-foreground mt-1 truncate">
                {t("what_we_check_vin_label")}: {DEMO_VIN}
              </p>
              <p className="font-bold text-base sm:text-lg tracking-tight mt-1">{DEMO_VEHICLE}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{t(demoOriginKey(market))}</p>
            </div>
            <Badge variant="outline" className={cn("shrink-0 rounded-lg text-[10px] font-bold px-2.5 py-1", badge.className)}>
              {badge.label}
            </Badge>
          </div>
        </div>

        <div className="px-5 py-4 border-b border-border/50 bg-muted/20">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground mb-3">
            {t("what_we_check_summary")}
          </p>
          <div className="grid grid-cols-3 gap-2">
            {pills.map((pill) => (
              <div
                key={pill.label}
                className={cn(
                  "rounded-xl border px-2 py-2.5 text-center",
                  pill.warn
                    ? "border-amber-500/25 bg-amber-500/[0.06]"
                    : "border-border/60 bg-background/80",
                )}
              >
                <p className={cn(
                  "text-sm sm:text-base font-black tabular-nums leading-none",
                  pill.warn ? "text-amber-700 dark:text-amber-400" : "text-foreground",
                )}>
                  {pill.value}
                </p>
                <p className="text-[9px] sm:text-[10px] text-muted-foreground mt-1 leading-snug line-clamp-2">
                  {pill.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={feature.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22 }}
            className="p-5 space-y-4"
          >
            {feature.id === "accidents" && (
              <CarZoneDiagram active />
            )}

            {feature.id === "mileage" && (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.05] px-4 py-3">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <span className="text-xs text-muted-foreground">{t("mock_label_mileage")}</span>
                  <span className="text-sm font-bold text-amber-700 dark:text-amber-400 tabular-nums">138,600 km</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full w-[43%] rounded-full bg-gradient-to-r from-amber-400 to-amber-500" />
                </div>
              </div>
            )}

            {feature.id === "salvage" && (
              <div className="flex items-center justify-center py-3">
                <span className="rounded-lg border-2 border-dashed border-emerald-500/40 bg-emerald-500/5 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-400">
                  {t("mock_value_salvage")}
                </span>
              </div>
            )}

            {feature.id === "theft" && (
              <div className="flex items-center justify-center gap-2 py-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                  {t("wwc_preview_theft_status")}
                </span>
              </div>
            )}

            <ul className="space-y-0 divide-y divide-border/50 rounded-xl border border-border/60 overflow-hidden">
              {timeline.map((row) => (
                <li key={row.year} className="flex items-center gap-3 px-3.5 py-2.5 bg-background/60">
                  <span className="text-[11px] font-mono tabular-nums text-muted-foreground w-10 shrink-0">{row.year}</span>
                  <span className="text-xs sm:text-sm text-foreground/90 leading-snug flex-1">{row.text}</span>
                  {feature.id === "accidents" || feature.id === "mileage" ? (
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                  ) : (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  )}
                </li>
              ))}
            </ul>

            <p className="text-xs text-muted-foreground leading-relaxed border-l-2 border-primary/25 pl-3 italic">
              {feature.example}
            </p>
          </motion.div>
        </AnimatePresence>

        <div className="px-5 pb-5">
          <div className="flex items-center justify-between gap-2 rounded-xl border border-dashed border-border/70 bg-muted/20 px-3.5 py-2.5 text-[11px] text-muted-foreground">
            <span>{t("what_we_check_sample_badge")}</span>
            <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-50" />
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureRow({
  feature,
  active,
  index,
  onClick,
  autoRotate,
  rotateKey,
}: {
  feature: WhatWeCheckFeature;
  active: boolean;
  index: number;
  onClick: () => void;
  autoRotate: boolean;
  rotateKey: number;
}) {
  const { icon: Icon, title, desc } = feature;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "relative w-full text-left rounded-2xl border px-4 py-4 transition-all duration-200",
        active
          ? "border-primary/35 bg-primary/[0.05] shadow-sm ring-1 ring-primary/15"
          : "border-border/60 bg-card/60 hover:border-border hover:bg-muted/30",
      )}
    >
      <div className="flex items-start gap-3.5">
        <div className={cn(
          "h-11 w-11 shrink-0 rounded-xl flex items-center justify-center ring-1",
          active ? cn(feature.bgColor, "ring-black/5 dark:ring-white/10") : "bg-muted/50 ring-border/50",
        )}>
          <Icon className={cn("h-5 w-5", active ? feature.iconColor : "text-muted-foreground")} />
        </div>
        <div className="min-w-0 flex-1 pt-0.5">
          <div className="flex items-center gap-2">
            <p className="text-sm sm:text-[15px] font-bold leading-snug">{title}</p>
            <span className="text-[10px] font-mono text-muted-foreground/70 tabular-nums">
              {String(index + 1).padStart(2, "0")}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed line-clamp-2">{desc}</p>
          {active && (
            <p className="mt-2 text-[11px] font-semibold text-primary tabular-nums">
              {feature.stat} · {feature.statLabel}
            </p>
          )}
        </div>
        <ChevronRight className={cn(
          "h-4 w-4 shrink-0 mt-1 transition-opacity",
          active ? "opacity-40" : "opacity-0",
        )} />
      </div>
      {active && autoRotate && (
        <motion.div
          key={rotateKey}
          className="absolute left-4 right-4 bottom-2 h-0.5 rounded-full bg-primary origin-left"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: ROTATE_MS / 1000, ease: "linear" }}
        />
      )}
    </button>
  );
}

export function WhatWeCheckSection({ subtitle, market, autoRotate = false, className }: Props) {
  const { t } = useTranslation();
  const features = useWhatWeCheckFeatures(t, market);
  const [activeCheck, setActiveCheck] = useState(0);
  const [checksPaused, setChecksPaused] = useState(false);
  const [sectionInView, setSectionInView] = useState(!autoRotate);
  const [rotateKey, setRotateKey] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const sectionSubtitle = whatWeCheckSubtitle(t, market, subtitle);
  const activeFeature = features[activeCheck];

  useEffect(() => {
    setActiveCheck(0);
    setRotateKey((k) => k + 1);
  }, [market, sectionSubtitle]);

  useEffect(() => {
    if (!autoRotate) return;
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setSectionInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setSectionInView(true);
      },
      { rootMargin: "120px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [autoRotate]);

  useEffect(() => {
    if (!autoRotate || checksPaused || !sectionInView) return;
    const timer = setInterval(() => {
      setActiveCheck((i) => (i + 1) % features.length);
      setRotateKey((k) => k + 1);
    }, ROTATE_MS);
    return () => clearInterval(timer);
  }, [autoRotate, checksPaused, features.length, sectionInView]);

  const handleSelect = (index: number) => {
    setActiveCheck(index);
    setRotateKey((k) => k + 1);
  };

  return (
    <section
      ref={sectionRef}
      className={cn(
        "relative z-[1] overflow-hidden px-4 py-14 md:py-20 bg-background",
        className,
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_20%_50%,hsl(var(--primary)/0.06),transparent_65%)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <div
        className="relative max-w-6xl mx-auto"
        onMouseEnter={() => setChecksPaused(true)}
        onMouseLeave={() => setChecksPaused(false)}
      >
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-10 md:mb-12 text-center space-y-3"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/5 px-3.5 py-1.5 text-xs font-semibold text-primary">
            {t("home_badge_most_checked")}
          </div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">{t("what_we_check")}</h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            {sectionSubtitle}
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,0.92fr)] gap-8 lg:gap-12 xl:gap-14 items-start">
          <div
            className="space-y-2.5"
            role="tablist"
            aria-label={t("what_we_check_sections")}
          >
            {features.map((feat, i) => (
              <FeatureRow
                key={feat.id}
                feature={feat}
                index={i}
                active={i === activeCheck}
                onClick={() => handleSelect(i)}
                autoRotate={autoRotate && !checksPaused && sectionInView}
                rotateKey={rotateKey}
              />
            ))}
          </div>

          <div role="tabpanel" className="lg:sticky lg:top-24">
            <ReportPreviewCard feature={activeFeature} market={market} />
          </div>
        </div>
      </div>
    </section>
  );
}
