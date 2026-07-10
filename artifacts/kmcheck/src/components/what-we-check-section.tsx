import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n/context";
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

function WhatWeCheckDetailPanel({
  feature,
  reportShowsLabel,
  exampleLabel,
  variant = "desktop",
}: {
  feature: WhatWeCheckFeature;
  reportShowsLabel: string;
  exampleLabel: string;
  variant?: "desktop" | "mobile";
}) {
  const { icon: Icon, title, desc, seo, includes, iconColor, bgColor, calloutClass, accentBg, example, stat, statLabel } = feature;
  const isMobile = variant === "mobile";

  return (
    <article className="relative overflow-hidden rounded-2xl border bg-card max-sm:shadow-none sm:shadow-sm">
      <div className={cn("absolute inset-x-0 top-0 h-1", accentBg)} />
      <div className={cn(isMobile ? "p-4 space-y-3.5" : "p-5 md:p-6 space-y-4")}>
        <header className="flex items-start gap-3">
          <div className={cn(
            isMobile ? "h-11 w-11 rounded-xl" : "h-12 w-12 rounded-xl",
            "flex items-center justify-center shrink-0",
            bgColor,
          )}>
            <Icon className={cn(isMobile ? "h-5 w-5" : "h-6 w-6", iconColor)} />
          </div>
          <div className="min-w-0">
            <h3 className={cn("font-bold leading-tight", isMobile ? "text-lg" : "text-xl")}>{title}</h3>
            <p className="text-muted-foreground mt-1 leading-snug text-sm">{desc}</p>
          </div>
        </header>

        <p className={cn("text-foreground/85 leading-relaxed", isMobile ? "text-sm" : "text-[15px]")}>{seo}</p>

        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">{reportShowsLabel}</p>
          <ul className={cn("gap-2", isMobile ? "space-y-2" : "grid sm:grid-cols-2 gap-x-4 gap-y-2")}>
            {includes.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-foreground/90">
                <Check className={cn("h-4 w-4 shrink-0 mt-0.5", iconColor)} aria-hidden />
                <span className="leading-snug">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className={cn(
          isMobile ? "grid grid-cols-1 gap-2.5" : "grid sm:grid-cols-[1fr_auto] gap-3 items-stretch",
        )}>
          <div className={cn("rounded-xl px-3.5 py-3 text-sm leading-relaxed", calloutClass)}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">{exampleLabel}</p>
            <p>{example}</p>
          </div>
          <div className={cn(
            "flex items-baseline flex-wrap gap-x-2 gap-y-1 rounded-xl px-4 py-3",
            isMobile ? "justify-between" : "sm:flex-col sm:justify-center sm:min-w-[9.5rem]",
            bgColor,
          )}>
            <span className={cn("font-black tabular-nums leading-none", isMobile ? "text-2xl" : "text-3xl", iconColor)}>{stat}</span>
            <span className="text-sm text-muted-foreground leading-snug">{statLabel}</span>
          </div>
        </div>
      </div>
    </article>
  );
}

function WhatWeCheckNavButton({
  feature,
  active,
  onClick,
  layoutId,
}: {
  feature: WhatWeCheckFeature;
  active: boolean;
  onClick: () => void;
  layoutId?: boolean;
}) {
  const { icon: Icon, title, iconColor, bgColor, borderColor } = feature;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative flex items-center gap-3 rounded-xl text-left transition-colors duration-200 w-full",
        "px-3 py-2.5 lg:py-3",
        active
          ? "text-foreground bg-primary/[0.06] border border-primary/20 shadow-sm"
          : "text-muted-foreground hover:text-foreground border border-transparent hover:bg-muted/40",
      )}
    >
      {active && layoutId && (
        <motion.div
          layoutId="whatWeCheckActive"
          className={cn("absolute left-0 top-2 bottom-2 w-[3px] rounded-full", borderColor.replace("border-l-", "bg-"))}
          transition={{ type: "spring", stiffness: 380, damping: 32 }}
        />
      )}
      {active && !layoutId && (
        <span className={cn("absolute left-0 top-2 bottom-2 w-[3px] rounded-full", borderColor.replace("border-l-", "bg-"))} />
      )}
      <div className={cn("h-9 w-9 lg:h-10 lg:w-10 rounded-lg flex items-center justify-center shrink-0", bgColor)}>
        <Icon className={cn("h-4 w-4 lg:h-[1.125rem] lg:w-[1.125rem]", iconColor)} />
      </div>
      <span className="text-sm lg:text-[15px] font-semibold leading-snug flex-1 min-w-0">{title}</span>
      <ChevronRight className={cn(
        "h-4 w-4 shrink-0 transition-opacity hidden lg:block",
        active ? "opacity-50" : "opacity-0 group-hover:opacity-35",
      )} />
    </button>
  );
}

export function WhatWeCheckSection({ subtitle, market, autoRotate = false, className }: Props) {
  const { t } = useTranslation();
  const features = useWhatWeCheckFeatures(t, market);
  const [activeCheck, setActiveCheck] = useState(0);
  const [checksPaused, setChecksPaused] = useState(false);
  const [sectionInView, setSectionInView] = useState(!autoRotate);
  const sectionRef = useRef<HTMLElement>(null);
  const sectionSubtitle = whatWeCheckSubtitle(t, market, subtitle);

  useEffect(() => {
    setActiveCheck(0);
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
    const timer = setInterval(() => setActiveCheck((i) => (i + 1) % features.length), 4500);
    return () => clearInterval(timer);
  }, [autoRotate, checksPaused, features.length, sectionInView]);

  return (
    <section ref={sectionRef} className={cn("relative z-[1] py-12 md:py-20 px-4 overflow-hidden bg-background", className)}>
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_70%_50%_at_20%_50%,hsl(var(--primary)/0.06),transparent_65%)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <div
        className="max-w-6xl xl:max-w-7xl mx-auto"
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
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">{sectionSubtitle}</p>
        </motion.div>

        <div className="lg:hidden space-y-3">
          <div className="grid grid-cols-2 gap-1.5">
            {features.map((feat, i) => (
              <WhatWeCheckNavButton
                key={feat.title}
                feature={feat}
                active={i === activeCheck}
                onClick={() => setActiveCheck(i)}
              />
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeCheck}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18 }}
            >
              <WhatWeCheckDetailPanel
                feature={features[activeCheck]}
                reportShowsLabel={t("what_we_check_report_shows")}
                exampleLabel={t("what_we_check_real_example")}
                variant="mobile"
              />
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="hidden lg:flex lg:gap-8 xl:gap-12 items-start w-fit max-w-full mx-auto">
          <nav className="w-[15.5rem] xl:w-[17rem] shrink-0 flex flex-col gap-1.5 pt-0.5" aria-label={t("what_we_check")}>
            {features.map((feat, i) => (
              <WhatWeCheckNavButton
                key={feat.title}
                feature={feat}
                active={i === activeCheck}
                onClick={() => setActiveCheck(i)}
                layoutId
              />
            ))}
          </nav>

          <div className="w-[32rem] xl:w-[42rem] shrink min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeCheck}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                <WhatWeCheckDetailPanel
                  feature={features[activeCheck]}
                  reportShowsLabel={t("what_we_check_report_shows")}
                  exampleLabel={t("what_we_check_real_example")}
                  variant="desktop"
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
