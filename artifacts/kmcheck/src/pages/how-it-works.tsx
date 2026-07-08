import { useState, useMemo, type FormEvent } from "react";
import { useTranslation } from "@/i18n/context";
import { useLocation, Link } from "wouter";
import { motion, type Variants } from "framer-motion";
import { SEOHead, usePageSeo } from "@/components/seo";
import { Badge } from "@/components/ui/badge";
import { HeroVinForm } from "@/components/hero-vin-form";
import { useAuth } from "@/lib/auth-context";
import { redirectGuestForVinCheckout } from "@/lib/checkout-vin-flow";
import {
  Search, Database, FileText, Zap, RotateCcw, Globe2,
  ArrowRight, ShieldCheck, CheckCircle2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const VIN_EXAMPLE = "WAUZZZ8K9NA123456";
const DEMO_VEHICLE = "Audi A4 2022";

const VIN_SEGMENTS = [
  { chars: "WAU", tone: "bg-slate-600", labelKey: "vin_segment_country" },
  { chars: "ZZZ", tone: "bg-primary/85", labelKey: "vin_segment_maker" },
  { chars: "8K9", tone: "bg-emerald-600", labelKey: "vin_segment_model" },
  { chars: "N", tone: "bg-amber-500", labelKey: "vin_segment_check" },
  { chars: "A123456", tone: "bg-slate-700", labelKey: "vin_segment_serial" },
] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: "easeOut" },
  }),
} as unknown as Variants;

type Step = {
  num: string;
  label: string;
  title: string;
  desc: string;
  icon: LucideIcon;
};

