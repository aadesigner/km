import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { decodeVinLocalFree } from "@workspace/vin-decode";
import { useTranslation } from "@/i18n/context";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { useDisplayPrice } from "@/hooks/use-display-price";
import {
  ShieldCheck, Search, Clock, FileText, ChevronRight, ChevronLeft,
  CheckCircle2, AlertTriangle,
  Globe, Star, ArrowRight, X,
} from "lucide-react";
import { CompareTable } from "@/components/compare-table";
import { HomeStatsStrip } from "@/components/home-stats-strip";
import { VinCheckIncludesSection } from "@/components/vin-check-includes-section";
import { WhatWeCheckSection } from "@/components/what-we-check-section";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { SEOHead, usePageSeo, organizationJsonLd } from "@/components/seo";
import { getVinValidationErrorKey } from "@/lib/vin-validation";
import { redirectGuestForVinCheckout } from "@/lib/checkout-vin-flow";
import { isTrustworthyVinDecode, shouldShowPendingVinDoubleCheck } from "@/lib/vin-decode-preview";
import { getTestimonials, shuffleTestimonials } from "@/data/testimonials";
import { HeroVinForm } from "@/components/hero-vin-form";
import { useVinLookupDisabledForUser } from "@/hooks/use-site-public-flags";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

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
  ];
}

function useSteps(t: (k: string) => string) {
  return [
    { n: "01", title: t("step_1_title"), desc: t("step_1_desc"), icon: Search },
    { n: "02", title: t("step_2_title"), desc: t("step_2_desc"), icon: ShieldCheck },
    { n: "03", title: t("step_3_title"), desc: t("step_3_desc"), icon: FileText },
  ];
}

const CYCLING_KEYS = [
  "cycling_mileage_rollbacks",
  "cycling_hidden_accidents",
  "cycling_salvage_titles",
  "cycling_theft_records",
] as const;

function CyclingWord() {
  const { t } = useTranslation();
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setIdx(i => (i + 1) % CYCLING_KEYS.length), 2600);
    return () => clearInterval(id);
  }, []);
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.span
        key={idx}
        className="text-primary inline"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        {t(CYCLING_KEYS[idx])}
      </motion.span>
    </AnimatePresence>
  );
}

