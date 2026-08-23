import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n/context";
import {
  useWhatWeCheckFeatures,
  whatWeCheckSubtitle,
  type WhatWeCheckFeature,
  type WhatWeCheckMarket,
} from "@/lib/what-we-check-features";
import { WhatWeCheckReportPreview } from "@/components/what-we-check-report-preview";

type Props = {
  subtitle?: string;
  market?: WhatWeCheckMarket;
  autoRotate?: boolean;
  className?: string;
};

const ROTATE_MS = 5500;

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
    <motion.button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "relative w-full text-left rounded-xl border px-3.5 py-2.5 lg:px-4 lg:py-3 transition-colors duration-200",
        active
          ? cn("shadow-sm ring-1 ring-black/[0.04] dark:ring-white/[0.06]", feature.calloutClass, "border-transparent")
          : "border-border/60 bg-card/50 hover:border-border hover:bg-muted/30",
      )}
      whileTap={{ scale: 0.995 }}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "h-8 w-8 lg:h-9 lg:w-9 shrink-0 rounded-lg flex items-center justify-center border transition-colors duration-200",
            active ? cn(feature.bgColor, "border-transparent") : "border-transparent bg-muted/50",
          )}
        >
          <Icon className={cn("h-4 w-4", active ? feature.iconColor : "text-muted-foreground")} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <p className="text-sm font-bold leading-snug">{title}</p>
            <span className="text-[10px] font-mono text-muted-foreground tabular-nums">
              {String(index + 1).padStart(2, "0")}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">{desc}</p>
        </div>
        <ChevronRight
          className={cn(
            "h-4 w-4 shrink-0 mt-0.5 transition-opacity duration-200",
            active ? "opacity-100 text-muted-foreground" : "opacity-0",
          )}
        />
      </div>
      {active && autoRotate && (
        <motion.div
          key={rotateKey}
          className={cn("absolute left-3.5 right-3.5 lg:left-4 lg:right-4 bottom-1.5 h-0.5 rounded-full origin-left", feature.accentBg)}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: ROTATE_MS / 1000, ease: "linear" }}
        />
      )}
    </motion.button>
  );
}

export function WhatWeCheckSection({ subtitle, market, autoRotate = false, className }: Props) {
  const { t } = useTranslation();
  const features = useWhatWeCheckFeatures(t, market);
  const [activeCheck, setActiveCheck] = useState(0);
  const [checksPaused, setChecksPaused] = useState(false);
  const [autoRotateEnabled, setAutoRotateEnabled] = useState(autoRotate);
  const [sectionInView, setSectionInView] = useState(!autoRotate);
  const [rotateKey, setRotateKey] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const sectionSubtitle = whatWeCheckSubtitle(t, market, subtitle);
  const activeFeature = features[activeCheck];

  useEffect(() => {
    setActiveCheck(0);
    setRotateKey((k) => k + 1);
    setAutoRotateEnabled(autoRotate);
  }, [market, sectionSubtitle, autoRotate]);

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
    if (!autoRotateEnabled || checksPaused || !sectionInView) return;
    const timer = setInterval(() => {
      setActiveCheck((i) => (i + 1) % features.length);
      setRotateKey((k) => k + 1);
    }, ROTATE_MS);
    return () => clearInterval(timer);
  }, [autoRotateEnabled, checksPaused, features.length, sectionInView]);

  const handleSelect = (index: number) => {
    setActiveCheck(index);
    setRotateKey((k) => k + 1);
    setAutoRotateEnabled(false);
  };

  const handleSelectById = (id: WhatWeCheckFeature["id"]) => {
    const index = features.findIndex((f) => f.id === id);
    if (index >= 0) handleSelect(index);
  };

  return (
    <section
      ref={sectionRef}
      className={cn(
        "relative z-[1] overflow-hidden px-4 py-14 md:py-20 bg-background",
        className,
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_70%_40%,hsl(var(--primary)/0.05),transparent_70%)] pointer-events-none" />
      <div className="absolute inset-x-0 top-0 h-px bg-border/80" />

      <div
        className="relative max-w-6xl mx-auto"
        onMouseEnter={() => setChecksPaused(true)}
        onMouseLeave={() => setChecksPaused(false)}
      >
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-10 md:mb-12 text-center space-y-2.5"
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            {t("home_badge_most_checked")}
          </p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">{t("what_we_check")}</h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto leading-relaxed">
            {sectionSubtitle}
          </p>
        </motion.div>

        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-center lg:gap-6 xl:gap-8">
          <div className="space-y-2 w-full lg:w-[24rem] lg:shrink-0" role="tablist" aria-label={t("what_we_check_sections")}>
            {features.map((feat, i) => (
              <FeatureRow
                key={feat.id}
                feature={feat}
                index={i}
                active={i === activeCheck}
                onClick={() => handleSelect(i)}
                autoRotate={autoRotateEnabled && !checksPaused && sectionInView}
                rotateKey={rotateKey}
              />
            ))}
          </div>

          <div role="tabpanel" className="w-full lg:w-[560px] xl:w-[580px] lg:shrink-0 lg:sticky lg:top-24 flex items-center justify-center">
            <WhatWeCheckReportPreview
              feature={activeFeature}
              market={market}
              onSelectFeature={handleSelectById}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
