import { useTranslation } from "@/i18n/context";
import { useDisplayPrice } from "@/hooks/use-display-price";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Check, Minus, X } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type CompareRow = {
  labelKey: string;
  special?: "price";
  highlight?: boolean;
  badgeKey?: string;
  values: (boolean | string | null)[];
};

type Props = {
  market?: "default" | "usa" | "korea" | "canada";
};

const GRID_COLS = "grid-cols-[minmax(9.5rem,2fr)_minmax(4.5rem,1fr)_minmax(4.5rem,1fr)_minmax(4.5rem,1fr)_minmax(4.5rem,1fr)]";

function CompareCell({
  value,
  variant = "default",
  isPrice,
  priceLabel,
}: {
  value: boolean | string | null;
  variant?: "kmcheck" | "default";
  isPrice?: boolean;
  priceLabel?: string;
}) {
  if (isPrice) {
    return (
      <span
        className={cn(
          "text-sm font-bold tabular-nums",
          variant === "kmcheck" ? "text-primary" : "text-foreground/80",
        )}
      >
        {priceLabel ?? "…"}
      </span>
    );
  }

  if (value === true) {
    return (
      <span
        className={cn(
          "inline-flex h-7 w-7 items-center justify-center rounded-full",
          variant === "kmcheck" ? "bg-primary/15 text-primary" : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
        )}
      >
        <Check className="h-3.5 w-3.5 stroke-[2.5]" />
      </span>
    );
  }

  if (value === false) {
    return (
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-red-500/8 text-red-400/70 dark:text-red-400/55">
        <X className="h-3.5 w-3.5 stroke-[2.5]" />
      </span>
    );
  }

  if (value == null || value === "") {
    return <Minus className="h-3.5 w-3.5 text-muted-foreground/25" aria-hidden />;
  }

  return (
    <span
      className={cn(
        "text-[11px] font-semibold leading-tight text-center px-1",
        variant === "kmcheck" ? "text-primary" : "text-muted-foreground",
      )}
    >
      {value}
    </span>
  );
}

