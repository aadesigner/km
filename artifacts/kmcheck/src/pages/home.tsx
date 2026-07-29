import { useState, useEffect, useMemo, Suspense } from "react";
import { useTranslation } from "@/i18n/context";
import { Button } from "@/components/ui/button";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { useDisplayPrice } from "@/hooks/use-display-price";
import {
  ShieldCheck, Search, FileText,
  CheckCircle2,
  Globe, ArrowRight, Zap, RotateCcw,
} from "lucide-react";
import { HomeStatsStrip } from "@/components/home-stats-strip";
import { DeferredSection } from "@/components/deferred-section";
import { SectionFallback } from "@/components/section-fallback";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { SEOHead, usePageSeo, organizationJsonLd } from "@/components/seo";
import { redirectGuestForVinCheckout } from "@/lib/checkout-vin-flow";
import { HeroVinForm } from "@/components/hero-vin-form";
import { prefetchFlags } from "@/components/flag-img";
import { formatImageFlagAlt } from "@/lib/flag-alt";
import { useVinLookupDisabledForUser } from "@/hooks/use-site-public-flags";
import { lazyWithRetry } from "@/lib/lazy-with-retry";

// Decorative hero maps: heavy (react-simple-maps + d3 + ~105KB topojson) and
// only shown at lg+. Skip mounting on smaller screens to avoid wasted SVG work.
const CompareTable = lazyWithRetry(() =>
  import("@/components/compare-table").then((m) => ({ default: m.CompareTable })),
);
const WhatWeCheckSection = lazyWithRetry(() =>
  import("@/components/what-we-check-section").then((m) => ({ default: m.WhatWeCheckSection })),
);
const VinCheckIncludesSection = lazyWithRetry(() =>
  import("@/components/vin-check-includes-section").then((m) => ({ default: m.VinCheckIncludesSection })),
);
const HomepageTestimonials = lazyWithRetry(() => import("@/components/homepage-testimonials"));
const CoverageMapVisual = lazyWithRetry(() =>
  import("@/components/coverage-map-visual").then((m) => ({ default: m.CoverageMapVisual })),
);

/** True at the lg breakpoint (1024px+) where the decorative hero maps are visible. */
function useHeroMapsEnabled() {
  const [enabled, setEnabled] = useState(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia("(min-width: 1024px)").matches;
  });
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mql = window.matchMedia("(min-width: 1024px)");
    const update = () => setEnabled(mql.matches);
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);
  return enabled;
}

function useCountries(t: (k: string) => string) {
  return [
    {
      slug: "usa", flagCode: "us", name: t("country_usa_name"), count: t("country_usa_count"),
      accentFrom: "from-blue-600", accentTo: "to-red-500",
      tint: "from-blue-500/[0.07] via-transparent to-red-500/[0.05]",
      highlights: ["home_country_usa_h0", "home_country_usa_h1", "home_country_usa_h2"] as const,
    },
    {
      slug: "korea", flagCode: "kr", name: t("country_korea_name"), count: t("country_korea_count"),
      accentFrom: "from-indigo-600", accentTo: "to-red-600",
      tint: "from-indigo-500/[0.07] via-transparent to-red-500/[0.05]",
      highlights: ["home_country_korea_h0", "home_country_korea_h1", "home_country_korea_h2"] as const,
    },
    {
      slug: "canada", flagCode: "ca", name: t("country_canada_name"), count: t("country_canada_count"),
      accentFrom: "from-red-600", accentTo: "to-slate-600",
      tint: "from-red-500/[0.07] via-transparent to-slate-500/[0.05]",
      highlights: ["home_country_canada_h0", "home_country_canada_h1", "home_country_canada_h2"] as const,
    },
    {
      slug: "china", flagCode: "cn", name: t("country_china_name"), count: t("country_china_count"),
      accentFrom: "from-red-600", accentTo: "to-amber-600",
      tint: "from-red-500/[0.07] via-transparent to-amber-500/[0.05]",
      highlights: ["home_country_china_h0", "home_country_china_h1", "home_country_china_h2"] as const,
    },
    {
      slug: "uae", flagCode: "ae", name: t("country_uae_name"), count: t("country_uae_count"),
      accentFrom: "from-emerald-600", accentTo: "to-red-600",
      tint: "from-emerald-500/[0.07] via-transparent to-red-500/[0.05]",
      highlights: ["home_country_uae_h0", "home_country_uae_h1", "home_country_uae_h2"] as const,
    },
  ];
}

