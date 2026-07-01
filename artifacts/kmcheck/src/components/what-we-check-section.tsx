import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Check, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n/context";
import { useReportFeatures } from "@/lib/report-features";

type Props = {
  subtitle?: string;
};

export function WhatWeCheckSection({ subtitle }: Props) {
  const { t } = useTranslation();
  const features = useReportFeatures(t);
  const [activeCheck, setActiveCheck] = useState(0);

  return (
    <section className="relative py-12 md:py-24 px-4 overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_70%_50%_at_20%_50%,hsl(var(--primary)/0.07),transparent_65%)]" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_50%_40%_at_90%_80%,hsl(var(--primary)/0.04),transparent)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="max-w-6xl mx-auto">
        {/* Mobile */}
        <div className="lg:hidden space-y-5">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center space-y-2"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-[11px] font-semibold text-primary">
              {t("home_badge_most_checked")}
            </div>
            <h2 className="text-2xl font-bold tracking-tight">{t("what_we_check")}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
              {subtitle ?? t("what_we_check_sub")}
            </p>
          </motion.div>

          <div className="grid grid-cols-2 gap-2">
            {features.map(({ icon: Icon, title, stat, iconColor, bgColor }, i) => (
              <button
                key={title}
                type="button"
                onClick={() => setActiveCheck(i)}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-colors",
                  i === activeCheck
                    ? "border-primary/40 bg-primary/[0.07] shadow-sm"
                    : "bg-background border-border/80",
                )}
              >
                <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0", bgColor)}>
                  <Icon className={cn("h-4 w-4", iconColor)} />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold leading-tight line-clamp-2">{title}</p>
                  <p className={cn("text-xs font-black tabular-nums mt-0.5", iconColor)}>{stat}</p>
                </div>
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {(() => {
              const { icon: Icon, title, desc, iconColor, bgColor, calloutClass, accentBg, example, stat, statLabel } = features[activeCheck];
              return (
                <motion.div
                  key={activeCheck}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                  className="relative overflow-hidden rounded-xl border bg-card shadow-sm"
                >
                  <div className={cn("absolute inset-x-0 top-0 h-0.5", accentBg)} />
                  <div className="p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0", bgColor)}>
                        <Icon className={cn("h-5 w-5", iconColor)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-base leading-snug">{title}</h3>
                        <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{statLabel}</p>
                      </div>
                      <p className={cn("text-2xl font-black tabular-nums shrink-0", iconColor)}>{stat}</p>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                    <div className={cn("rounded-lg px-3 py-2.5 text-xs leading-relaxed", calloutClass)}>
                      {example}
                    </div>
                  </div>
                </motion.div>
              );
            })()}
          </AnimatePresence>

          <div className="flex justify-center gap-1.5 pt-1">
            {features.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActiveCheck(i)}
                aria-label={`${t("what_we_check")} ${i + 1}`}
                className={cn(
                  "rounded-full transition-all",
                  i === activeCheck ? "w-5 h-1.5 bg-primary" : "w-1.5 h-1.5 bg-muted-foreground/30",
                )}
              />
            ))}
          </div>
        </div>

        {/* Desktop */}
        <div className="hidden lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-10 lg:gap-14 items-start">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="lg:sticky lg:top-24 space-y-6"
          >
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3.5 py-1 text-xs font-semibold text-primary">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
                </span>
                {t("home_badge_most_checked")}
              </div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">{t("what_we_check")}</h2>
              <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
                {subtitle ?? t("what_we_check_sub")}
              </p>
            </div>

            <div className="flex flex-col gap-2">
              {features.map(({ icon: Icon, title, stat, iconColor, bgColor, borderColor }, i) => (
                <button
                  key={title}
                  type="button"
                  onClick={() => setActiveCheck(i)}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-all duration-200",
                    i === activeCheck
                      ? "border-primary/35 bg-primary/[0.06] shadow-sm shadow-primary/10"
                      : "bg-background hover:border-border/80 hover:bg-muted/40",
                  )}
                >
                  {i === activeCheck && (
                    <motion.div
                      layoutId="whatWeCheckActiveCountry"
                      className={cn("absolute left-0 top-2 bottom-2 w-[3px] rounded-full", borderColor.replace("border-l-", "bg-"))}
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  )}
                  <div className={cn(
                    "h-9 w-9 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-200",
                    bgColor,
                    i === activeCheck && "scale-105",
                  )}>
                    <Icon className={cn("h-4 w-4", iconColor)} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold leading-tight truncate">{title}</p>
                    <p className={cn("text-xs font-bold tabular-nums mt-0.5", iconColor)}>{stat}</p>
                  </div>
                  <ChevronRight className={cn(
                    "h-4 w-4 shrink-0 transition-all duration-200",
                    i === activeCheck ? "text-primary opacity-100 translate-x-0" : "text-muted-foreground/40 opacity-0 -translate-x-1 group-hover:opacity-60 group-hover:translate-x-0",
                  )} />
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                {features.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setActiveCheck(i)}
                    aria-label={`${t("what_we_check")} ${i + 1}`}
                    className={cn(
                      "rounded-full transition-all duration-300",
                      i === activeCheck ? "w-7 h-1.5 bg-primary" : "w-1.5 h-1.5 bg-muted-foreground/25 hover:bg-muted-foreground/50",
                    )}
                  />
                ))}
              </div>
              <span className="text-[11px] text-muted-foreground font-medium tabular-nums">
                {String(activeCheck + 1).padStart(2, "0")} / {String(features.length).padStart(2, "0")}
              </span>
            </div>
          </motion.div>

          <div className="flex flex-col gap-4">
            <AnimatePresence mode="wait">
              {(() => {
                const { icon: Icon, title, desc, iconColor, bgColor, calloutClass, accentBg, example, stat, statLabel } = features[activeCheck];
                return (
                  <motion.div
                    key={activeCheck}
                    initial={{ opacity: 0, y: 16, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -12, scale: 0.98 }}
                    transition={{ duration: 0.32, ease: "easeOut" }}
                    className="group relative flex flex-col overflow-hidden rounded-2xl border-2 border-border bg-background shadow-[0_8px_40px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.25)]"
                  >
                    <div className={cn("absolute inset-x-0 top-0 h-1", accentBg)} />
                    <div className={cn("absolute -right-4 -bottom-6 text-[9rem] font-black leading-none select-none pointer-events-none opacity-[0.04] tabular-nums", iconColor)}>
                      {stat}
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] via-transparent to-transparent pointer-events-none" />

                    <div className="relative z-10 p-4 md:p-5 flex flex-col gap-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm", bgColor)}>
                            <Icon className={cn("h-6 w-6", iconColor)} />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">
                              {String(activeCheck + 1).padStart(2, "0")}
                            </p>
                            <h3 className="font-bold text-lg md:text-xl leading-tight">{title}</h3>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className={cn("text-3xl font-black leading-none tabular-nums", iconColor)}>{stat}</p>
                          <p className="text-[10px] text-muted-foreground mt-1 max-w-[120px] leading-tight ml-auto">{statLabel}</p>
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground leading-snug">{desc}</p>

                      <div className={cn("rounded-lg px-3 py-2.5", calloutClass)}>
                        <div className="flex items-start gap-2">
                          <div className={cn("h-5 w-5 rounded-md flex items-center justify-center shrink-0 mt-0.5", bgColor)}>
                            <Check className={cn("h-3 w-3", iconColor)} />
                          </div>
                          <p className="text-sm leading-snug text-foreground/80">{example}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground pt-1.5 border-t border-border/60">
                        <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0" />
                        {t("instant_report")}
                      </div>
                    </div>
                  </motion.div>
                );
              })()}
            </AnimatePresence>

            <div className="grid grid-cols-2 gap-3 shrink-0">
              {features.map((feat, i) => {
                const { icon: Icon, title, stat, iconColor, bgColor } = feat;
                const isActive = i === activeCheck;
                return (
                  <button
                    key={title}
                    type="button"
                    onClick={() => setActiveCheck(i)}
                    className={cn(
                      "group text-left rounded-xl border px-4 py-4 transition-all duration-200",
                      isActive
                        ? "border-primary/35 bg-primary/[0.06] shadow-sm shadow-primary/10"
                        : "bg-background/80 hover:bg-muted/30 hover:border-primary/20 hover:shadow-sm",
                    )}
                  >
                    <div className="flex items-center gap-2.5 mb-2.5">
                      <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center shrink-0", bgColor)}>
                        <Icon className={cn("h-4 w-4", iconColor)} />
                      </div>
                      <p className={cn("text-xl font-black tabular-nums leading-none", iconColor)}>{stat}</p>
                    </div>
                    <p className={cn(
                      "text-xs font-semibold leading-snug line-clamp-2 transition-colors",
                      isActive ? "text-primary" : "group-hover:text-primary",
                    )}>
                      {title}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