export function CompareTable({ market = "default" }: Props) {
  const { t, language } = useTranslation();
  const { displayPrice, loading: priceLoading, fmtPrice } = useDisplayPrice();

  const partial = t("compare_partial");

  const koreaRows: CompareRow[] = [
    { labelKey: "compare_row_price", special: "price", values: [null, "€39.99", "€26.99", "€29.99"] },
    { labelKey: "compare_row_korean", highlight: true, badgeKey: "compare_row_only_us", values: [true, false, false, false] },
    { labelKey: "compare_row_canadian", highlight: true, badgeKey: "compare_row_only_us", values: [true, partial, false, false] },
    { labelKey: "compare_row_us", values: [true, true, partial, true] },
    { labelKey: "compare_row_mileage", values: [true, true, true, true] },
    { labelKey: "compare_row_accident", values: [true, true, true, true] },
    { labelKey: "compare_row_salvage", values: [true, true, true, partial] },
    { labelKey: "compare_row_theft", values: [true, "US/CA", "EU only", "US/CA"] },
    { labelKey: "compare_row_ownership", values: [true, true, true, partial] },
  ];

  const usaRows: CompareRow[] = [
    { labelKey: "compare_row_price", special: "price", values: [null, "€39.99", "€29.99", "~$10.00"] },
    { labelKey: "compare_row_us", highlight: true, badgeKey: "compare_row_us_focus", values: [true, true, true, partial] },
    { labelKey: "compare_row_korean", highlight: true, badgeKey: "compare_row_only_us", values: [true, false, false, false] },
    { labelKey: "compare_row_canadian", highlight: true, badgeKey: "compare_row_only_us", values: [true, true, false, false] },
    { labelKey: "compare_row_auction", values: [true, true, true, partial] },
    { labelKey: "compare_row_mileage", values: [true, true, true, partial] },
    { labelKey: "compare_row_accident", values: [true, true, true, true] },
    { labelKey: "compare_row_salvage", values: [true, true, true, partial] },
    { labelKey: "compare_row_theft", values: [true, "US/CA", "US/CA", "US only"] },
    { labelKey: "compare_row_ownership", values: [true, true, true, partial] },
  ];

  const canadaRows: CompareRow[] = [
    { labelKey: "compare_row_price", special: "price", values: [null, "€39.99", "€29.99", "~$10.00"] },
    { labelKey: "compare_row_canadian", highlight: true, badgeKey: "compare_row_us_focus", values: [true, true, true, partial] },
    { labelKey: "compare_row_korean", highlight: true, badgeKey: "compare_row_only_us", values: [true, false, false, false] },
    { labelKey: "compare_row_us", values: [true, true, partial, true] },
    { labelKey: "compare_row_mileage", values: [true, true, true, partial] },
    { labelKey: "compare_row_accident", values: [true, true, true, true] },
    { labelKey: "compare_row_salvage", values: [true, true, true, partial] },
    { labelKey: "compare_row_theft", values: [true, "US/CA", "US/CA", "US only"] },
    { labelKey: "compare_row_ownership", values: [true, true, true, partial] },
  ];

  const rows = market === "usa" ? usaRows : market === "canada" ? canadaRows : koreaRows;

  const descKey = market === "usa"
    ? "compare_desc_usa"
    : market === "korea"
      ? "compare_desc_korea"
      : market === "canada"
        ? "compare_desc_canada"
        : "compare_desc";

  const competitors =
    market === "usa"
      ? [
          { name: "Carfax", subKey: "compare_comp_carfax" },
          { name: "AutoCheck", subKey: "compare_comp_autocheck" },
          { name: "VinAudit", subKey: "compare_comp_vinaudit" },
        ]
      : [
          { name: "Carfax", subKey: "compare_comp_carfax" },
          { name: "CarVertical", subKey: "compare_comp_carvertical" },
          { name: "AutoCheck", subKey: "compare_comp_autocheck" },
        ];

  const kmcheckSub = t("compare_kmcheck_sub");
  const priceLabel = priceLoading || displayPrice == null ? "…" : fmtPrice(displayPrice);

  return (
    <section className="relative py-16 md:py-24 px-4 border-y overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-muted/35 via-background to-muted/20 dark:from-white/[0.03] dark:via-background dark:to-white/[0.02]" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,hsl(var(--primary)/0.08),transparent)] dark:bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,hsl(var(--primary)/0.14),transparent)]" />

      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10 md:mb-12 space-y-3"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
            {t("compare_badge")}
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">{t("compare_title")}</h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm md:text-base leading-relaxed">
            {t(descKey)}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.08 }}
        >
          <div className="-mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto pb-1 snap-x snap-mandatory [scrollbar-width:thin]">
            <div
              className={cn(
                "min-w-[640px] snap-center rounded-3xl overflow-hidden",
                "border border-border/50 bg-background/90 backdrop-blur-sm",
                "shadow-[0_24px_64px_-28px_rgba(0,0,0,0.18)] dark:shadow-[0_24px_64px_-28px_rgba(0,0,0,0.55)]",
                "ring-1 ring-black/[0.03] dark:ring-white/[0.06]",
              )}
            >
              {/* Header */}
              <div className={cn("grid", GRID_COLS)}>
                <div className="sticky left-0 z-20 px-4 py-4 bg-muted/50 dark:bg-white/[0.04] backdrop-blur-sm border-r border-border/40 text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.16em] flex items-end">
                  {t("pricing_compare_feature")}
                </div>

                <div className="relative z-10 px-2 py-4 text-center flex flex-col items-center justify-end bg-gradient-to-b from-primary to-[hsl(158,72%,32%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 rounded-b-lg bg-white/95 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-primary shadow-sm">
                    {t("compare_best_value")}
                  </span>
                  <p className="text-white font-extrabold text-sm tracking-tight mt-3">kmcheck</p>
                  <p className="text-white/70 text-[10px] mt-0.5 font-medium">{kmcheckSub}</p>
                </div>

                {competitors.map((c) => (
                  <div
                    key={c.name}
                    className="px-2 py-4 text-center bg-muted/30 dark:bg-white/[0.025] border-l border-border/35 flex flex-col items-center justify-end"
                  >
                    <p className="font-bold text-sm text-foreground/70 tracking-tight">{c.name}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">{t(c.subKey)}</p>
                  </div>
                ))}
              </div>

              {/* Rows */}
              {rows.map((row, ri) => (
                <div
                  key={row.labelKey}
                  className={cn(
                    "grid border-t border-border/35 transition-colors",
                    GRID_COLS,
                    ri % 2 === 0 ? "bg-background" : "bg-muted/15 dark:bg-white/[0.015]",
                    "hover:bg-muted/25 dark:hover:bg-white/[0.03]",
                  )}
                >
                  <div
                    className={cn(
                      "sticky left-0 z-20 px-4 py-3.5 flex items-center gap-2 text-sm border-r border-border/35 backdrop-blur-sm",
                      ri % 2 === 0 ? "bg-background/95" : "bg-muted/30 dark:bg-[#0a0f0d]/90",
                      row.highlight
                        ? "font-semibold text-foreground border-l-2 border-l-primary/50"
                        : "text-muted-foreground",
                    )}
                  >
                    <span className="leading-snug">{t(row.labelKey)}</span>
                    {row.badgeKey && (
                      <span className="bg-primary/10 text-primary text-[8px] font-bold px-1.5 py-0.5 rounded-full tracking-wide uppercase shrink-0">
                        {t(row.badgeKey)}
                      </span>
                    )}
                  </div>

                  <div className="relative px-2 py-3.5 flex items-center justify-center bg-primary/[0.07] dark:bg-primary/[0.12] border-x border-primary/15">
                    <CompareCell
                      value={row.values[0]}
                      variant="kmcheck"
                      isPrice={row.special === "price"}
                      priceLabel={priceLabel}
                    />
                  </div>

                  {row.values.slice(1).map((val, vi) => (
                    <div
                      key={vi}
                      className="px-2 py-3.5 flex items-center justify-center border-l border-border/30"
                    >
                      <CompareCell value={val} />
                    </div>
                  ))}
                </div>
              ))}

              {/* CTA row */}
              <div className={cn("grid border-t border-border/40 bg-muted/25 dark:bg-white/[0.02]", GRID_COLS)}>
                <div className="sticky left-0 z-20 px-4 py-4 text-sm font-medium text-muted-foreground border-r border-border/35 bg-muted/40 dark:bg-white/[0.03] backdrop-blur-sm">
                  {t("compare_cta_label")}
                </div>
                <div className="px-2 py-4 flex items-center justify-center bg-primary/[0.08] dark:bg-primary/[0.12] border-x border-primary/15">
                  <Button
                    asChild
                    size="sm"
                    className="h-9 px-5 text-xs font-bold rounded-xl shadow-md shadow-primary/20"
                  >
                    <Link href={`/${language}/pricing`}>{t("get_started")}</Link>
                  </Button>
                </div>
                {[0, 1, 2].map((vi) => (
                  <div key={vi} className="py-4 flex items-center justify-center border-l border-border/30">
                    <span className="text-muted-foreground/20 text-base select-none" aria-hidden>—</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground/55 text-center mt-5 max-w-2xl mx-auto leading-relaxed">
            {t(market === "usa" || market === "canada" ? "compare_disclaimer_usa" : "compare_disclaimer")}
          </p>
        </motion.div>
      </div>
    </section>
  );
}
