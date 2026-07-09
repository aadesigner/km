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
  market?: "default" | "home" | "usa" | "korea" | "canada";
};

/** Tailwind must see full class strings at build time — no runtime template literals. */
const COMPARE_GRID_COLS: Record<number, string> = {
  /** feature + kmcheck + 2 competitors (home, korea/default) */
  3: "grid-cols-[minmax(10.5rem,2fr)_repeat(3,minmax(5rem,1fr))]",
  /** feature + kmcheck + 3 competitors (usa, canada) */
  4: "grid-cols-[minmax(10.5rem,2fr)_repeat(4,minmax(5rem,1fr))]",
};

function compareGridCols(competitorCount: number): string {
  const dataCols = competitorCount + 1; // kmcheck + competitors
  return COMPARE_GRID_COLS[dataCols] ?? COMPARE_GRID_COLS[3];
}

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
          "inline-flex h-7 w-7 items-center justify-center rounded-full shrink-0",
          variant === "kmcheck" ? "bg-primary/15 text-primary" : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
        )}
      >
        <Check className="h-3.5 w-3.5 stroke-[2.5]" />
      </span>
    );
  }

  if (value === false) {
    return (
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full shrink-0 bg-red-500/8 text-red-400/70 dark:text-red-400/55">
        <X className="h-3.5 w-3.5 stroke-[2.5]" />
      </span>
    );
  }

  if (value == null || value === "") {
    return <Minus className="h-3.5 w-3.5 text-muted-foreground/25 shrink-0" aria-hidden />;
  }

  return (
    <span
      className={cn(
        "text-[11px] font-semibold leading-tight text-center px-0.5",
        variant === "kmcheck" ? "text-primary" : "text-muted-foreground",
      )}
    >
      {value}
    </span>
  );
}

function featureCellClass(even: boolean, highlight?: boolean) {
  return cn(
    "px-3.5 py-3.5 flex items-center gap-1.5 text-sm border-r border-border/35",
    even ? "bg-background" : "bg-muted/40 dark:bg-[#0c1210]",
    highlight ? "font-semibold text-foreground border-l-2 border-l-primary/50" : "text-muted-foreground",
  );
}