function useSteps(t: (k: string) => string) {
  return [
    { n: "01", title: t("step_1_title"), desc: t("step_1_desc"), icon: Search },
    { n: "02", title: t("step_2_title"), desc: t("step_2_desc"), icon: ShieldCheck },
    { n: "03", title: t("step_3_title"), desc: t("step_3_desc"), icon: FileText },
  ];
}

const DEFAULT_CYCLING_KEYS = [
  "cycling_mileage_rollbacks",
  "cycling_hidden_accidents",
  "cycling_salvage_titles",
  "cycling_theft_records",
] as const;

/** Extra / reordered hero cycling phrases per locale */
const CYCLING_KEYS_BY_LANG: Partial<Record<string, readonly string[]>> = {
  sq: [
    "cycling_vehicle_history",
    "cycling_mileage_rollbacks",
    "cycling_hidden_accidents",
    "cycling_salvage_titles",
    "cycling_theft_records",
  ],
};

function CyclingWord() {
  const { t, language } = useTranslation();
  const keys = CYCLING_KEYS_BY_LANG[language] ?? DEFAULT_CYCLING_KEYS;
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    setIdx(0);
  }, [language]);
  useEffect(() => {
    const id = setInterval(() => setIdx((i) => (i + 1) % keys.length), 4200);
    return () => clearInterval(id);
  }, [keys.length]);
  // Invisible copies reserve the tallest phrase height so cycling never pushes content.
  return (
    <span className="relative inline-grid w-full justify-items-center">
      {keys.map((key) => (
        <span key={`reserve-${language}-${key}`} className="invisible col-start-1 row-start-1" aria-hidden>
          {t(key)}
        </span>
      ))}
      <span className="col-start-1 row-start-1">
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={`${language}-${idx}`}
            className="inline-block"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            {t(keys[idx])}
          </motion.span>
        </AnimatePresence>
      </span>
    </span>
  );
}