export default function Home() {
  const { t, language } = useTranslation();
  const [, setLocation] = useLocation();
  const { isSignedIn, user } = useAuth();
  const [vin, setVin] = useState("");
  const [error, setError] = useState("");
  const { displayPrice, basePrice: pricingBase, isDiscount, loading: priceLoading, currencySymbol, fmtPrice } = useDisplayPrice();

  const normalizedHomeVin = vin.trim().toUpperCase();
  const homeLocalDecode = useMemo(
    () => (normalizedHomeVin.length === 17 ? decodeVinLocalFree(normalizedHomeVin) : null),
    [normalizedHomeVin],
  );

  const showVinWarning = !!homeLocalDecode && !homeLocalDecode.make && !homeLocalDecode.model;
  const homeDecodeTrustworthy = !!homeLocalDecode && isTrustworthyVinDecode({
    vin: normalizedHomeVin,
    make: homeLocalDecode.make,
    model: homeLocalDecode.model,
    year: homeLocalDecode.year ?? null,
  });
  const { data: homePeek } = useQuery({
    queryKey: ["/api/vin/peek", "home", normalizedHomeVin],
    enabled: isSignedIn && normalizedHomeVin.length === 17 && homeDecodeTrustworthy,
    queryFn: async () => {
      const r = await fetch(`${basePath}/api/vin/peek/${encodeURIComponent(normalizedHomeVin)}`, {
        credentials: "include",
      });
      if (!r.ok) throw new Error("peek_error");
      return r.json() as {
        manualPending?: boolean;
        dataAvailable?: boolean;
        checkUnavailable?: boolean;
      };
    },
    staleTime: 60_000,
  });
  const showHomePendingDoubleCheck = !!homePeek && shouldShowPendingVinDoubleCheck({
    vin: normalizedHomeVin,
    make: homeLocalDecode?.make,
    model: homeLocalDecode?.model,
    year: homeLocalDecode?.year ?? null,
    ...homePeek,
  });

  const STEPS = useSteps(t);
  const COUNTRIES = useCountries(t);
  const TESTIMONIALS = useMemo(() => getTestimonials(language), [language]);
  const [tmIdx, setTmIdx] = useState(0);
  const [tmPaused, setTmPaused] = useState(false);
  useEffect(() => { setTmIdx(0); }, [language]);
  useEffect(() => {
    if (tmPaused) return;
    const timer = setInterval(() => setTmIdx(i => (i + 1) % TESTIMONIALS.length), 5500);
    return () => clearInterval(timer);
  }, [tmPaused, TESTIMONIALS.length]);

  const vinLookupDisabled = useVinLookupDisabledForUser(user?.isAdmin);

  const handleCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (vinLookupDisabled) return;
    const v = vin.trim().toUpperCase();
    const validationKey = getVinValidationErrorKey(v);
    if (validationKey) { setError(t(validationKey)); return; }
    setError("");
    if (!isSignedIn) {
      const authPath = redirectGuestForVinCheckout(v, language);
      if (authPath) setLocation(authPath);
      return;
    }
    sessionStorage.setItem("checkout_vin", v);
    setLocation(`/${language}/checkout`);
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
      <section className="relative overflow-hidden px-4 -mt-[var(--site-header-offset,84px)] pt-[calc(3rem+var(--site-header-offset,84px))] pb-12 md:pt-[calc(5rem+var(--site-header-offset,84px))] md:pb-20 lg:pt-[calc(7rem+var(--site-header-offset,84px))] lg:pb-28">
        {/* Base layers */}
        <div className="absolute inset-0 -z-20 bg-gradient-to-b from-emerald-50/70 via-emerald-50/20 to-background dark:hidden" />
        <div className="absolute inset-0 -z-20 hidden dark:block" style={{ background: "#040d08" }} />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(#16a34a_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.07] dark:opacity-[0.20]" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_55%_at_50%_-5%,rgba(34,197,94,0.20),transparent)] dark:bg-[radial-gradient(ellipse_80%_60%_at_50%_-5%,rgba(34,197,94,0.42),transparent)]" />
        <div className="absolute inset-0 -z-10 hidden dark:block bg-[radial-gradient(ellipse_50%_40%_at_0%_100%,rgba(34,197,94,0.08),transparent)]" />
        <div className="absolute bottom-0 left-0 right-0 h-16 sm:h-28 lg:h-40 -z-10 bg-gradient-to-t from-background to-transparent pointer-events-none" />

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

        <div className="relative max-w-6xl mx-auto isolate z-10">
          <div className="max-w-3xl mx-auto">

          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="space-y-8 text-center"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="hidden sm:inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              {t("hero_badge")}
            </motion.div>

            <h1 className="text-[3rem] sm:text-5xl lg:text-[4.25rem] font-extrabold tracking-tight leading-[1.08]">
              {t("hero_headline_1")}<br />
              <CyclingWord />
            </h1>
            <p className="text-base md:text-lg text-muted-foreground dark:text-white/60 max-w-xl leading-relaxed mx-auto">
              {t("hero_subtext")}
            </p>

            <HomeStatsStrip variant="hero" />

            <HeroVinForm
              vin={vin}
              onVinChange={(v) => { setVin(v); setError(""); }}
              onSubmit={handleCheck}
              error={error}
              disabled={vinLookupDisabled}
              placeholder={language === "sq" ? t("vin_placeholder_chassis") : t("vin_placeholder")}
              alerts={(showVinWarning || showHomePendingDoubleCheck) ? (
                <AnimatePresence>
                  {showVinWarning && (
                    <motion.div
                      key="vin-warning"
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.25 }}
                      className="flex items-start gap-2 rounded-lg border border-amber-300/80 bg-amber-50/90 dark:border-amber-700/50 dark:bg-amber-950/40 px-3 py-2.5"
                    >
                      <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">{t("vin_warning_unknown_vehicle")}</p>
                        <p className="text-xs text-amber-600/80 dark:text-amber-500 mt-0.5">{t("vin_warning_unknown_vehicle_sub")}</p>
                      </div>
                    </motion.div>
                  )}
                  {showHomePendingDoubleCheck && (
                    <motion.div
                      key="vin-pending-double-check"
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.25 }}
                      className="flex items-start gap-2 rounded-lg border border-amber-200/80 dark:border-amber-800/45 bg-amber-50/50 dark:bg-amber-950/25 px-3 py-2.5"
                    >
                      <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">{t("vin_warning_pending_double_check")}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              ) : null}
            />

          </motion.div>
          </div>
        </div>
      </section>

      <WhatWeCheckSection autoRotate />

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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
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
                            alt=""
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

      <VinCheckIncludesSection />

      {/* ── TESTIMONIALS ── */}
      <section className="py-16 md:py-24 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10 space-y-3"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-yellow-400/40 bg-yellow-400/5 px-3.5 py-1.5 text-xs font-semibold text-yellow-600 dark:text-yellow-400">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              {t("testimonials_trust_badge")}
            </div>
            <h2 className="text-3xl md:text-4xl font-bold">{t("testimonials_title")}</h2>
            <p className="text-sm text-muted-foreground max-w-lg mx-auto">{t("testimonials_subtitle")}</p>
          </motion.div>

          {/* Slider */}
          <div
            className="relative"
            onMouseEnter={() => setTmPaused(true)}
            onMouseLeave={() => setTmPaused(false)}
          >
            {/* Prev */}
            <button
              onClick={() => setTmIdx(i => (i - 1 + TESTIMONIALS.length) % TESTIMONIALS.length)}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 sm:-translate-x-5 z-10 h-10 w-10 rounded-full bg-background border border-border shadow-md flex items-center justify-center hover:bg-muted transition-colors shrink-0"
              aria-label="Previous"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {/* Next */}
            <button
              onClick={() => setTmIdx(i => (i + 1) % TESTIMONIALS.length)}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 sm:translate-x-5 z-10 h-10 w-10 rounded-full bg-background border border-border shadow-md flex items-center justify-center hover:bg-muted transition-colors shrink-0"
              aria-label="Next"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            {/* Card */}
            <AnimatePresence mode="wait">
              {(() => {
                const tm = TESTIMONIALS[tmIdx % Math.max(TESTIMONIALS.length, 1)];
                if (!tm) return null;
                return (
                  <motion.div
                    key={tmIdx}
                    initial={{ opacity: 0, x: 32 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -32 }}
                    transition={{ duration: 0.22 }}
                    className="mx-8 sm:mx-10 bg-background rounded-3xl border border-border/70 p-7 md:p-9 shadow-sm"
                  >
                    {/* Stars + date */}
                    <div className="flex items-center justify-between gap-2 mb-5">
                      <div className="flex gap-0.5">
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} className={`h-4 w-4 ${s <= tm.stars ? "fill-yellow-400 text-yellow-400" : "fill-muted-foreground/15 text-muted-foreground/25"}`} />
                        ))}
                      </div>
                      {tm.date && <span className="text-xs text-muted-foreground/60">{tm.date}</span>}
                    </div>

                    {/* Quote */}
                    <p className="text-base md:text-lg leading-relaxed text-foreground/85 mb-5 min-h-[72px]">
                      "{tm.text}"
                    </p>

                    {/* Result badge */}
                    {tm.resultBadge && (
                      <div className="inline-flex items-center gap-1.5 mb-5 rounded-lg px-2.5 py-1 text-[11px] font-semibold bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400">
                        <AlertTriangle className="h-3 w-3 shrink-0" />
                        {tm.resultBadge}
                      </div>
                    )}

                    {/* Author */}
                    <div className="flex items-center gap-3 pt-5 border-t border-border/50">
                      <div className={`h-11 w-11 rounded-full ${tm.avatarBg} flex items-center justify-center text-white text-sm font-bold shrink-0`}>
                        {tm.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-sm truncate">{tm.name}</span>
                          <img src={`https://flagcdn.com/${tm.flagCode}.svg`} alt="" className="h-3.5 w-auto rounded-sm shrink-0" />
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate">{tm.car}</p>
                      </div>
                      <span className="text-[10px] text-green-600 dark:text-green-400 font-semibold flex items-center gap-1 shrink-0">
                        <CheckCircle2 className="h-3.5 w-3.5" /> {t("auth_verified_purchase")}
                      </span>
                    </div>
                  </motion.div>
                );
              })()}
            </AnimatePresence>

            {/* Dot indicators */}
            <div className="flex items-center justify-center gap-2 mt-6">
              {TESTIMONIALS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setTmIdx(i)}
                  className={cn(
                    "rounded-full transition-all duration-200",
                    i === tmIdx
                      ? "w-5 h-2 bg-primary"
                      : "w-2 h-2 bg-muted-foreground/25 hover:bg-muted-foreground/50"
                  )}
                  aria-label={`Go to review ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── COMPARISON TABLE ── */}
      <CompareTable />

      {/* ── BOTTOM CTA ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[hsl(142,80%,26%)] via-primary to-[hsl(158,76%,28%)] dark:from-[hsl(142,72%,20%)] dark:via-[hsl(142,72%,30%)] dark:to-[hsl(158,70%,24%)] px-4 py-16 md:py-24">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_80%_50%,rgba(255,255,255,0.12),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.04]" />
        <div className="absolute top-8 left-16 h-40 w-40 rounded-full bg-white/8 blur-3xl" />
        <div className="absolute bottom-8 right-16 h-48 w-48 rounded-full bg-white/8 blur-3xl" />
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative z-10 max-w-3xl mx-auto text-center space-y-8"
        >
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 border border-white/25 px-4 py-1.5 text-sm font-semibold text-white">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
              </span>
              {t("instant_digital_report")}
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-white leading-tight">
              {t("cta_title")}
            </h2>
            <p className="text-white/65 text-base max-w-xl mx-auto">{t("cta_desc")}</p>
          </div>

          <div className="flex items-center justify-center gap-3 flex-wrap">
            {priceLoading ? (
              <Skeleton className="h-14 w-28 rounded bg-white/20" />
            ) : (
              <span className="text-5xl font-black text-white tabular-nums">
                {displayPrice != null ? fmtPrice(displayPrice) : "—"}
              </span>
            )}
            {!priceLoading && isDiscount && (
              <span className="text-2xl line-through text-white/35">
                {pricingBase != null ? fmtPrice(pricingBase) : null}
              </span>
            )}
            <span className="text-white/50 text-sm">{t("per_report")}</span>
            {!priceLoading && isDiscount && (
              <Badge className="bg-orange-500 text-white border-0">{t("limited_time")}</Badge>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild size="lg" className="h-13 px-10 text-base font-bold bg-white text-primary hover:bg-white/90 shadow-xl shadow-black/20">
              <Link href={`/${language}/pricing`}>{t("get_started")}</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 border-white/30 text-white hover:bg-white/10 hover:text-white">
              <Link href={`/${language}/pricing`}>{t("see_whats_included")}</Link>
            </Button>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