export function CompareTable({ market = "default" }: Props) {
  const { t, language } = useTranslation();
  const { displayPrice, loading: priceLoading, fmtPrice } = useDisplayPrice();

  const partial = t("compare_partial");

  const homeRows: CompareRow[] = [
    { labelKey: "compare_row_price", special: "price", values: [null, "€39.99", "€29.99"] },
    { labelKey: "compare_row_korean", highlight: true, badgeKey: "compare_row_only_us", values: [true, false, false] },
    { labelKey: "compare_row_canadian", highlight: true, badgeKey: "compare_row_only_us", values: [true, partial, false] },
    { labelKey: "compare_row_us", values: [true, true, true] },
    { labelKey: "compare_row_mileage", values: [true, true, true] },
    { labelKey: "compare_row_accident", values: [true, true, true] },
    { labelKey: "compare_row_salvage", values: [true, true, true] },
    { labelKey: "compare_row_theft", values: [true, "US/CA", "US only"] },
    { labelKey: "compare_row_ownership", values: [true, true, true] },
  ];

  const koreaRows: CompareRow[] = [
    { labelKey: "compare_row_price", special: "price", values: [null, "€39.99", "€25.99"] },
    { labelKey: "compare_row_korean", highlight: true, badgeKey: "compare_row_only_us", values: [true, false, false] },
    { labelKey: "compare_row_canadian", highlight: true, badgeKey: "compare_row_only_us", values: [true, partial, false] },
    { labelKey: "compare_row_us", values: [true, true, partial] },
    { labelKey: "compare_row_mileage", values: [true, true, true] },
    { labelKey: "compare_row_accident", values: [true, true, true] },
    { labelKey: "compare_row_salvage", values: [true, true, true] },
    { labelKey: "compare_row_theft", values: [true, "US/CA", "EU only"] },
    { labelKey: "compare_row_ownership", values: [true, true, true] },
  ];

  const usaRows: CompareRow[] = [
    { labelKey: "compare_row_price", special: "price", values: [null, "€39.99", "€25.99", "€29.99"] },
    { labelKey: "compare_row_us", highlight: true, badgeKey: "compare_row_us_focus", values: [true, true, partial, true] },
    { labelKey: "compare_row_korean", highlight: true, badgeKey: "compare_row_only_us", values: [true, false, false, false] },
    { labelKey: "compare_row_canadian", highlight: true, badgeKey: "compare_row_only_us", values: [true, true, false, false] },
    { labelKey: "compare_row_auction", values: [true, true, partial, true] },
    { labelKey: "compare_row_mileage", values: [true, true, true, true] },
    { labelKey: "compare_row_accident", values: [true, true, true, true] },
    { labelKey: "compare_row_salvage", values: [true, true, true, true] },
    { labelKey: "compare_row_theft", values: [true, "US/CA", "EU only", "US only"] },
    { labelKey: "compare_row_ownership", values: [true, true, true, true] },
  ];

  const canadaRows: CompareRow[] = [
    { labelKey: "compare_row_price", special: "price", values: [null, "€39.99", "€25.99", "€29.99"] },
    { labelKey: "compare_row_canadian", highlight: true, badgeKey: "compare_row_us_focus", values: [true, true, partial, partial] },
    { labelKey: "compare_row_korean", highlight: true, badgeKey: "compare_row_only_us", values: [true, false, false, false] },
    { labelKey: "compare_row_us", values: [true, true, partial, true] },
    { labelKey: "compare_row_mileage", values: [true, true, true, true] },
    { labelKey: "compare_row_accident", values: [true, true, true, true] },
    { labelKey: "compare_row_salvage", values: [true, true, true, true] },
    { labelKey: "compare_row_theft", values: [true, "US/CA", "EU only", "US only"] },
    { labelKey: "compare_row_ownership", values: [true, true, true, true] },
  ];

  const rows =
    market === "usa"
      ? usaRows
      : market === "canada"
        ? canadaRows
        : market === "home"
          ? homeRows
          : koreaRows;

  const descKey = market === "usa"
    ? "compare_desc_usa"
    : market === "korea"
      ? "compare_desc_korea"
      : market === "canada"
        ? "compare_desc_canada"
        : "compare_desc";

  const competitors =
    market === "usa" || market === "canada"
      ? [
          { name: "Carfax", subKey: "compare_comp_carfax" },
          { name: "CarVertical", subKey: "compare_comp_carvertical" },
          { name: "AutoCheck", subKey: "compare_comp_autocheck" },
        ]
      : market === "home"
        ? [
            { name: "Carfax", subKey: "compare_comp_carfax" },
            { name: "AutoCheck", subKey: "compare_comp_autocheck" },
          ]
        : [
            { name: "Carfax", subKey: "compare_comp_carfax" },
            { name: "CarVertical", subKey: "compare_comp_carvertical" },
          ];

  const gridCols = compareGridCols(competitors.length);

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
          <div className="overflow-x-auto overscroll-x-contain -mx-4 px-4 md:mx-0 md:px-0 [webkit-overflow-scrolling:touch]">
            <div
              className={cn(
                "w-max min-w-full md:w-full rounded-2xl md:rounded-3xl overflow-hidden",
                "border border-border/50 bg-background",
                "shadow-[0_20px_50px_-24px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_50px_-24px_rgba(0,0,0,0.5)]",
              )}
            >
              {/* Header */}
              <div className={cn("grid", gridCols)}>
                <div className="px-3.5 py-4 bg-muted/50 dark:bg-[#0e1411] border-r border-border/40 text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.14em] flex items-end">
                  {t("pricing_compare_feature")}
                </div>

                <div className="px-2 py-4 text-center flex flex-col items-center justify-center bg-gradient-to-b from-primary to-[hsl(158,72%,32%)] min-h-[4.5rem]">
                  <p className="text-white font-extrabold text-sm tracking-tight">kmcheck</p>
                  <p className="text-white/70 text-[10px] mt-0.5 font-medium leading-snug">{kmcheckSub}</p>
                </div>

                {competitors.map((c) => (
                  <div
                    key={c.name}
                    className="px-2 py-4 text-center bg-muted/30 dark:bg-[#0e1411] border-l border-border/35 flex flex-col items-center justify-center min-h-[4.5rem]"
                  >
                    <p className="font-bold text-sm text-foreground/75 tracking-tight">{c.name}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">{t(c.subKey)}</p>
                  </div>
                ))}
              </div>

              {/* Rows */}
              {rows.map((row, ri) => {
                const even = ri % 2 === 0;
                return (
                  <div
                    key={row.labelKey}
                    className={cn("grid border-t border-border/35", gridCols, even ? "bg-background" : "bg-muted/15 dark:bg-white/[0.015]")}
                  >
                    <div className={featureCellClass(even, row.highlight)}>
                      <span className="leading-snug min-w-0">{t(row.labelKey)}</span>
                      {row.badgeKey && (
                        <span className="bg-primary/10 text-primary text-[8px] font-bold px-1.5 py-0.5 rounded-full tracking-wide uppercase shrink-0">
                          {t(row.badgeKey)}
                        </span>
                      )}
                    </div>

                    <div className="px-2 py-3.5 flex items-center justify-center bg-primary/[0.08] dark:bg-primary/[0.12] border-x border-primary/15">
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
                );
              })}

              {/* CTA row */}
              <div className={cn("grid border-t border-border/40 bg-muted/25 dark:bg-white/[0.02]", gridCols)}>
                <div className="px-3.5 py-4 text-sm font-medium text-muted-foreground border-r border-border/35 bg-muted/40 dark:bg-[#0e1411]">
                  {t("compare_cta_label")}
                </div>
                <div className="px-2 py-4 flex items-center justify-center bg-primary/[0.08] dark:bg-primary/[0.12] border-x border-primary/15">
                  <Button
                    asChild
                    size="sm"
                    className="h-9 px-5 text-xs font-bold rounded-xl shadow-md shadow-primary/20 whitespace-nowrap"
                  >
                    <Link href={`/${language}/pricing`}>{t("get_started")}</Link>
                  </Button>
                </div>
                {competitors.map((_, vi) => (
                  <div key={vi} className="py-4 flex items-center justify-center border-l border-border/30">
                    <span className="text-muted-foreground/20 text-base select-none" aria-hidden>—</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground/55 text-center mt-5 max-w-2xl mx-auto leading-relaxed">
            {t(
              market === "home"
                ? "compare_disclaimer_home"
                : market === "usa" || market === "canada"
                  ? "compare_disclaimer_usa"
                  : "compare_disclaimer",
            )}
          </p>
        </motion.div>
      </div>
    </section>
  );
}
