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
      <section className="relative isolate overflow-hidden px-4 -mt-[var(--site-header-offset,84px)] pt-[calc(3rem+var(--site-header-offset,84px))] pb-14 md:pt-[calc(5rem+var(--site-header-offset,84px))] md:pb-24">
        {/* Match homepage hero backdrop — light + dark with bottom fade */}
        <div className="absolute inset-0 -z-20 bg-gradient-to-b from-emerald-50/70 via-emerald-50/20 to-background dark:hidden" />
        <div className="absolute inset-0 -z-20 hidden dark:block" style={{ background: "#040d08" }} />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(#16a34a_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.07] dark:opacity-[0.20]" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_55%_at_50%_-5%,rgba(34,197,94,0.20),transparent)] dark:bg-[radial-gradient(ellipse_80%_60%_at_50%_-5%,rgba(34,197,94,0.42),transparent)]" />
        <div className="absolute inset-0 -z-10 hidden dark:block bg-[radial-gradient(ellipse_50%_40%_at_0%_100%,rgba(34,197,94,0.08),transparent)]" />
        <div className="absolute bottom-0 left-0 right-0 h-16 sm:h-24 md:h-32 -z-10 bg-gradient-to-t from-background to-transparent pointer-events-none" />

        <div
          aria-hidden
          className="hero-orb-a pointer-events-none absolute -top-16 left-[8%] h-56 w-56 rounded-full bg-primary/12 blur-3xl -z-10"
        />
        <div
          aria-hidden
          className="hero-orb-b pointer-events-none absolute top-32 right-[6%] h-44 w-44 rounded-full bg-emerald-400/10 blur-3xl -z-10 hidden sm:block"
        />
        <div
          aria-hidden
          className="hero-orb-c pointer-events-none absolute bottom-24 left-[42%] h-32 w-32 rounded-full bg-primary/8 blur-2xl -z-10 hidden lg:block"
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 max-w-3xl mx-auto text-center space-y-4"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3.5 py-1 text-xs font-semibold text-primary dark:border-primary/25 dark:bg-primary/10">
            <Sparkles className="h-3.5 w-3.5" />
            {t("hiw_badge")}
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-[2.75rem] font-extrabold tracking-tight leading-[1.1] text-foreground dark:text-white">
            {t("hiw_title")}
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground dark:text-white/60 leading-relaxed max-w-2xl mx-auto">
            {t("hiw_subtitle")}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-0.5">
            <Badge className="rounded-full bg-primary/10 text-primary border-primary/20 px-3 py-1 text-[11px] font-medium dark:bg-primary/15 dark:border-primary/30">
              <Clock className="h-3 w-3 mr-1 inline" />
              {t("hiw_trust_speed")}
            </Badge>
            <Badge variant="outline" className="rounded-full border-border/70 text-muted-foreground bg-background/60 px-3 py-1 text-[11px] font-medium dark:border-white/15 dark:text-white/70 dark:bg-white/5">
              {t("trust_secure_payment")}
            </Badge>
            <Badge variant="outline" className="rounded-full border-border/70 text-muted-foreground bg-background/60 px-3 py-1 text-[11px] font-medium dark:border-white/15 dark:text-white/70 dark:bg-white/5">
              {t("trust_money_back")}
            </Badge>
          </div>
        </motion.div>

        {/* Quick flow */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="relative z-10 max-w-3xl mx-auto mt-8 md:mt-10"
        >
          <div className="rounded-xl border border-border/70 bg-background/80 dark:bg-[#0a120e]/75 backdrop-blur-sm p-4 sm:p-5 shadow-sm dark:border-white/10">
            <div className="flex flex-col sm:grid sm:grid-cols-3 gap-4 sm:gap-3">
              {steps.map(({ icon: Icon, title, num }, i) => (
                <div key={num} className="relative flex sm:flex-col items-center sm:text-center gap-3 sm:gap-0">
                  {i < steps.length - 1 && (
                    <div className="hidden sm:block absolute top-6 left-[calc(50%+28px)] right-[calc(-50%+28px)] h-px border-t border-dashed border-primary/30" />
                  )}
                  <div className="h-11 w-11 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br from-primary to-emerald-500 text-white flex items-center justify-center shadow-sm shadow-primary/20 shrink-0">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 sm:flex-none text-left sm:text-center min-w-0">
                    <span className="text-[10px] font-bold text-primary uppercase tracking-wider">{num}</span>
                    <p className="text-sm font-semibold text-foreground leading-snug mt-0.5">
                      {title}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── Detailed steps (timeline) ── */}
      <section className="py-12 md:py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10 md:mb-14 space-y-2"
          >
            <SectionLabel>{t("hiw_badge")}</SectionLabel>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-foreground">{t("hiw_report_title")}</h2>
            <p className="text-sm text-muted-foreground max-w-lg mx-auto">{t("hiw_report_subtitle")}</p>
          </motion.div>

          <div className="relative space-y-8 md:space-y-12">
            <div className="hidden md:block absolute left-7 top-6 bottom-6 w-px bg-gradient-to-b from-primary/40 via-primary/15 to-transparent" />

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
                  "hidden md:flex absolute left-0 top-6 h-14 w-14 items-center justify-center rounded-xl ring-2",
                  iconWrap, ring,
                )}>
                  <Icon className="h-6 w-6" />
                </div>

                <div className={cn(
                  "grid md:grid-cols-2 gap-6 md:gap-8 items-center rounded-2xl border p-5 sm:p-7 md:p-8",
                  "bg-gradient-to-br shadow-sm hover:shadow-md transition-shadow duration-300",
                  card,
                  i % 2 === 1 && "md:[direction:rtl] md:*:[direction:ltr]",
                )}>
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex items-center gap-2.5">
                      <span className="text-3xl font-bold text-primary/15 tabular-nums leading-none">{num}</span>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-primary">{label}</span>
                    </div>
                    <div className={cn("md:hidden inline-flex h-10 w-10 items-center justify-center rounded-xl", iconWrap)}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">{title}</h3>
                    <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">{desc}</p>
                  </div>
                  <div className="relative">
                    <div className="absolute -inset-3 bg-gradient-to-br from-primary/6 to-transparent rounded-2xl blur-xl -z-10 pointer-events-none" />
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
      <section className="relative isolate overflow-hidden py-14 md:py-20 px-4 border-t border-border/60">
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-primary/[0.06] via-primary/[0.02] to-background" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative z-10 max-w-lg mx-auto text-center space-y-5"
        >
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">{t("hiw_cta_title")}</h2>
          <p className="text-muted-foreground text-base sm:text-lg leading-relaxed">{t("hiw_cta_subtitle")}</p>

          <form onSubmit={handleCheck} className="space-y-3 text-left">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider pl-1">
              {vinLabel}
            </label>
            <div className="flex flex-col sm:block gap-2.5">
              <div className="relative p-[2px] rounded-xl hero-input-glow">
                <div className="relative flex items-center rounded-xl border border-primary/25 bg-card overflow-hidden focus-within:border-primary transition-colors">
                  <Search className="absolute left-3.5 h-4 w-4 text-muted-foreground shrink-0" />
                  <Input
                    className="h-12 sm:h-13 pl-10 sm:pr-36 border-0 focus-visible:ring-0 shadow-none font-mono tracking-widest bg-transparent text-sm sm:text-base"
                    placeholder={t("vin_placeholder")}
                    value={vin}
                    onChange={e => { setVin(e.target.value.toUpperCase()); setVinError(""); }}
                    maxLength={17}
                  />
                  <Button type="submit" className="hidden sm:inline-flex absolute right-1.5 h-9 rounded-lg px-4 text-sm font-semibold gap-1">
                    {t("hiw_cta_btn")}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Button type="submit" className="sm:hidden w-full h-11 rounded-xl font-semibold gap-1.5">
                {t("hiw_cta_btn")}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
            {vinError && <p className="text-sm text-destructive text-center">{vinError}</p>}
          </form>

          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-muted-foreground pt-1">
            <Link href={`/${language}/pricing`} className="hover:text-primary transition-colors font-medium">
              {t("pricing")} →
            </Link>
            <span className="hidden sm:inline text-border">·</span>
            <Link href={`/${language}/free-vin-decoder`} className="hover:text-primary transition-colors font-medium">
              {t("free_decoder_nav_link")} →
            </Link>
            <span className="hidden sm:inline text-border">·</span>
            <Link href={`/${language}/faq`} className="hover:text-primary transition-colors font-medium">
              {t("nav_faq")} →
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
