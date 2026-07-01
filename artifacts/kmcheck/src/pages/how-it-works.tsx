import { useState, useMemo } from "react";
import { useTranslation } from "@/i18n/context";
import { useLocation, Link } from "wouter";
import { motion, type Variants } from "framer-motion";
import { SEOHead, usePageSeo } from "@/components/seo";
import { VinCheckIncludesSection } from "@/components/vin-check-includes-section";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Search, Database, FileText, ShieldCheck, Zap, RotateCcw,
  ArrowRight, ChevronRight, Globe2, Clock, Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const VIN_EXAMPLE = "1HGBH41JXMN109186";

const VIN_SEGMENTS = [
  { chars: "1HG", color: "bg-slate-600", labelKey: "vin_segment_country" },
  { chars: "BH4", color: "bg-blue-600", labelKey: "vin_segment_maker" },
  { chars: "1J", color: "bg-violet-600", labelKey: "vin_segment_model" },
  { chars: "X", color: "bg-amber-500", labelKey: "vin_segment_check" },
  { chars: "MN109186", color: "bg-emerald-600", labelKey: "vin_segment_serial" },
] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.45, ease: "easeOut" },
  }),
} as unknown as Variants;

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-bold uppercase tracking-widest text-primary">{children}</p>
  );
}

export default function HowItWorks() {
  const { t, language } = useTranslation();
  const [, setLocation] = useLocation();
  const [vin, setVin] = useState("");
  const [vinError, setVinError] = useState("");
  const seo = usePageSeo("how_it_works");
  const vinLabel = t("vin_label");

  const steps = useMemo(() => [
    {
      num: "01",
      label: t("hiw_step1_label"),
      title: t("hiw_step1_title"),
      desc: t("hiw_step1_desc"),
      icon: Search,
      ring: "ring-primary/25",
      iconWrap: "bg-gradient-to-br from-primary to-emerald-500 text-white shadow-lg shadow-primary/25",
      card: "from-primary/[0.06] via-card to-card border-primary/20",
      mock: (
        <div className="rounded-2xl border border-primary/20 bg-card p-4 shadow-lg shadow-primary/5 space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{vinLabel}</p>
          <div className="flex items-center gap-2 rounded-xl border-2 border-primary/20 bg-muted/40 px-3 py-3 hero-input-glow">
            <Search className="h-4 w-4 text-primary shrink-0" />
            <span className="font-mono text-xs sm:text-sm tracking-widest text-foreground">{VIN_EXAMPLE}</span>
          </div>
          <div className="flex justify-end">
            <span className="inline-flex items-center gap-1 rounded-full bg-primary px-3.5 py-1.5 text-[11px] font-semibold text-primary-foreground shadow-sm">
              {t("check_vin")} <ChevronRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>
      ),
    },
    {
      num: "02",
      label: t("hiw_step2_label"),
      title: t("hiw_step2_title"),
      desc: t("hiw_step2_desc"),
      icon: Database,
      ring: "ring-blue-500/25",
      iconWrap: "bg-gradient-to-br from-blue-600 to-blue-400 text-white shadow-lg shadow-blue-500/25",
      card: "from-blue-500/[0.06] via-card to-card border-blue-500/20",
      mock: (
        <div className="rounded-2xl border border-blue-500/20 bg-card p-4 shadow-lg space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Database className="h-4 w-4 text-blue-500 shrink-0" />
              <span className="text-xs font-semibold text-foreground truncate">{t("hiw_trust_official")}</span>
            </div>
            <Badge variant="secondary" className="text-[9px] shrink-0">{t("instant_report")}</Badge>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[t("auction_history"), t("accident_history"), t("mileage_verification"), t("theft_records")].map(src => (
              <div key={src} className="flex items-center gap-1.5 rounded-lg bg-muted/50 border border-border/50 px-2 py-2">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse shrink-0" />
                <span className="text-[10px] font-medium text-muted-foreground leading-tight line-clamp-2">{src}</span>
              </div>
            ))}
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-[9px] text-muted-foreground">
              <span>{t("hiw_mock_scanning")}</span>
              <span>100%</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-blue-600 to-blue-400"
                initial={{ width: "0%" }}
                whileInView={{ width: "100%" }}
                viewport={{ once: true }}
                transition={{ duration: 1.4, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>
      ),
    },
    {
      num: "03",
      label: t("hiw_step3_label"),
      title: t("hiw_step3_title"),
      desc: t("hiw_step3_desc"),
      icon: FileText,
      ring: "ring-emerald-500/25",
      iconWrap: "bg-gradient-to-br from-emerald-600 to-emerald-400 text-white shadow-lg shadow-emerald-500/25",
      card: "from-emerald-500/[0.06] via-card to-card border-emerald-500/20",
      mock: (
        <div className="rounded-2xl border border-emerald-500/20 bg-card overflow-hidden shadow-lg">
          <div className="bg-gradient-to-r from-primary to-emerald-600 px-4 py-3">
            <p className="text-[10px] font-mono text-white/75">{vinLabel} · {VIN_EXAMPLE}</p>
            <div className="flex items-center justify-between gap-2 mt-1">
              <p className="text-sm font-bold text-white">Honda Civic 2021</p>
              <span className="rounded-lg bg-white/20 px-2 py-0.5 text-[10px] font-bold text-white">9.4/10</span>
            </div>
          </div>
          <div className="p-4 space-y-2">
            {[
              { dot: "bg-green-500", label: t("mileage"), val: "42,100 km" },
              { dot: "bg-green-500", label: t("mock_label_accidents"), val: t("demo_none_found") },
              { dot: "bg-green-500", label: t("mock_label_salvage"), val: t("report_clean") },
            ].map(row => (
              <div key={row.label} className="flex items-center justify-between rounded-lg bg-muted/40 px-2.5 py-1.5">
                <div className="flex items-center gap-1.5">
                  <div className={cn("h-1.5 w-1.5 rounded-full", row.dot)} />
                  <span className="text-[10px] text-muted-foreground">{row.label}</span>
                </div>
                <span className="text-[10px] font-semibold text-foreground">{row.val}</span>
              </div>
            ))}
          </div>
        </div>
      ),
    },
  ], [t, vinLabel]);

  const trust = [
    { icon: Zap,       label: t("hiw_trust_speed"),    desc: t("instant_report"),        accent: "text-yellow-500", bar: "bg-yellow-500" },
    { icon: Globe2,    label: t("hiw_trust_official"), desc: t("pricing_compare_countries"), accent: "text-blue-500", bar: "bg-blue-500" },
    { icon: RotateCcw, label: t("hiw_trust_refund"),   desc: t("trust_money_back"),      accent: "text-emerald-500", bar: "bg-emerald-500" },
  ];

  const handleCheck = (e: React.FormEvent) => {
    e.preventDefault();
    const v = vin.trim().toUpperCase();
    if (!v) { setVinError(t("vin_error_required")); return; }
    if (v.length !== 17) { setVinError(t("vin_error_length")); return; }
    setVinError("");
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

      {/* ── Hero ── */}
      <section className="relative isolate overflow-hidden border-b border-border/60 py-16 md:py-24 px-4">
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-emerald-50/90 via-slate-50/60 to-background dark:from-[#060a12] dark:via-slate-950 dark:to-background" />
        <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_70%_55%_at_50%_-10%,hsl(var(--primary)/0.14),transparent)]" />
        <div className="absolute inset-0 z-0 bg-[radial-gradient(hsl(var(--foreground)/0.05)_1px,transparent_1px)] dark:bg-[radial-gradient(rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:22px_22px] opacity-70" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 max-w-3xl mx-auto text-center space-y-5"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 backdrop-blur-sm px-4 py-1.5 text-xs font-semibold text-foreground shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-white/90">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            {t("hiw_badge")}
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-[3.25rem] font-black tracking-tight leading-[1.08] text-foreground dark:text-white">
            {t("hiw_title")}
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto dark:text-white/60">
            {t("hiw_subtitle")}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <Badge className="rounded-full bg-primary/10 text-primary border-primary/25 px-3 py-1 dark:bg-primary/20 dark:text-primary-foreground dark:border-primary/30">
              <Clock className="h-3 w-3 mr-1.5 inline" />
              {t("hiw_trust_speed")}
            </Badge>
            <Badge variant="outline" className="rounded-full border-border text-muted-foreground bg-background/60 px-3 py-1 dark:border-white/15 dark:text-white/70 dark:bg-white/5">
              {t("trust_secure_payment")}
            </Badge>
            <Badge variant="outline" className="rounded-full border-border text-muted-foreground bg-background/60 px-3 py-1 dark:border-white/15 dark:text-white/70 dark:bg-white/5">
              {t("trust_money_back")}
            </Badge>
          </div>
        </motion.div>

        {/* Quick flow */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="relative z-10 max-w-3xl mx-auto mt-12"
        >
          <div className="rounded-2xl border border-border/70 bg-background/80 backdrop-blur-sm p-4 sm:p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
            <div className="grid grid-cols-3 gap-2 sm:gap-6">
              {steps.map(({ icon: Icon, title, num }, i) => (
                <div key={num} className="relative flex flex-col items-center text-center">
                  {i < steps.length - 1 && (
                    <div className="hidden sm:block absolute top-7 left-[calc(50%+30px)] right-[calc(-50%+30px)] h-px border-t border-dashed border-primary/35" />
                  )}
                  <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-gradient-to-br from-primary to-emerald-400 text-white flex items-center justify-center shadow-md shadow-primary/25 ring-1 ring-primary/20 mb-2.5 sm:mb-3">
                    <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                  <span className="text-[10px] font-bold text-primary uppercase tracking-wider">{num}</span>
                  <span className="text-xs sm:text-sm font-semibold text-foreground leading-snug mt-1 px-1 dark:text-white/85">
                    {title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── Detailed steps (timeline) ── */}
      <section className="py-16 md:py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12 md:mb-16 space-y-2"
          >
            <SectionLabel>{t("hiw_badge")}</SectionLabel>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-foreground">{t("hiw_title")}</h2>
          </motion.div>

          <div className="relative space-y-10 md:space-y-14">
            <div className="hidden md:block absolute left-8 top-8 bottom-8 w-px bg-gradient-to-b from-primary/50 via-primary/20 to-transparent" />

            {steps.map(({ num, label, title, desc, icon: Icon, card, iconWrap, ring, mock }, i) => (
              <motion.div
                key={num}
                custom={i}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-60px" }}
                variants={fadeUp}
                className="relative md:pl-20"
              >
                <div className={cn(
                  "hidden md:flex absolute left-0 top-8 h-16 w-16 items-center justify-center rounded-2xl ring-2",
                  iconWrap, ring,
                )}>
                  <Icon className="h-7 w-7" />
                </div>

                <div className={cn(
                  "grid md:grid-cols-2 gap-8 md:gap-10 items-center rounded-3xl border p-6 md:p-9",
                  "bg-gradient-to-br shadow-sm hover:shadow-lg transition-all duration-300",
                  card,
                  i % 2 === 1 && "md:[direction:rtl] md:*:[direction:ltr]",
                )}>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <span className="text-4xl font-black text-primary/20 tabular-nums leading-none">{num}</span>
                      <span className="text-[11px] font-bold uppercase tracking-widest text-primary">{label}</span>
                    </div>
                    <div className={cn("md:hidden inline-flex h-12 w-12 items-center justify-center rounded-2xl", iconWrap)}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">{title}</h3>
                    <p className="text-muted-foreground leading-relaxed text-base">{desc}</p>
                  </div>
                  <div className="relative">
                    <div className="absolute -inset-4 bg-gradient-to-br from-primary/8 to-transparent rounded-3xl blur-2xl -z-10 pointer-events-none" />
                    {mock}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── VIN anatomy ── */}
      <section className="py-14 md:py-20 px-4 bg-muted/30 border-y border-border/60">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8 space-y-2"
          >
            <SectionLabel>{vinLabel}</SectionLabel>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-foreground">{t("vin_anatomy_title")}</h2>
            <p className="text-sm text-muted-foreground max-w-lg mx-auto">{t("hiw_vin_anatomy_desc")}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="rounded-2xl border border-border/70 bg-card shadow-md p-5 md:p-6 space-y-5"
          >
            <div className="flex flex-wrap gap-1.5 justify-center">
              {VIN_SEGMENTS.map(({ chars, color }, si) =>
                chars.split("").map((ch, ci) => (
                  <motion.div
                    key={`${si}-${ci}`}
                    initial={{ opacity: 0, y: -6 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: (si * chars.length + ci) * 0.02 }}
                    className={cn("h-9 w-8 rounded-lg text-white font-mono font-black text-xs flex items-center justify-center shadow-sm", color)}
                  >
                    {ch}
                  </motion.div>
                ))
              )}
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              {VIN_SEGMENTS.map(({ chars, color, labelKey }) => (
                <div key={labelKey} className="flex items-center gap-1.5 bg-muted/50 rounded-lg px-2.5 py-1 border border-border/50">
                  <div className={cn("h-2 w-2 rounded-full shrink-0", color)} />
                  <span className="font-mono text-[11px] font-bold text-foreground">{chars.length > 5 ? `${chars.slice(0, 3)}…` : chars}</span>
                  <span className="text-[11px] text-muted-foreground">= {t(labelKey)}</span>
                </div>
              ))}
            </div>
            <div className="rounded-xl bg-muted/40 border border-dashed border-border/60 px-4 py-3 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">{vinLabel}</p>
              <p className="text-sm text-foreground font-mono tracking-[0.12em]">{VIN_EXAMPLE}</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Trust strip ── */}
      <section className="py-12 md:py-16 px-4">
        <div className="max-w-5xl mx-auto grid sm:grid-cols-3 gap-4">
          {trust.map(({ icon: Icon, label, desc, accent, bar }, i) => (
            <motion.div
              key={label}
              custom={i}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              variants={fadeUp}
              className="group relative overflow-hidden rounded-2xl border border-border/70 bg-card p-5 md:p-6 flex gap-4 items-start hover:border-primary/30 hover:shadow-md transition-all"
            >
              <div className={cn("absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl opacity-80", bar)} />
              <div className={cn("h-11 w-11 rounded-xl bg-muted flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform", accent)}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 text-left">
                <p className="font-bold text-sm md:text-base mb-0.5 text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <VinCheckIncludesSection className="bg-muted/25 border-t border-border/60" />

      {/* ── CTA ── */}
      <section className="relative isolate overflow-hidden py-16 md:py-24 px-4">
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-primary/[0.08] via-primary/[0.03] to-background" />
        <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_100%,hsl(var(--primary)/0.1),transparent)]" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative z-10 max-w-xl mx-auto text-center space-y-6"
        >
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-foreground">{t("hiw_cta_title")}</h2>
          <p className="text-muted-foreground text-lg">{t("hiw_cta_subtitle")}</p>

          <form onSubmit={handleCheck} className="space-y-3 text-left">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-1">
              {vinLabel}
            </label>
            <div className="relative p-[2px] rounded-2xl hero-input-glow sm:shadow-lg sm:shadow-primary/10">
            <div className="relative flex items-center rounded-2xl border-2 border-primary/30 bg-card overflow-hidden focus-within:border-primary transition-colors">
              <Search className="absolute left-4 h-5 w-5 text-muted-foreground shrink-0" />
              <Input
                className="h-14 pl-12 pr-36 border-0 focus-visible:ring-0 shadow-none font-mono tracking-widest bg-transparent text-foreground"
                placeholder={t("vin_placeholder")}
                value={vin}
                onChange={e => { setVin(e.target.value.toUpperCase()); setVinError(""); }}
                maxLength={17}
              />
              <Button type="submit" className="absolute right-2 h-10 rounded-xl px-5 font-semibold gap-1 shadow-md">
                {t("hiw_cta_btn")}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
            </div>
            {vinError && <p className="text-sm text-destructive text-center">{vinError}</p>}
          </form>

          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground pt-2">
            <Link href={`/${language}/pricing`} className="hover:text-primary transition-colors font-medium">
              {t("pricing")} →
            </Link>
            <span className="text-border">·</span>
            <Link href={`/${language}/free-vin-decoder`} className="hover:text-primary transition-colors font-medium">
              {t("free_decoder_nav_link")} →
            </Link>
            <span className="text-border">·</span>
            <Link href={`/${language}/faq`} className="hover:text-primary transition-colors font-medium">
              {t("nav_faq")} →
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