function StepPreview({ step, vinLabel, t }: { step: number; vinLabel: string; t: (k: string) => string }) {
  const shell = "rounded-xl border border-border/60 bg-background/80 dark:border-white/10 dark:bg-black/25 overflow-hidden";

  if (step === 0) {
    return (
      <div className={cn(shell, "p-4 space-y-2")}>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground dark:text-white/45">{vinLabel}</p>
        <div className="flex items-center gap-2.5 rounded-lg border border-primary/30 bg-muted/50 dark:bg-black/30 px-3 py-2.5">
          <Search className="h-4 w-4 text-primary shrink-0" />
          <span className="font-mono text-xs sm:text-sm tracking-widest text-foreground dark:text-white">{VIN_EXAMPLE}</span>
        </div>
        <p className="text-xs text-muted-foreground dark:text-white/45">{DEMO_VEHICLE}</p>
      </div>
    );
  }

  if (step === 1) {
    const sources = [t("auction_history"), t("accident_history"), t("mileage_verification"), t("theft_records")];
    return (
      <div className={cn(shell, "p-4 space-y-3")}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Database className="h-4 w-4 text-primary shrink-0" />
            <span className="text-xs font-semibold text-foreground dark:text-white truncate">{t("hiw_trust_official")}</span>
          </div>
          <Badge className="shrink-0 text-[10px] bg-primary/15 text-primary border-primary/25 hover:bg-primary/15">
            {t("instant_report")}
          </Badge>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {sources.map((src) => (
            <div key={src} className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-muted/40 dark:border-white/10 dark:bg-black/30 px-2.5 py-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse shrink-0" />
              <span className="text-[11px] font-medium text-muted-foreground dark:text-white/65 leading-snug">{src}</span>
            </div>
          ))}
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between text-[11px] text-muted-foreground dark:text-white/45">
            <span>{t("hiw_mock_scanning")}</span>
            <span className="font-medium text-foreground dark:text-white/80">100%</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted dark:bg-white/10 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={{ width: "0%" }}
              whileInView={{ width: "100%" }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={shell}>
      <div className="bg-gradient-to-r from-primary to-emerald-600 px-4 py-3">
        <p className="text-[11px] font-mono text-white/75">{VIN_EXAMPLE}</p>
        <p className="text-base font-bold text-white mt-1">{DEMO_VEHICLE}</p>
      </div>
      <div className="p-3 space-y-1.5">
        {[
          { label: t("mileage"), val: "68,400 km" },
          { label: t("mock_label_accidents"), val: t("demo_none_found") },
          { label: t("mock_label_salvage"), val: t("report_clean") },
        ].map((row) => (
          <div key={row.label} className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/40 dark:border-white/10 dark:bg-black/30 px-3 py-2">
            <div className="flex items-center gap-2 min-w-0">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-500 dark:text-green-400 shrink-0" />
              <span className="text-xs text-muted-foreground dark:text-white/55 truncate">{row.label}</span>
            </div>
            <span className="text-xs font-semibold text-foreground dark:text-white shrink-0 ml-2">{row.val}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function HowItWorks() {
  const { t, language } = useTranslation();
  const [, setLocation] = useLocation();
  const { isSignedIn } = useAuth();
  const [vin, setVin] = useState("");
  const [vinError, setVinError] = useState("");
  const seo = usePageSeo("how_it_works");

  const steps: Step[] = useMemo(() => [
    { num: "01", label: t("hiw_step1_label"), title: t("hiw_step1_title"), desc: t("hiw_step1_desc"), icon: Search },
    { num: "02", label: t("hiw_step2_label"), title: t("hiw_step2_title"), desc: t("hiw_step2_desc"), icon: Database },
    { num: "03", label: t("hiw_step3_label"), title: t("hiw_step3_title"), desc: t("hiw_step3_desc"), icon: FileText },
  ], [t]);

  const trust = useMemo(() => [
    { icon: Zap, label: t("hiw_trust_speed") },
    { icon: Globe2, label: t("hiw_trust_official") },
    { icon: RotateCcw, label: t("hiw_trust_refund") },
  ], [t]);

  const reportHighlights = useMemo(() => [
    t("hiw_report_item1"),
    t("hiw_report_item2"),
    t("hiw_report_item3"),
    t("hiw_report_item4"),
    t("hiw_report_item5"),
    t("hiw_report_item6"),
  ], [t]);

  const handleCheck = (e: FormEvent) => {
    e.preventDefault();
    const v = vin.trim().toUpperCase();
    if (!v) { setVinError(t("vin_error_required")); return; }
    if (v.length !== 17) { setVinError(t("vin_error_length")); return; }
    setVinError("");
    if (!isSignedIn) {
      const authPath = redirectGuestForVinCheckout(v, language);
      if (authPath) { setLocation(authPath); return; }
    }
    sessionStorage.setItem("checkout_vin", v);
    setLocation(`/${language}/checkout`);
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={seo.title}
        description={seo.description}
        lang={seo.lang}
        canonicalPath={seo.canonicalPath}
      />

      {/* Hero — title only */}
      <section className="relative overflow-hidden py-14 md:py-20 px-4 border-b border-border/60">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_70%_55%_at_50%_-15%,hsl(var(--primary)/0.11),transparent_60%)]" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(hsl(var(--foreground)/0.035)_1px,transparent_1px)] [background-size:22px_22px] opacity-70" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto text-center space-y-5"
        >
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-primary bg-primary/10 border border-primary/15 px-3 py-1 rounded-full">
            <ShieldCheck className="h-3.5 w-3.5" />
            {t("hiw_badge")}
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-[2.75rem] font-extrabold tracking-tight leading-[1.1]">
            {t("hiw_title")}
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            {t("hiw_subtitle")}
          </p>
        </motion.div>
      </section>

      {/* Steps */}
      <section className="relative overflow-hidden bg-muted/40 dark:bg-[#060a12] py-14 md:py-20 px-4 border-y border-border/60">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_0%,hsl(var(--primary)/0.08),transparent)] dark:bg-[radial-gradient(ellipse_70%_60%_at_50%_0%,rgba(34,197,94,0.12),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(hsl(var(--foreground)/0.04)_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-60 dark:opacity-50" />
        <div className="max-w-6xl mx-auto relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10 md:mb-14 space-y-3"
          >
            <div className="inline-flex items-center rounded-full border border-border/70 bg-background/80 px-3 py-1 text-xs font-semibold text-muted-foreground dark:border-white/15 dark:bg-white/5 dark:text-white/70">
              {t("home_badge_3_steps")}
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground dark:text-white">
              {t("how_it_works")}
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground dark:text-white/50 max-w-2xl mx-auto leading-relaxed">
              {t("how_it_works_desc")}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
            {steps.map(({ num, label, title, desc, icon: Icon }, i) => (
              <motion.div
                key={num}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: i * 0.1, duration: 0.45 }}
                className="group"
              >
                <div className="flex h-full flex-col gap-5 rounded-2xl border border-border/70 bg-card/90 dark:border-white/10 dark:bg-white/[0.05] p-6 sm:p-7 shadow-sm transition-all duration-300 hover:border-primary/30 hover:shadow-md dark:hover:border-primary/30 dark:hover:bg-white/[0.07]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-emerald-400 flex items-center justify-center shadow-md shadow-primary/25 shrink-0 group-hover:shadow-primary/40 transition-shadow">
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-4xl font-black text-foreground/[0.06] dark:text-white/[0.08] leading-none tabular-nums select-none">
                      {num}
                    </span>
                  </div>

                  <div className="space-y-2 flex-1">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-primary">{label}</p>
                    <h3 className="text-lg font-bold text-foreground dark:text-white leading-snug">{title}</h3>
                    <p className="text-sm text-muted-foreground dark:text-white/50 leading-relaxed">{desc}</p>
                  </div>

                  <StepPreview step={i} vinLabel={t("vin_label")} t={t} />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Report highlights */}
      <section className="py-14 md:py-20 px-4 bg-muted/30 border-y border-border/60">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8 md:mb-10"
          >
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">{t("hiw_report_title")}</h2>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {reportHighlights.map((item, i) => (
              <motion.div
                key={item}
                custom={i}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                variants={fadeUp}
                className="flex items-center gap-3 rounded-xl border border-border/70 bg-card px-4 py-3.5 shadow-sm"
              >
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                <span className="text-sm font-medium leading-snug">{item}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* VIN anatomy */}
      <section className="py-14 md:py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8"
          >
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">{t("vin_anatomy_title")}</h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl border border-border/70 bg-card shadow-sm p-5 md:p-6 space-y-5"
          >
            <div className="flex flex-wrap gap-1.5 justify-center">
              {VIN_SEGMENTS.map(({ chars, tone }, si) =>
                chars.split("").map((ch, ci) => (
                  <div
                    key={`${si}-${ci}`}
                    className={cn(
                      "h-10 w-9 rounded-lg text-white font-mono font-bold text-sm flex items-center justify-center shadow-sm",
                      tone,
                    )}
                  >
                    {ch}
                  </div>
                )),
              )}
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              {VIN_SEGMENTS.map(({ tone, labelKey }) => (
                <div key={labelKey} className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-1.5">
                  <div className={cn("h-2 w-2 rounded-full shrink-0", tone)} />
                  <span className="text-xs text-muted-foreground">{t(labelKey)}</span>
                </div>
              ))}
            </div>
            <div className="rounded-xl border border-dashed border-border/70 bg-muted/25 px-4 py-3 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">{t("vin_label")}</p>
              <p className="text-sm font-mono tracking-[0.12em] text-foreground">{VIN_EXAMPLE}</p>
              <p className="text-xs text-muted-foreground mt-1">{DEMO_VEHICLE}</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trust */}
      <section className="px-4 pb-14 md:pb-20">
        <div className="max-w-4xl mx-auto flex flex-wrap justify-center gap-3">
          {trust.map(({ icon: Icon, label }, i) => (
            <motion.div
              key={label}
              custom={i}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              variants={fadeUp}
              className="inline-flex items-center gap-2.5 rounded-full border border-border/70 bg-card px-4 py-2 text-sm font-medium"
            >
              <Icon className="h-4 w-4 text-primary shrink-0" />
              {label}
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA — VIN input only here */}
      <section className="relative overflow-hidden py-16 md:py-24 px-4 border-t border-border/60">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_50%_at_50%_100%,hsl(var(--primary)/0.08),transparent)]" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-xl mx-auto text-center space-y-6"
        >
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">{t("hiw_cta_title")}</h2>
          <HeroVinForm
            vin={vin}
            onVinChange={(v) => { setVin(v); setVinError(""); }}
            onSubmit={handleCheck}
            error={vinError}
            placeholder={t("vin_placeholder")}
          />
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
            <Link href={`/${language}/pricing`} className="hover:text-primary transition-colors font-medium inline-flex items-center gap-1">
              {t("pricing")} <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <span className="hidden sm:inline opacity-40">·</span>
            <Link href={`/${language}/free-vin-decoder`} className="hover:text-primary transition-colors font-medium inline-flex items-center gap-1">
              {t("free_decoder_nav_link")} <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <span className="hidden sm:inline opacity-40">·</span>
            <Link href={`/${language}/faq`} className="hover:text-primary transition-colors font-medium inline-flex items-center gap-1">
              {t("nav_faq")} <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
