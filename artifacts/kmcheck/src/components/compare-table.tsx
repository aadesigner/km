import { useTranslation } from "@/i18n/context";
import { useDisplayPrice } from "@/hooks/use-display-price";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Check, X } from "lucide-react";
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

  return (
    <section className="py-16 md:py-24 px-4 bg-muted/25 dark:bg-white/[0.02] border-y">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12 space-y-3"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3.5 py-1 text-xs font-semibold text-primary">
            {t("compare_badge")}
          </div>
          <h2 className="text-3xl md:text-4xl font-bold">{t("compare_title")}</h2>
          <p className="text-muted-foreground max-w-lg mx-auto text-sm md:text-base">
            {t(descKey)}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
        >
          <div className="overflow-x-auto pb-2">
            <div className="min-w-[640px] rounded-2xl overflow-hidden border border-border/60 shadow-sm">
              <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr]">
                <div className="p-4 bg-muted/40 dark:bg-white/[0.03] text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-end pb-4">
                  {t("pricing_compare_feature")}
                </div>

                <div className="bg-primary p-4 text-center relative flex flex-col items-center justify-end pb-4 shadow-[0_0_24px_rgba(34,197,94,0.25)]">
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-[9px] font-black px-2.5 py-0.5 rounded-b-lg tracking-wide whitespace-nowrap">
                    {t("compare_best_value")}
                  </span>
                  <p className="text-white font-black text-sm mt-3">kmcheck</p>
                  <p className="text-white/65 text-[10px] mt-0.5">{kmcheckSub}</p>
                </div>

                {competitors.map(c => (
                  <div key={c.name} className="p-4 text-center bg-muted/40 dark:bg-white/[0.03] border-l border-border/40 flex flex-col items-center justify-end pb-4">
                    <p className="font-bold text-sm text-foreground/75">{c.name}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{t(c.subKey)}</p>
                  </div>
                ))}
              </div>

              {rows.map((row, ri) => (
                <div
                  key={row.labelKey}
                  className={`grid grid-cols-[2fr_1fr_1fr_1fr_1fr] border-t border-border/40 ${ri % 2 !== 0 ? "bg-muted/20 dark:bg-white/[0.012]" : "bg-background"}`}
                >
                  <div className={cn(
                    "px-5 py-3.5 flex items-center gap-2 text-sm border-r border-border/30",
                    row.highlight ? "font-semibold" : "text-muted-foreground",
                  )}>
                    {t(row.labelKey)}
                    {row.badgeKey && (
                      <span className="bg-primary/15 text-primary text-[9px] font-black px-1.5 py-0.5 rounded-full tracking-wide uppercase shrink-0">
                        {t(row.badgeKey)}
                      </span>
                    )}
                  </div>

                  <div className="bg-primary/10 dark:bg-primary/[0.15] border-x border-primary/20 py-3.5 flex items-center justify-center">
                    {row.special === "price" ? (
                      <span className="text-primary font-black text-sm tabular-nums">
                        {priceLoading || displayPrice == null ? "…" : fmtPrice(displayPrice)}
                      </span>
                    ) : row.values[0] === true ? (
                      <Check className="h-[18px] w-[18px] text-primary" />
                    ) : row.values[0] === false ? (
                      <X className="h-4 w-4 text-red-400/60" />
                    ) : (
                      <span className="text-xs text-primary font-semibold">{row.values[0]}</span>
                    )}
                  </div>

                  {row.values.slice(1).map((val, vi) => (
                    <div key={vi} className="py-3.5 flex items-center justify-center border-l border-border/30">
                      {val === true ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : val === false ? (
                        <X className="h-4 w-4 text-red-400/60" />
                      ) : (
                        <span className="text-[11px] text-muted-foreground font-medium">{val}</span>
                      )}
                    </div>
                  ))}
                </div>
              ))}

              <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] border-t border-border/40 bg-muted/30 dark:bg-white/[0.015]">
                <div className="px-5 py-4 text-sm text-muted-foreground">{t("compare_cta_label")}</div>
                <div className="bg-primary/10 dark:bg-primary/[0.15] border-x border-primary/20 py-4 flex items-center justify-center">
                  <Button asChild size="sm" className="h-8 px-4 text-xs font-bold">
                    <Link href={`/${language}/pricing`}>{t("get_started")}</Link>
                  </Button>
                </div>
                {[0, 1, 2].map(vi => (
                  <div key={vi} className="py-4 flex items-center justify-center border-l border-border/30">
                    <span className="text-muted-foreground/25 text-base">—</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground/50 text-center mt-4 max-w-xl mx-auto">
            {t(market === "usa" || market === "canada" ? "compare_disclaimer_usa" : "compare_disclaimer")}
          </p>
        </motion.div>
      </div>
    </section>
  );
}
