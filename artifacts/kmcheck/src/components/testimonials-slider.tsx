import { useEffect, useState } from "react";
import { motion, AnimatePresence, type PanInfo } from "framer-motion";
import { Star, ChevronLeft, ChevronRight, CheckCircle2, AlertTriangle } from "lucide-react";
import { useTranslation } from "@/i18n/context";
import { cn } from "@/lib/utils";
import type { Testimonial } from "@/data/testimonials";

type TestimonialsSliderProps = {
  testimonials: Testimonial[];
  titleKey?: string;
  subtitleKey?: string;
  className?: string;
};

export function TestimonialsSlider({
  testimonials,
  titleKey = "testimonials_title",
  subtitleKey = "testimonials_subtitle",
  className,
}: TestimonialsSliderProps) {
  const { t, language } = useTranslation();
  const [tmIdx, setTmIdx] = useState(0);
  const [tmPaused, setTmPaused] = useState(false);

  useEffect(() => {
    setTmIdx(0);
  }, [language]);

  useEffect(() => {
    if (tmPaused || testimonials.length === 0) return;
    const timer = setInterval(
      () => setTmIdx((i) => (i + 1) % testimonials.length),
      5500,
    );
    return () => clearInterval(timer);
  }, [tmPaused, testimonials.length]);

  const tm = testimonials[tmIdx % Math.max(testimonials.length, 1)];
  const handleSwipe = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const swipeDistance = 50;
    const swipeVelocity = 500;

    if (info.offset.x <= -swipeDistance || info.velocity.x <= -swipeVelocity) {
      setTmIdx((i) => (i + 1) % testimonials.length);
    } else if (info.offset.x >= swipeDistance || info.velocity.x >= swipeVelocity) {
      setTmIdx((i) => (i - 1 + testimonials.length) % testimonials.length);
    }

    setTmPaused(false);
  };

  return (
    <section className={cn("py-16 md:py-24 px-4", className)}>
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10 space-y-3"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-yellow-400/40 bg-yellow-400/5 px-3.5 py-1.5 text-xs font-semibold text-yellow-600 dark:text-yellow-400">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            {t("testimonials_trust_badge")}
          </div>
          <h2 className="text-3xl md:text-4xl font-bold">{t(titleKey)}</h2>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto">{t(subtitleKey)}</p>
        </motion.div>

        <div
          className="relative"
          onMouseEnter={() => setTmPaused(true)}
          onMouseLeave={() => setTmPaused(false)}
        >
          <button
            type="button"
            onClick={() => setTmIdx((i) => (i - 1 + testimonials.length) % testimonials.length)}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 sm:-translate-x-5 z-10 h-10 w-10 rounded-full bg-background border border-border shadow-md flex items-center justify-center hover:bg-muted transition-colors shrink-0"
            aria-label="Previous"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => setTmIdx((i) => (i + 1) % testimonials.length)}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 sm:translate-x-5 z-10 h-10 w-10 rounded-full bg-background border border-border shadow-md flex items-center justify-center hover:bg-muted transition-colors shrink-0"
            aria-label="Next"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          <AnimatePresence mode="wait">
            {tm && (
              <motion.div
                key={tmIdx}
                initial={{ opacity: 0, x: 32 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -32 }}
                transition={{ duration: 0.22 }}
                drag={testimonials.length > 1 ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.18}
                dragSnapToOrigin
                onDragStart={() => setTmPaused(true)}
                onDragEnd={handleSwipe}
                className="mx-8 touch-pan-y select-none cursor-grab active:cursor-grabbing sm:mx-10 bg-background rounded-3xl border border-border/70 p-7 md:p-9 shadow-sm"
              >
                <div className="flex items-center justify-between gap-2 mb-5">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={cn(
                          "h-4 w-4",
                          s <= tm.stars
                            ? "fill-yellow-400 text-yellow-400"
                            : "fill-muted-foreground/15 text-muted-foreground/25",
                        )}
                      />
                    ))}
                  </div>
                  {tm.date && <span className="text-xs text-muted-foreground/60">{tm.date}</span>}
                </div>

                <p className="text-base md:text-lg leading-relaxed text-foreground/85 mb-5 min-h-[72px]">
                  &ldquo;{tm.text}&rdquo;
                </p>

                {tm.resultBadge && (
                  <div className="inline-flex items-center gap-1.5 mb-5 rounded-lg px-2.5 py-1 text-[11px] font-semibold bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400">
                    <AlertTriangle className="h-3 w-3 shrink-0" />
                    {tm.resultBadge}
                  </div>
                )}

                <div className="flex items-center gap-3 pt-5 border-t border-border/50">
                  <div
                    className={cn(
                      "h-11 w-11 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0",
                      tm.avatarBg,
                    )}
                  >
                    {tm.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-sm truncate">{tm.name}</span>
                      <img
                        src={`https://flagcdn.com/${tm.flagCode}.svg`}
                        alt=""
                        className="h-3.5 w-auto rounded-sm shrink-0"
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate">{tm.car}</p>
                  </div>
                  <span className="text-[10px] text-green-600 dark:text-green-400 font-semibold flex items-center gap-1 shrink-0">
                    <CheckCircle2 className="h-3.5 w-3.5" /> {t("auth_verified_purchase")}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center justify-center gap-2 mt-6">
            {testimonials.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setTmIdx(i)}
                className={cn(
                  "rounded-full transition-all duration-200",
                  i === tmIdx
                    ? "w-5 h-2 bg-primary"
                    : "w-2 h-2 bg-muted-foreground/25 hover:bg-muted-foreground/50",
                )}
                aria-label={`Go to review ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
