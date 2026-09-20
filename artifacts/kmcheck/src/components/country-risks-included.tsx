import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n/context";

type Severity = "high" | "medium" | "low";

const SEV: Record<Severity, { labelKey: string; bar: string; text: string; wash: string }> = {
  high: {
    labelKey: "severity_high",
    bar: "bg-red-500",
    text: "text-red-600 dark:text-red-400",
    wash: "bg-red-500/[0.08]",
  },
  medium: {
    labelKey: "severity_medium",
    bar: "bg-amber-500",
    text: "text-amber-600 dark:text-amber-400",
    wash: "bg-amber-500/[0.08]",
  },
  low: {
    labelKey: "severity_low",
    bar: "bg-yellow-500",
    text: "text-yellow-600 dark:text-yellow-400",
    wash: "bg-yellow-500/[0.08]",
  },
};

function splitIssue(text: string): { title: string; detail?: string } {
  const parts = text.split(" — ");
  if (parts.length >= 2) {
    return { title: parts[0].trim(), detail: parts.slice(1).join(" — ").trim() };
  }
  return { title: text };
}

type Props = {
  slug: "usa" | "korea" | "canada" | "china" | "japan" | "uae";
  issues: string[];
  included: string[];
  severities: Severity[];
};

function PanelHeader({
  title,
  subtitle,
  accent,
}: {
  title: string;
  subtitle: string;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "px-4 sm:px-5 py-3.5 border-b border-border/60 min-h-[4.75rem] flex flex-col justify-center",
        accent && "bg-primary/[0.04]",
      )}
    >
      <h2 className="text-base sm:text-lg font-bold tracking-tight leading-tight">{title}</h2>
      <p className="mt-1 text-[11px] sm:text-xs text-muted-foreground leading-snug line-clamp-2">
        {subtitle}
      </p>
    </div>
  );
}

export function CountryRisksIncludedSection({ slug, issues, included, severities }: Props) {
  const { t } = useTranslation();

  return (
    <section className="relative border-y border-border/60 bg-muted/15 dark:bg-white/[0.015] py-10 md:py-12 px-4">
      <div className="relative max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5 items-stretch">
        {/* Risks */}
        <div className="h-full rounded-xl border border-border/70 bg-background shadow-[0_1px_0_hsl(var(--border)/0.4)] overflow-hidden flex flex-col">
          <PanelHeader
            title={t("country_common_issues")}
            subtitle={t(`country_${slug}_issues_sub`)}
          />

          <ul className="flex-1 flex flex-col min-h-0">
            {issues.map((issue, i) => {
              const sev = severities[i] ?? "medium";
              const cfg = SEV[sev];
              const { title, detail } = splitIssue(issue);
              const isLast = i === issues.length - 1;

              return (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.25, delay: i * 0.04 }}
                  className={cn(
                    "relative flex-1 flex items-center gap-3 px-4 sm:px-5 py-3 min-h-[4.25rem]",
                    !isLast && "border-b border-border/55",
                  )}
                >
                  <span aria-hidden className={cn("absolute inset-y-0 left-0 w-[3px]", cfg.bar)} />
                  <div
                    className={cn(
                      "h-8 w-8 shrink-0 rounded-lg flex items-center justify-center ring-1 ring-inset",
                      cfg.wash,
                      sev === "high"
                        ? "ring-red-500/20"
                        : sev === "medium"
                          ? "ring-amber-500/20"
                          : "ring-yellow-500/20",
                    )}
                  >
                    <span className={cn("font-mono text-[11px] font-bold tabular-nums", cfg.text)}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold leading-snug">{title}</p>
                      <span className={cn("shrink-0 text-[9px] font-semibold uppercase tracking-wider pt-0.5", cfg.text)}>
                        {t(cfg.labelKey)}
                      </span>
                    </div>
                    {detail ? (
                      <p className="mt-0.5 text-xs text-muted-foreground leading-snug line-clamp-1 sm:line-clamp-2">
                        {detail}
                      </p>
                    ) : null}
                  </div>
                </motion.li>
              );
            })}
          </ul>
        </div>

        {/* Included */}
        <div className="h-full rounded-xl border border-border/70 bg-background shadow-[0_1px_0_hsl(var(--border)/0.4)] overflow-hidden flex flex-col">
          <PanelHeader
            title={t("country_whats_included")}
            subtitle={t(`country_${slug}_included_sub`)}
            accent
          />

          <ol className="flex-1 flex flex-col min-h-0 px-1">
            {included.map((item, i) => {
              const isLast = i === included.length - 1;
              return (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, y: 4 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.2, delay: 0.03 + i * 0.03 }}
                  className={cn(
                    "flex-1 flex items-center gap-2.5 px-3 sm:px-4 py-2 min-h-0",
                    !isLast && "border-b border-dashed border-border/45",
                  )}
                >
                  <span className="font-mono text-[10px] tabular-nums text-primary w-5 shrink-0">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-[13px] sm:text-sm leading-snug text-foreground/90">{item}</span>
                </motion.li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
