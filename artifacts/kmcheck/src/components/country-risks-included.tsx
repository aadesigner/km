import { motion } from "framer-motion";
import {
  AlertTriangle, CheckCircle2, type LucideIcon,
  ShieldAlert, CloudRain, Gauge, Scale,
  Wrench, Droplets,
  Gavel, Flame, Car, FileSearch, ShieldCheck, ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n/context";

type Severity = "high" | "medium" | "low";

const SEV: Record<Severity, { labelKey: string; border: string; pill: string; bar: string; pct: string; ring: string }> = {
  high: {
    labelKey: "severity_high",
    border: "border-l-red-500",
    pill: "bg-red-500/10 text-red-600 dark:text-red-400 ring-1 ring-red-500/20",
    bar: "bg-red-500",
    pct: "85%",
    ring: "bg-red-500/10 text-red-600 dark:text-red-400",
  },
  medium: {
    labelKey: "severity_medium",
    border: "border-l-amber-500",
    pill: "bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/20",
    bar: "bg-amber-500",
    pct: "55%",
    ring: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  low: {
    labelKey: "severity_low",
    border: "border-l-yellow-400",
    pill: "bg-yellow-400/10 text-yellow-600 dark:text-yellow-400 ring-1 ring-yellow-400/20",
    bar: "bg-yellow-400",
    pct: "28%",
    ring: "bg-yellow-400/10 text-yellow-600 dark:text-yellow-400",
  },
};

const ISSUE_ICONS: Record<string, LucideIcon[]> = {
  usa: [ShieldAlert, CloudRain, Gauge],
  korea: [Wrench, Gauge, Droplets],
  canada: [Scale, CloudRain, ShieldAlert],
};

const INCLUDED_ICONS: Record<string, LucideIcon[]> = {
  usa: [Gavel, Flame, Car, Scale, Gauge, ShieldCheck],
  korea: [Gavel, ClipboardList, Gauge, FileSearch, ShieldCheck, Wrench],
  canada: [ClipboardList, FileSearch, Gavel, Scale, Gauge, ShieldCheck],
};

function splitIssue(text: string): { title: string; detail?: string } {
  const parts = text.split(" — ");
  if (parts.length >= 2) {
    return { title: parts[0].trim(), detail: parts.slice(1).join(" — ").trim() };
  }
  return { title: text };
}

type Props = {
  slug: "usa" | "korea" | "canada";
  issues: string[];
  included: string[];
  severities: Severity[];
};

export function CountryRisksIncludedSection({ slug, issues, included, severities }: Props) {
  const { t } = useTranslation();
  const issueIcons = ISSUE_ICONS[slug] ?? [];
  const includedIcons = INCLUDED_ICONS[slug] ?? [];

  return (
    <section className="py-20 md:py-28 px-4 bg-muted/25 dark:bg-white/[0.015] border-y relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_50%_at_0%_50%,hsl(var(--primary)/0.06),transparent)]" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_50%_40%_at_100%_80%,rgba(249,115,22,0.05),transparent)]" />

      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
        {/* ── Common issues ── */}
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-3 text-center lg:text-start"
          >
            <div className="flex justify-center lg:justify-start">
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 dark:border-orange-800/50 bg-orange-50 dark:bg-orange-950/25 px-3.5 py-1 text-xs font-semibold text-orange-600 dark:text-orange-400">
              <AlertTriangle className="h-3 w-3" />
              {t("country_badge_risk_analysis")}
            </div>
            </div>
            <h2 className="text-3xl md:text-[2rem] font-extrabold tracking-tight leading-tight">
              {t("country_common_issues")}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto lg:mx-0">
              {t(`country_${slug}_issues_sub`)}
            </p>
          </motion.div>

          <div className="space-y-3">
            {issues.map((issue, i) => {
              const sev = severities[i] ?? "medium";
              const cfg = SEV[sev];
              const Icon = issueIcons[i] ?? AlertTriangle;
              const { title, detail } = splitIssue(issue);

              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.38, delay: i * 0.07 }}
                  whileHover={{ y: -2, transition: { duration: 0.15 } }}
                  className={cn(
                    "group relative rounded-2xl border border-l-4 bg-background p-4 sm:p-5 shadow-sm",
                    "hover:shadow-md hover:border-primary/15 transition-all duration-200",
                    cfg.border,
                  )}
                >
                  <div className="flex gap-4">
                    <div className={cn(
                      "h-11 w-11 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105",
                      cfg.ring,
                    )}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-semibold leading-snug text-foreground">{title}</p>
                        <span className={cn("text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 whitespace-nowrap", cfg.pill)}>
                          {t(cfg.labelKey)}
                        </span>
                      </div>
                      {detail && (
                        <p className="text-xs text-muted-foreground leading-relaxed">{detail}</p>
                      )}
                      <div className="flex items-center gap-2 pt-0.5">
                        <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
                          <motion.div
                            className={cn("h-full rounded-full", cfg.bar)}
                            initial={{ width: "0%" }}
                            whileInView={{ width: cfg.pct }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.85, delay: i * 0.1 + 0.15, ease: "easeOut" }}
                          />
                        </div>
                        <span className="text-[10px] font-mono text-muted-foreground tabular-nums w-8 text-right">
                          {cfg.pct}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* ── What's included ── */}
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-3 text-center lg:text-start"
          >
            <div className="flex justify-center lg:justify-start">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3.5 py-1 text-xs font-semibold text-primary">
              <CheckCircle2 className="h-3 w-3" />
              {t("country_badge_report_contents")}
            </div>
            </div>
            <h2 className="text-3xl md:text-[2rem] font-extrabold tracking-tight leading-tight">
              {t("country_whats_included")}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto lg:mx-0">
              {t(`country_${slug}_included_sub`)}
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-3">
            {included.map((item, i) => {
              const Icon = includedIcons[i] ?? CheckCircle2;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.32, delay: i * 0.06 }}
                  whileHover={{ y: -3, transition: { duration: 0.15 } }}
                  className="group flex gap-3 rounded-2xl border bg-background p-4 shadow-sm hover:shadow-md hover:border-primary/25 transition-all duration-200"
                >
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
                    <Icon className="h-[18px] w-[18px] text-primary" />
                  </div>
                  <div className="min-w-0 flex flex-col justify-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary/70 mb-0.5">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-sm font-medium leading-snug">{item}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl border border-primary/20 bg-primary/[0.04] px-5 py-4 flex items-start gap-3"
          >
            <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t(`country_${slug}_included_note`)}
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
