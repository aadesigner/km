import { useState, useMemo, type FormEvent } from "react";
import { useTranslation } from "@/i18n/context";
import { useLocation, Link } from "wouter";
import { motion } from "framer-motion";
import { SEOHead, usePageSeo } from "@/components/seo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HeroVinForm } from "@/components/hero-vin-form";
import { WhatWeCheckSection } from "@/components/what-we-check-section";
import { VinCheckIncludesSection } from "@/components/vin-check-includes-section";
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

const HIW_PREVIEW_ROWS = [
  { key: "mileage", labelKey: "mock_label_mileage", value: "68,400 km", warn: false },
  { key: "accidents", labelKey: "mock_label_accidents", valueKey: "demo_none_found", warn: false },
  { key: "salvage", labelKey: "mock_label_salvage", valueKey: "report_clean", warn: false },
  { key: "stolen", labelKey: "mock_label_stolen", valueKey: "mock_value_stolen", warn: false },
  { key: "owners", labelKey: "mock_label_owners", ownersCount: 2, warn: false },
] as const;

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

  const trustStrip = useMemo(() => [
    { icon: Zap, label: t("hiw_trust_speed"), desc: t("pricing_compare_instant") },
    { icon: Globe2, label: t("hiw_trust_official"), desc: t("pricing_compare_official") },
    { icon: RotateCcw, label: t("hiw_trust_refund"), desc: t("money_back_desc") },
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

      {/* Hero */}
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
            className="text-center mb-10 md:mb-12"
          >
            <div className="inline-flex items-center rounded-full border border-border/70 bg-background/80 px-3 py-1 text-xs font-semibold text-muted-foreground dark:border-white/15 dark:bg-white/5 dark:text-white/70">
              {t("home_badge_3_steps")}
            </div>
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

      <WhatWeCheckSection autoRotate />

      <VinCheckIncludesSection
        demoVin={VIN_EXAMPLE}
        demoVehicle={DEMO_VEHICLE}
        demoOriginKey="demo_card_origin_germany"
        demoScore={9.1}
        demoBadgeKey="report_clean"
        demoBadgeClassName="border-green-500/35 bg-green-500/10 text-green-700 dark:text-green-400"
        demoScoreClassName="text-green-600 dark:text-green-400"
        previewRows={HIW_PREVIEW_ROWS}
      />

      {/* Trust strip */}
      <section className="relative overflow-hidden bg-slate-950 dark:bg-[#060a12] py-12 md:py-16 px-4">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_0%,rgba(34,197,94,0.1),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40" />
        <div className="max-w-5xl mx-auto relative grid sm:grid-cols-3 gap-4 md:gap-6">
          {trustStrip.map(({ icon: Icon, label, desc }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 md:p-6 hover:border-primary/30 hover:bg-white/[0.06] transition-colors"
            >
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-emerald-400 flex items-center justify-center mb-4 shadow-lg shadow-primary/20">
                <Icon className="h-5 w-5 text-white" />
              </div>
              <p className="font-bold text-white text-sm sm:text-base mb-1.5">{label}</p>
              <p className="text-sm text-white/50 leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[hsl(142,80%,26%)] via-primary to-[hsl(158,76%,28%)] dark:from-[hsl(142,72%,20%)] dark:via-[hsl(142,72%,30%)] dark:to-[hsl(158,70%,24%)] px-4 py-16 md:py-24">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_80%_50%,rgba(255,255,255,0.12),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.04]" />
        <div className="absolute top-8 left-16 h-40 w-40 rounded-full bg-white/8 blur-3xl" />
        <div className="absolute bottom-8 right-16 h-48 w-48 rounded-full bg-white/8 blur-3xl" />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative z-10 max-w-2xl mx-auto text-center space-y-8"
        >
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 border border-white/25 px-4 py-1.5 text-sm font-semibold text-white">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
              </span>
              {t("instant_digital_report")}
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white leading-tight">
              {t("hiw_cta_title")}
            </h2>
            <p className="text-white/70 text-sm sm:text-base max-w-lg mx-auto leading-relaxed">{t("hiw_cta_subtitle")}</p>
          </div>

          <HeroVinForm
            vin={vin}
            onVinChange={(v) => { setVin(v); setVinError(""); }}
            onSubmit={handleCheck}
            error={vinError}
            placeholder={t("vin_placeholder")}
            helpVariant="on-dark"
            className="max-w-xl"
          />

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild variant="outline" size="lg" className="h-11 border-white/30 text-white hover:bg-white/10 hover:text-white bg-transparent">
              <Link href={`/${language}/pricing`}>{t("see_whats_included")}</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-11 border-white/30 text-white hover:bg-white/10 hover:text-white bg-transparent">
              <Link href={`/${language}/free-vin-decoder`}>{t("free_decoder_nav_link")}</Link>
            </Button>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