export default function Home() {
  const { t, language } = useTranslation();
  const [, setLocation] = useLocation();
  const { isSignedIn, user } = useAuth();
  const [vin, setVin] = useState(() => {
    if (typeof window === "undefined") return "";
    const urlVin = new URLSearchParams(window.location.search).get("vin");
    return urlVin ? urlVin.trim().toUpperCase() : "";
  });
  const { displayPrice, basePrice: pricingBase, isDiscount, fmtPrice } = useDisplayPrice();

  const STEPS = useSteps(t);
  const COUNTRIES = useCountries(t);

  const vinLookupDisabled = useVinLookupDisabledForUser(user?.isAdmin);
  const heroMapsEnabled = useHeroMapsEnabled();

  useEffect(() => {
    if (!heroMapsEnabled) return;
    prefetchFlags(["ca", "us", "kr", "cn", "ae"]);
  }, [heroMapsEnabled]);

  const handleCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (vinLookupDisabled) return;
    const v = vin.trim().toUpperCase();
    if (!isSignedIn) {
      const authPath = redirectGuestForVinCheckout(v, language);
      if (authPath) setLocation(authPath);
      return;
    }
    sessionStorage.setItem("checkout_vin", v);
    setLocation(`/${language}/checkout?vin=${encodeURIComponent(v)}`);
  };

  const seo = usePageSeo("home");
  const orgJsonLd = useMemo(
    () => organizationJsonLd(
      typeof window !== "undefined" ? window.location.origin : "https://kmcheck.com",
      seo.description,
    ),
    [seo.description],
  );
  return (
    <div className="flex flex-col">
      <SEOHead
        title={seo.title}
        description={seo.description}
        lang={seo.lang}
        canonicalPath={seo.canonicalPath}
        ogImage={seo.ogImage}
        ogImageAlt={seo.ogImageAlt}
        jsonLd={orgJsonLd}
      />

      {/* ── HERO ── */}
      <section className="relative overflow-hidden px-4 -mt-[var(--site-header-offset,84px)] pt-[calc(3.75rem+var(--site-header-offset,84px))] pb-12 md:pt-[calc(5.25rem+var(--site-header-offset,84px))] md:pb-16 lg:pt-[calc(7.25rem+var(--site-header-offset,84px))] lg:pb-20">
        {/* Base layers */}
        <div className="absolute inset-0 -z-20 bg-gradient-to-b from-emerald-50/70 via-emerald-50/20 to-background dark:hidden" />
        <div className="absolute inset-0 -z-20 hidden dark:block" style={{ background: "#040d08" }} />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(#16a34a_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.07] dark:opacity-[0.20]" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_55%_at_50%_-5%,rgba(34,197,94,0.20),transparent)] dark:bg-[radial-gradient(ellipse_80%_60%_at_50%_-5%,rgba(34,197,94,0.42),transparent)]" />
        <div className="absolute inset-0 -z-10 hidden dark:block bg-[radial-gradient(ellipse_50%_40%_at_0%_100%,rgba(34,197,94,0.08),transparent)]" />
        <div className="absolute bottom-0 left-0 right-0 h-20 sm:h-32 lg:h-44 -z-10 bg-gradient-to-t from-background to-transparent pointer-events-none" />
        {/* Fade hero into next section — above maps so wings don't look cropped */}
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-0 right-0 z-[5] h-10 sm:h-14 lg:h-16 bg-gradient-to-t from-background via-background/70 to-transparent"
        />

        {/* Ambient orbs — CSS only (no JS animation loop) */}
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

        {/* Large maps pinned to viewport left / right — not centered */}
        <div
          aria-hidden
          className="pointer-events-none absolute -left-4 top-[calc(1.5rem+var(--site-header-offset,84px))] bottom-0 z-0 hidden lg:flex w-[min(58vw,720px)] max-w-[720px] -translate-y-8 xl:-translate-y-10 opacity-95 dark:opacity-90"
        >
          {heroMapsEnabled && (
            <Suspense fallback={null}>
              <CoverageMapVisual side="left" showLivePings className="h-full w-full" />
            </Suspense>
          )}
        </div>
        <div
          aria-hidden
          className="pointer-events-none absolute -right-6 top-[calc(1.75rem+var(--site-header-offset,84px))] bottom-0 z-0 hidden lg:flex w-[min(70vw,900px)] max-w-[900px] translate-x-[5%] -translate-y-7 xl:translate-x-[7%] xl:-translate-y-9 opacity-95 dark:opacity-90"
        >
          {heroMapsEnabled && (
            <Suspense fallback={null}>
              <CoverageMapVisual side="right" showLivePings className="h-full w-full" />
            </Suspense>
          )}
        </div>

        <div className="relative max-w-6xl mx-auto z-10">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="space-y-6 md:space-y-7 text-center pt-2 pb-4 md:pt-5 md:pb-6"
          >
            <h1 className="text-[2.9rem] sm:text-5xl lg:text-[4.25rem] font-extrabold tracking-tight leading-[1.08]">
              {language === "zh" ? (
                <>
                  {t("hero_headline_lead")}
                  <span className="text-primary">
                    <CyclingWord />
                  </span>
                </>
              ) : (
                <>
                  {language === "sq" ? <>{t("hero_headline_1")},</> : t("hero_headline_1")}
                  <br />
                  <span className="block text-primary">
                    <CyclingWord />
                  </span>
                </>
              )}
            </h1>
            <p className="text-base md:text-lg text-muted-foreground dark:text-white/60 max-w-xl leading-relaxed mx-auto">
              {t("hero_subtext")}
            </p>

            <HomeStatsStrip />

            <HeroVinForm
              vin={vin}
              onVinChange={setVin}
              onSubmit={handleCheck}
              disabled={vinLookupDisabled}
              placeholder={language === "sq" ? t("vin_placeholder_chassis") : t("vin_placeholder")}
            />

          </motion.div>
        </div>
      </section>

      <DeferredSection minHeight={160} rootMargin="480px 0px">
        <Suspense fallback={<SectionFallback minHeight={160} />}>
          <WhatWeCheckSection autoRotate className="pt-12 md:pt-16 lg:pt-20 pb-12 md:pb-20" />
        </Suspense>
      </DeferredSection>

      {/* ── HOW IT WORKS ── */}
      <section className="relative overflow-hidden bg-slate-950 dark:bg-[#060a12] py-16 md:py-24 px-4">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_0%,rgba(34,197,94,0.12),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-50" />
        <div className="max-w-5xl mx-auto relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16 space-y-3"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1 text-xs font-semibold text-white/70">
              {t("home_badge_3_steps")}
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white">{t("how_it_works")}</h2>
            <p className="text-white/50 text-base max-w-lg mx-auto">{t("how_it_works_desc")}</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {STEPS.map(({ n, title, desc, icon: StepIcon }, i) => (
              <motion.div
                key={n}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
                className="relative group"
              >
                <div className="relative z-10 flex flex-col gap-5 bg-white/5 border border-white/10 rounded-2xl p-7 hover:border-primary/30 hover:bg-white/[0.07] transition-all duration-300">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary to-emerald-400 flex items-center justify-center shadow-lg shadow-primary/30 shrink-0 group-hover:shadow-primary/50 transition-shadow">
                      <StepIcon className="h-7 w-7 text-white" />
                    </div>
                    <span className="text-5xl font-black text-white/8 leading-none select-none">{n}</span>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-white">{title}</h3>
                    <p className="text-white/50 text-sm leading-relaxed">{desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COUNTRIES ── */}
      <section className="py-16 md:py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-10 md:mb-12 text-center space-y-3"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/5 px-3.5 py-1.5 text-xs font-semibold text-primary">
              <Globe className="h-3.5 w-3.5" />
              {t("stats_countries_badge")}
            </div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">{t("countries_title")}</h2>
            <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">{t("countries_subtitle")}</p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {COUNTRIES.map((c, i) => (
              <motion.div
                key={c.slug}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Link
                  href={`/${language}/cars/${c.slug}`}
                  className="group relative flex h-full flex-col rounded-2xl border border-border/70 bg-card overflow-hidden shadow-sm hover:border-primary/35 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
                >
                  <div className={cn("h-1 bg-gradient-to-r", c.accentFrom, c.accentTo)} />
                  <div className={cn("absolute inset-0 bg-gradient-to-br pointer-events-none", c.tint)} />
                  <div className="relative z-10 flex flex-1 flex-col p-5 md:p-6">
                    <div className="flex items-start justify-between gap-3 mb-5">
                      <div className="min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <img
                            src={`https://flagcdn.com/${c.flagCode}.svg`}
                            alt={formatImageFlagAlt(c.name, t)}
                            width={43}
                            height={32}
                            loading="lazy"
                            decoding="async"
                            fetchPriority="low"
                            className="h-8 w-auto rounded-sm shadow-sm ring-1 ring-black/5 dark:ring-white/10"
                          />
                          <h3 className="text-xl font-bold tracking-tight">{c.name}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {c.count} {t("country_registered_vehicles")}
                        </p>
                      </div>
                      <div className={cn(
                        "h-10 w-10 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0 shadow-sm",
                        c.accentFrom, c.accentTo,
                      )}>
                        <Globe className="h-4 w-4 text-white" />
                      </div>
                    </div>

                    <ul className="space-y-2.5 mb-6 flex-1">
                      {c.highlights.map((key) => (
                        <li key={key} className="flex items-start gap-2.5 text-sm text-muted-foreground leading-snug">
                          <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          <span>{t(key)}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="inline-flex items-center gap-2 text-sm font-semibold text-primary group-hover:gap-2.5 transition-[gap] duration-200">
                      <span>{t("vin_check_for")} {c.name}</span>
                      <ArrowRight className="h-4 w-4 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <DeferredSection minHeight={360}>
        <Suspense fallback={<SectionFallback minHeight={360} />}>
          <VinCheckIncludesSection />
        </Suspense>
      </DeferredSection>

      {/* ── TESTIMONIALS ── */}
      <DeferredSection minHeight={420}>
        <Suspense fallback={<SectionFallback minHeight={420} />}>
          <HomepageTestimonials />
        </Suspense>
      </DeferredSection>

      {/* ── COMPARISON TABLE ── */}
      <DeferredSection minHeight={280}>
        <Suspense fallback={<SectionFallback minHeight={280} />}>
          <CompareTable market="home" />
        </Suspense>
      </DeferredSection>

      {/* ── BOTTOM CTA ── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#031912] via-[#041a14] to-[#060a12] py-14 md:py-16 px-4 pb-10 md:pb-12">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_50%_0%,rgba(34,197,94,0.28),transparent_65%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_100%_20%,rgba(52,211,153,0.1),transparent_50%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(74,222,128,0.18)_1px,transparent_1px)] [background-size:22px_22px] opacity-[0.12] [mask-image:linear-gradient(180deg,#000_0%,#000_55%,transparent_100%)]" />

        <div className="max-w-5xl mx-auto relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
            className="relative overflow-hidden rounded-2xl border border-emerald-400/20 bg-gradient-to-b from-emerald-950/45 via-emerald-950/20 to-[#060a12] shadow-[0_20px_60px_-20px_rgba(0,0,0,0.55)] backdrop-blur-sm"
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/50 to-transparent" />
            <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-emerald-400/10 blur-3xl" />

            <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr]">
              {/* Left — headline & value */}
              <div className="flex flex-col justify-center text-center lg:text-left px-6 py-7 sm:px-8 sm:py-8 lg:px-10 space-y-4 border-b lg:border-b-0 lg:border-r border-emerald-400/10">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-100/85 w-fit mx-auto lg:mx-0">
                  <FileText className="h-3.5 w-3.5 text-emerald-300" />
                  {t("pricing_hero_eyebrow")}
                </div>

                {(() => {
                  const [line1, ...rest] = t("cta_title").split(/\.\s+/);
                  const line2 = rest.join(". ").trim();
                  return (
                    <div className="space-y-2">
                      <h2 className="text-[1.9rem] sm:text-[2.35rem] md:text-[2.6rem] font-extrabold text-white leading-[1.1] tracking-tight">
                        {line1}.
                      </h2>
                      {line2 ? (
                        <p className="text-base sm:text-lg text-emerald-200/75 font-medium leading-snug">
                          {line2.endsWith(".") ? line2 : `${line2}.`}
                        </p>
                      ) : null}
                    </div>
                  );
                })()}

                <p className="text-[13px] sm:text-sm text-white/50 leading-relaxed max-w-[18rem] mx-auto lg:mx-0">
                  {t("cta_desc")}
                </p>

                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-4 gap-y-2 pt-0.5">
                  {[
                    { icon: Zap, label: t("trust_instant_report") },
                    { icon: RotateCcw, label: t("trust_money_back") },
                  ].map(({ icon: Icon, label }) => (
                    <span key={label} className="inline-flex items-center gap-1.5 text-[12px] text-white/55">
                      <Icon className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                      {label}
                    </span>
                  ))}
                </div>
              </div>

              {/* Right — price & action */}
              <div className="flex flex-col">
                <div className="relative px-6 py-5 sm:px-7 sm:py-6 text-center lg:text-left bg-gradient-to-br from-emerald-600/90 via-emerald-700/85 to-emerald-800/90">
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_80%_at_50%_-20%,rgba(255,255,255,0.15),transparent)]" />
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:16px_16px] opacity-[0.1]" />

                  <div className="relative space-y-1">
                    {isDiscount && (
                      <Badge className="mb-1 bg-orange-500 text-white border-0 text-[11px] font-bold shadow-sm shadow-orange-900/30">
                        {t("limited_time")}
                      </Badge>
                    )}
                    <div className="flex items-end justify-center lg:justify-start gap-2.5 flex-wrap">
                      <span className="text-[2.5rem] sm:text-5xl font-black text-white tabular-nums leading-none tracking-tight">
                        {displayPrice != null ? fmtPrice(displayPrice) : "—"}
                      </span>
                      {isDiscount && (
                        <span className="text-base line-through text-white/40 tabular-nums pb-1.5">
                          {pricingBase != null ? fmtPrice(pricingBase) : null}
                        </span>
                      )}
                    </div>
                    <p className="text-[13px] text-white/70">{t("per_report")}</p>
                  </div>
                </div>

                <div className="flex flex-col justify-center gap-2.5 px-6 py-5 sm:px-7 sm:py-6 bg-[#060a12] flex-1">
                  <Button
                    asChild
                    size="lg"
                    className="w-full h-11 font-bold bg-white text-emerald-900 hover:bg-emerald-50 shadow-md shadow-black/20 gap-2"
                  >
                    <Link href={`/${language}/pricing`}>
                      {t("get_started")}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="w-full h-10 border-white/10 bg-white/[0.03] text-white/80 hover:bg-white/[0.06] hover:text-white hover:border-white/20"
                  >
                    <Link href={`/${language}/pricing`}>{t("see_whats_included")}</Link>
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
