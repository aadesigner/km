import { motion } from "framer-motion";
import {
  AlertTriangle,
  type LucideIcon,
  ShieldAlert,
  CloudRain,
  Gauge,
  Scale,
  Wrench,
  Droplets,
  Gavel,
  Flame,
  Car,
  FileSearch,
  ShieldCheck,
  ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n/context";

type Severity = "high" | "medium" | "low";

const SEV: Record<
  Severity,
  { labelKey: string; rail: string; text: string; wash: string; ring: string }
> = {
  high: {
    labelKey: "severity_high",
    rail: "bg-red-500",
    text: "text-red-600 dark:text-red-400",
    wash: "bg-red-500/[0.08]",
    ring: "ring-red-500/25",
  },
  medium: {
    labelKey: "severity_medium",
    rail: "bg-amber-500",
    text: "text-amber-600 dark:text-amber-400",
    wash: "bg-amber-500/[0.08]",
    ring: "ring-amber-500/25",
  },
  low: {
    labelKey: "severity_low",
    rail: "bg-yellow-500",
    text: "text-yellow-600 dark:text-yellow-400",
    wash: "bg-yellow-500/[0.08]",
    ring: "ring-yellow-500/25",
  },
};

const ISSUE_ICONS: Record<string, LucideIcon[]> = {
  usa: [ShieldAlert, CloudRain, Gauge],
  korea: [Wrench, Gauge, Droplets],
  canada: [Scale, CloudRain, ShieldAlert],
  china: [ShieldAlert, Gauge, Wrench],
  uae: [Flame, Car, ShieldAlert],
};

const INCLUDED_ICONS: Record<string, LucideIcon[]> = {
  usa: [Gavel, Flame, Car, Scale, Gauge, ShieldCheck],
  korea: [Gavel, ClipboardList, Gauge, FileSearch, ShieldCheck, Wrench],
  canada: [ClipboardList, FileSearch, Gavel, Scale, Gauge, ShieldCheck],
  china: [ClipboardList, FileSearch, Gavel, Scale, Gauge, ShieldCheck],
  uae: [ClipboardList, FileSearch, Gavel, Scale, Gauge, ShieldCheck],
};

function splitIssue(text: string): { title: string; detail?: string } {
  const parts = text.split(" — ");
  if (parts.length >= 2) {
    return { title: parts[0].trim(), detail: parts.slice(1).join(" — ").trim() };
  }
  return { title: text };
}

type Props = {
  slug: "usa" | "korea" | "canada" | "china" | "uae";
  issues: string[];
  included: string[];
  severities: Severity[];
};

export function CountryRisksIncludedSection({ slug, issues, included, severities }: Props) {
  const { t } = useTranslation();
  const issueIcons = ISSUE_ICONS[slug] ?? [];
  const includedIcons = INCLUDED_ICONS[slug] ?? [];

  const severityCounts = issues.reduce(
    (acc, _, i) => {
      const sev = severities[i] ?? "medium";
      acc[sev] += 1;
      return acc;
    },
    { high: 0, medium: 0, low: 0 } as Record<Severity, number>,
  );

  return (
    <section className="relative overflow-hidden border-y border-border/70 bg-muted/20 dark:bg-white/[0.02] py-16 md:py-24 px-4">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_15%_0%,hsl(var(--primary)/0.05),transparent_55%)]" />

      <div className="relative max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-8 lg:gap-10 xl:gap-12 items-start">
          {/* ── Watchlist ── */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-5 space-y-2"
            >
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                {t("country_common_issues")}
              </h2>
              <p className="text-sm sm:text-[15px] text-muted-foreground leading-relaxed max-w-lg">
                {t(`country_${slug}_issues_sub`)}
              </p>
            </motion.div>

            <div className="rounded-xl border border-border/70 bg-background shadow-[0_1px_0_hsl(var(--border)/0.5)] overflow-hidden">
              {/* Legend strip */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-border/60 bg-muted/30 px-4 sm:px-5 py-3">
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {t("country_badge_risk_analysis")}
                </span>
                <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                  {(["high", "medium", "low"] as const).map((sev) => {
                    if (!severityCounts[sev]) return null;
                    const cfg = SEV[sev];
                    return (
                      <span key={sev} className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <span className={cn("h-1.5 w-1.5 rounded-full", cfg.rail)} />
                        <span className={cn("font-semibold uppercase tracking-wide", cfg.text)}>
                          {t(cfg.labelKey)}
                        </span>
                        <span className="font-mono tabular-nums text-muted-foreground/80">
                          ×{severityCounts[sev]}
                        </span>
                      </span>
                    );
                  })}
                </div>
              </div>

              <ul>
                {issues.map((issue, i) => {
                  const sev = severities[i] ?? "medium";
                  const cfg = SEV[sev];
                  const Icon = issueIcons[i] ?? AlertTriangle;
                  const { title, detail } = splitIssue(issue);
                  const isLast = i === issues.length - 1;

                  return (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.35, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                      className={cn(
                        "group relative",
                        !isLast && "border-b border-border/55",
                      )}
                    >
                      <div className="flex gap-4 sm:gap-5 px-4 sm:px-5 py-5 sm:py-6">
                        {/* Index + continuous rail */}
                        <div className="relative flex w-11 shrink-0 flex-col items-center">
                          <span className="relative z-[1] text-[10px] font-mono tabular-nums text-muted-foreground/80">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <div
                            className={cn(
                              "relative z-[1] mt-2 flex h-10 w-10 items-center justify-center rounded-lg ring-1 transition-colors duration-75",
                              cfg.wash,
                              cfg.ring,
                            )}
                          >
                            <Icon className={cn("h-[18px] w-[18px]", cfg.text)} />
                          </div>
                          {!isLast && (
                            <motion.span
                              aria-hidden
                              className={cn(
                                "absolute top-[4.25rem] bottom-[-1.35rem] w-[2px] rounded-full origin-top",
                                cfg.rail,
                                "opacity-50",
                              )}
                              initial={{ scaleY: 0 }}
                              whileInView={{ scaleY: 1 }}
                              viewport={{ once: true }}
                              transition={{ duration: 0.4, delay: i * 0.06 + 0.1, ease: "easeOut" }}
                            />
                          )}
                        </div>

                        <div className="min-w-0 flex-1 pt-0.5">
                          <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1.5">
                            <p className="text-base sm:text-[1.05rem] font-semibold leading-snug tracking-tight">
                              {title}
                            </p>
                            <span
                              className={cn(
                                "mt-0.5 shrink-0 text-[10px] font-semibold uppercase tracking-[0.14em]",
                                cfg.text,
                              )}
                            >
                              {t(cfg.labelKey)}
                            </span>
                          </div>
                          {detail ? (
                            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                              {detail}
                            </p>
                          ) : null}
                          <motion.div
                            aria-hidden
                            className={cn("mt-4 h-[2px] max-w-[8rem] origin-left rounded-full", cfg.rail)}
                            initial={{ scaleX: 0 }}
                            whileInView={{ scaleX: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.45, delay: i * 0.06 + 0.16, ease: "easeOut" }}
                          />
                        </div>
                      </div>
                    </motion.li>
                  );
                })}
              </ul>
            </div>
          </div>

          {/* ── Report index ── */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.05 }}
              className="mb-5 space-y-2"
            >
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                {t("country_whats_included")}
              </h2>
              <p className="text-sm sm:text-[15px] text-muted-foreground leading-relaxed max-w-md">
                {t(`country_${slug}_included_sub`)}
              </p>
            </motion.div>

            <div className="rounded-xl border border-border/70 bg-background shadow-[0_1px_0_hsl(var(--border)/0.5)] overflow-hidden">
              <div className="border-b border-border/60 bg-muted/30 px-4 sm:px-5 py-3">
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {t("country_badge_report_contents")}
                </span>
              </div>

              <ol className="relative px-4 sm:px-5 py-2">
                <div
                  aria-hidden
                  className="absolute left-[1.85rem] sm:left-[2.1rem] top-5 bottom-5 w-px bg-border/60"
                />
                {included.map((item, i) => {
                  const Icon = includedIcons[i] ?? ShieldCheck;
                  return (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: 8 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3, delay: 0.08 + i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                      className="group relative flex gap-3.5 py-3.5"
                    >
                      <span className="relative z-[1] flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border/80 bg-background text-[10px] font-mono tabular-nums text-muted-foreground transition-colors duration-75 group-hover:border-primary/40 group-hover:text-foreground">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div className="min-w-0 flex-1 flex items-start gap-2.5 pt-1">
                        <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/65 transition-colors duration-75 group-hover:text-primary" />
                        <span className="text-sm sm:text-[15px] leading-snug text-foreground/90 transition-colors duration-75 group-hover:text-foreground">
                          {item}
                        </span>
                      </div>
                    </motion.li>
                  );
                })}
              </ol>

              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.35 }}
                className="border-t border-border/60 bg-muted/20 px-4 sm:px-5 py-4 text-sm text-muted-foreground leading-relaxed"
              >
                {t(`country_${slug}_included_note`)}
              </motion.p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
