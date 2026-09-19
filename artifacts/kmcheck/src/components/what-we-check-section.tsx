import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
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

export function WhatWeCheckSection({ subtitle, market, autoRotate = false, className }: Props) {
  const { t } = useTranslation();
  const features = useWhatWeCheckFeatures(t, market);
  const [activeCheck, setActiveCheck] = useState(0);
  const [checksPaused, setChecksPaused] = useState(false);
  const [autoRotateEnabled, setAutoRotateEnabled] = useState(autoRotate);
  const [sectionInView, setSectionInView] = useState(!autoRotate);
  const sectionRef = useRef<HTMLElement>(null);
  const sectionSubtitle = whatWeCheckSubtitle(t, market, subtitle);
  const activeFeature = features[activeCheck];

  useEffect(() => {
    setActiveCheck(0);
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
    }, ROTATE_MS);
    return () => clearInterval(timer);
  }, [autoRotateEnabled, checksPaused, features.length, sectionInView]);

  const handleSelect = (index: number) => {
    setActiveCheck(index);
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
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_40%,hsl(var(--primary)/0.05),transparent_70%)] pointer-events-none" />
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
          className="mb-8 md:mb-10 text-center space-y-2.5"
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            {t("home_badge_most_checked")}
          </p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">{t("what_we_check")}</h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto leading-relaxed">
            {sectionSubtitle}
          </p>
        </motion.div>

        {/* Report only — section chips inside the card stay clickable; auto-rotate when enabled. */}
        <div className="mx-auto w-full max-w-[640px] md:max-w-[680px] lg:max-w-[720px]">
          <WhatWeCheckReportPreview
            feature={activeFeature}
            market={market}
            onSelectFeature={handleSelectById}
          />
        </div>
      </div>
    </section>
  );
}
