import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  ShieldCheck, CheckCircle2, AlertTriangle, Gauge, BarChart3, Lock,
  FileText, ChevronRight, Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTranslation } from "@/i18n/context";
import { useDisplayPrice } from "@/hooks/use-display-price";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

function useReportItems(t: (k: string) => string) {
  return [
    { icon: Gauge, label: t("report_mileage"), color: "text-orange-500", bg: "bg-orange-500/10" },
    { icon: AlertTriangle, label: t("report_accidents"), color: "text-red-500", bg: "bg-red-500/10" },
    { icon: ShieldCheck, label: t("report_salvage"), color: "text-amber-500", bg: "bg-amber-500/10" },
    { icon: Lock, label: t("report_theft"), color: "text-purple-500", bg: "bg-purple-500/10" },
    { icon: FileText, label: t("report_ownership"), color: "text-blue-500", bg: "bg-blue-500/10" },
    { icon: BarChart3, label: t("report_specs"), color: "text-primary", bg: "bg-primary/10" },
  ] satisfies Array<{ icon: LucideIcon; label: string; color: string; bg: string }>;
}

type Props = {
  className?: string;
};

export function VinCheckIncludesSection({ className }: Props) {
  const { t, language } = useTranslation();
  const { displayPrice, basePrice: pricingBase, isDiscount, loading: priceLoading, fmtPrice } = useDisplayPrice();
  const reportItems = useReportItems(t);

  return (
    <section className={cn(
      "relative overflow-hidden bg-muted/30 dark:bg-white/[0.02] border-y py-16 md:py-24 px-4",
      className,
    )}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,hsl(var(--primary)/0.05),transparent_55%)]" />
      <div className="max-w-5xl mx-auto relative">
        <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-7"
          >
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3.5 py-1 text-xs font-semibold text-primary mb-4">
                Full report details
              </div>
              <h2 className="text-3xl md:text-4xl font-bold">{t("sample_report_title")}</h2>
              <p className="text-muted-foreground text-base leading-relaxed mt-3">{t("sample_report_desc")}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {reportItems.map(({ icon: Icon, label, color, bg }, i) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                  className="flex items-center gap-3 px-4 py-3.5 rounded-xl border bg-background hover:border-primary/25 hover:shadow-sm transition-all group"
                >
                  <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${bg} group-hover:scale-110 transition-transform`}>
                    <Icon className={`h-[18px] w-[18px] ${color}`} />
                  </div>
                  <span className="text-sm font-medium flex-1">{label}</span>
                  <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                </motion.div>
              ))}
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <Button asChild size="lg" className="shadow-lg shadow-primary/20">
                <Link href={`/${language}/pricing`}>{t("get_started")}</Link>
              </Button>
              <div className="flex items-center gap-2">
                {priceLoading ? (
                  <Skeleton className="h-7 w-16 rounded" />
                ) : (
                  <span className="text-2xl font-extrabold text-primary">
                    {displayPrice != null ? fmtPrice(displayPrice) : "—"}
                  </span>
                )}
                {!priceLoading && isDiscount && (
                  <>
                    <span className="text-sm line-through text-muted-foreground">
                      {pricingBase != null ? fmtPrice(pricingBase) : null}
                    </span>
                    <Badge className="bg-orange-500 text-white border-0 text-xs">{t("limited_time")}</Badge>
                  </>
                )}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="absolute -inset-4 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent rounded-3xl blur-2xl -z-10" />
            <div className="rounded-2xl border-2 border-border bg-background shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-br from-[hsl(38,92%,42%)] via-amber-600 to-[hsl(32,90%,38%)] px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="text-primary-foreground/60 text-[10px] font-mono tracking-widest">VIN: KNDPM3AC9K7583241</p>
                  <p className="text-primary-foreground font-bold text-base">2019 Kia Sportage</p>
                  <p className="text-primary-foreground/50 text-[10px] mt-0.5">encar.com</p>
                </div>
                <div className="bg-white/20 rounded-xl px-3 py-1.5 border border-white/25">
                  <p className="text-white text-xs font-bold">{t("report_caution")}</p>
                </div>
              </div>
              <div className="px-5 py-3 bg-amber-50 dark:bg-amber-950/40 border-b flex items-center justify-between">
                <span className="text-sm font-medium text-amber-800 dark:text-amber-400">{t("mock_label_score")}</span>
                <span className="text-2xl font-black text-amber-600 dark:text-amber-400">6.4/10</span>
              </div>
              <div className="p-5 space-y-3">
                <div className="py-2 border-b space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{t("mock_label_mileage")}</span>
                    <div className="flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                      <span className="text-sm font-medium text-amber-700 dark:text-amber-400">138,600 km</span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      className="h-1.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500"
                      initial={{ width: "0%" }}
                      whileInView={{ width: "43%" }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.2, delay: 0.4, ease: "easeOut" }}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between py-2 border-b bg-amber-50/60 dark:bg-amber-950/20 -mx-5 px-5">
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                    <span className="text-sm text-muted-foreground">{t("mock_label_accidents")}</span>
                  </div>
                  <span className="text-sm font-semibold text-amber-600">2 {t("demo_found")} ⚠</span>
                </div>
                {[
                  { label: t("mock_label_salvage"), value: t("mock_value_salvage"), warn: false },
                  { label: t("mock_label_stolen"), value: t("mock_value_stolen"), warn: false },
                  { label: t("mock_label_owners"), value: `3 ${t("mock_label_owners")}`, warn: true },
                ].map(({ label, value, warn }) => (
                  <div key={label} className="flex items-center justify-between py-2 border-b last:border-0">
                    <span className="text-sm text-muted-foreground">{label}</span>
                    <div className="flex items-center gap-1.5">
                      {warn ? (
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                      ) : (
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                      )}
                      <span className={cn("text-sm font-medium", warn && "text-amber-600")}>{value}</span>
                    </div>
                  </div>
                ))}
                <Button asChild variant="outline" size="sm" className="w-full mt-1 gap-1.5">
                  <Link href={`/${language}/pricing`}>
                    {t("see_whats_included")}
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            </div>
            <div className="absolute -top-4 -right-4 rounded-2xl border bg-background shadow-lg px-3.5 py-2 text-xs font-semibold text-primary flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5" />
              {t("instant_report")}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
