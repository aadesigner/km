import { useState, useMemo, type FormEvent } from "react";
import { useTranslation } from "@/i18n/context";
import { useLocation, Link } from "wouter";
import { EnterReveal } from "@/components/enter-reveal";
import { SEOHead, usePageSeo } from "@/components/seo";
import { Button } from "@/components/ui/button";
import { HeroVinForm } from "@/components/hero-vin-form";
import { WhatWeCheckSection } from "@/components/what-we-check-section";
import { useAuth } from "@/lib/auth-context";
import { redirectGuestForVinCheckout } from "@/lib/checkout-vin-flow";
import { Zap, RotateCcw, Globe2, ShieldCheck, Search, Gauge, AlertTriangle, Shield, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const VIN_EXAMPLE = "WAUZZZ8K9NA123456";
const DEMO_VEHICLE = "Audi A4";
const DEMO_YEAR = "2014";

function StepPreview({ step, t }: { step: number; t: (k: string) => string }) {
  if (step === 0) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between px-0.5">
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/55">{t("vin_check")}</span>
          <span className="text-[11px] font-mono font-semibold tabular-nums text-white/70">17/17</span>
        </div>
        <div className="flex items-center h-12 rounded-xl border border-white/20 bg-white/10 px-3">
          <Search className="h-4 w-4 text-white/45 shrink-0" />
          <span className="ml-2.5 font-mono text-[13px] sm:text-sm tracking-[0.12em] text-white truncate">
            {VIN_EXAMPLE}
          </span>
          <span className="ml-auto shrink-0 rounded-lg bg-primary text-primary-foreground text-[12px] font-semibold px-2.5 py-1.5">
            {t("check_vin_short")}
          </span>
        </div>
        <p className="px-0.5 text-[13px] text-white/45">
          {DEMO_VEHICLE} <span className="text-white/25">·</span> {DEMO_YEAR}
        </p>
      </div>
    );
  }

  if (step === 1) {
    const sources = [
      t("auction_history"),
      t("accident_history"),
      t("mileage_verification"),
      t("theft_records"),
    ];
    return (
      <ul className="grid grid-cols-2 gap-2">
        {sources.map((src) => (
          <li
            key={src}
            className="rounded-lg border border-white/12 bg-white/[0.05] px-2.5 py-2 text-[12px] leading-snug text-white/80"
          >
            {src}
          </li>
        ))}
      </ul>
    );
  }

  const rows = [
    { icon: Gauge, label: t("mileage"), val: "248,600 km", warn: true },
    { icon: AlertTriangle, label: t("mock_label_accidents"), val: t("wwc_preview_accidents_status"), warn: true },
    { icon: Shield, label: t("mock_label_salvage"), val: t("report_clean"), warn: false },
    { icon: Users, label: t("mock_label_owners"), val: "4", warn: false },
    { icon: ShieldCheck, label: t("mock_label_stolen"), val: t("report_not_stolen"), warn: false },
  ];

  return (
    <div className="rounded-xl border border-white/12 bg-white/[0.05] overflow-hidden">
      <div className="px-3.5 py-2.5 border-b border-white/10">
        <p className="font-mono text-[11px] tracking-wide text-white/40">{VIN_EXAMPLE}</p>
        <p className="mt-0.5 text-[14px] font-medium text-white">
          {DEMO_VEHICLE} {DEMO_YEAR}
        </p>
      </div>
      <dl>
        {rows.map(({ icon: Icon, label, val, warn }, i) => (
          <div
            key={label}
            className={cn(
              "flex items-center justify-between gap-3 px-3.5 py-2",
              i < rows.length - 1 && "border-b border-white/[0.07]",
            )}
          >
            <dt className="flex items-center gap-2 min-w-0 text-[12px] text-white/50">
              <Icon className={cn("h-3.5 w-3.5 shrink-0", warn ? "text-orange-400" : "opacity-70")} />
              <span className="truncate">{label}</span>
            </dt>
            <dd
              className={cn(
                "text-[12px] font-semibold tabular-nums shrink-0",
                warn ? "text-orange-300" : "text-white",
              )}
            >
              {val}
            </dd>
          </div>
        ))}
      </dl>
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

  const steps = useMemo(() => [
    { n: "1", title: t("hiw_step1_title"), desc: t("hiw_step1_desc") },
    { n: "2", title: t("hiw_step2_title"), desc: t("hiw_step2_desc") },
    { n: "3", title: t("hiw_step3_title"), desc: t("hiw_step3_desc") },
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

      {/* Hero — same green glow under navbar as FAQ */}
      <section className="relative overflow-hidden py-14 md:py-20 px-4 text-center border-b border-border/60">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,hsl(var(--primary)/0.12),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(hsl(var(--foreground)/0.03)_1px,transparent_1px)] [background-size:22px_22px] opacity-70" />

        <EnterReveal y={16} className="relative max-w-2xl mx-auto space-y-5">
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
        </EnterReveal>
      </section>

      <WhatWeCheckSection autoRotate />

      {/* Steps — one path, not three cloned cards */}
      <section className="relative overflow-hidden bg-slate-950 dark:bg-[#060a12] py-16 md:py-20 px-4 border-b border-border/60">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_0%,rgba(34,197,94,0.14),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40" />
        <div className="max-w-3xl mx-auto relative">
          {steps.map(({ n, title, desc }, i) => (
            <EnterReveal
              key={n}
              inView
              y={12}
              className="relative grid md:grid-cols-[minmax(0,1fr)_16.75rem] gap-5 md:gap-10 pb-12 last:pb-0"
            >
              {i < steps.length - 1 && (
                <div
                  className="absolute left-[15px] top-9 bottom-0 w-px bg-white/12"
                  aria-hidden
                />
              )}
              <div className="relative flex gap-4 min-w-0">
                <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-[13px] font-semibold text-white">
                  {n}
                </span>
                <div className="min-w-0 pt-0.5">
                  <h2 className="text-xl font-semibold tracking-tight text-white leading-snug">
                    {title}
                  </h2>
                  <p className="mt-2 text-[15px] text-white/55 leading-relaxed">
                    {desc}
                  </p>
                </div>
              </div>
              <div className="pl-12 md:pl-0 md:pt-0.5">
                <StepPreview step={i} t={t} />
              </div>
            </EnterReveal>
          ))}
        </div>
      </section>

      {/* Trust strip */}
      <section className="relative overflow-hidden bg-slate-950 dark:bg-[#060a12] py-12 md:py-16 px-4">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_0%,rgba(34,197,94,0.1),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40" />
        <div className="max-w-5xl mx-auto relative grid sm:grid-cols-3 gap-4 md:gap-6">
          {trustStrip.map(({ icon: Icon, label, desc }, i) => (
            <EnterReveal
              key={label}
              inView
              y={16}
              delay={i * 0.04}
              className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 md:p-6 hover:border-primary/30 hover:bg-white/[0.06] transition-colors"
            >
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-emerald-400 flex items-center justify-center mb-4 shadow-lg shadow-primary/20">
                <Icon className="h-5 w-5 text-white" />
              </div>
              <p className="font-bold text-white text-sm sm:text-base mb-1.5">{label}</p>
              <p className="text-sm text-white/50 leading-relaxed">{desc}</p>
            </EnterReveal>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[hsl(142,80%,26%)] via-primary to-[hsl(158,76%,28%)] dark:from-[hsl(142,72%,20%)] dark:via-[hsl(142,72%,30%)] dark:to-[hsl(158,70%,24%)] px-4 py-16 md:py-24">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_80%_50%,rgba(255,255,255,0.12),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.04]" />
        <div className="absolute top-8 left-16 h-40 w-40 rounded-full bg-white/8 blur-3xl" />
        <div className="absolute bottom-8 right-16 h-48 w-48 rounded-full bg-white/8 blur-3xl" />

        <EnterReveal inView y={16} className="relative z-10 max-w-2xl mx-auto text-center space-y-8">
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
        </EnterReveal>
      </section>
    </div>
  );
}
