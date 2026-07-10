import { useRef, useState, useEffect, useMemo, lazy, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { decodeVinLocalFree } from "@workspace/vin-decode";
import { useTranslation } from "@/i18n/context";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { useDisplayPrice } from "@/hooks/use-display-price";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ShieldCheck,
  Zap, ArrowRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SEOHead, usePageSeo } from "@/components/seo";
import { VinDemoCard } from "@/components/vin-demo-card";
import { DeferredSection } from "@/components/deferred-section";
import { SectionFallback } from "@/components/section-fallback";
import { CountryRisksIncludedSection } from "@/components/country-risks-included";
import { cn } from "@/lib/utils";
import { getVinValidationErrorKey } from "@/lib/vin-validation";
import { redirectGuestForVinCheckout } from "@/lib/checkout-vin-flow";
import { isTrustworthyVinDecode, shouldShowPendingVinDoubleCheck } from "@/lib/vin-decode-preview";
import { FlagImg } from "@/components/flag-img";
import { HeroVinForm } from "@/components/hero-vin-form";
import { VinDecodeRecheckHint } from "@/components/vin-decode-recheck-hint";
import { VinPendingDoubleCheckHint } from "@/components/vin-pending-double-check-hint";
import { useVinLookupDisabledForUser } from "@/hooks/use-site-public-flags";

const CompareTable = lazy(() =>
  import("@/components/compare-table").then((m) => ({ default: m.CompareTable })),
);
const WhatWeCheckSection = lazy(() =>
  import("@/components/what-we-check-section").then((m) => ({ default: m.WhatWeCheckSection })),
);

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

type Severity = "high" | "medium" | "low";

interface CountryMeta {
  flagImg: string;
  gradient: string;
  vinPrefix: string;
  totalVehicles: string;
  topRisk: string;
  popularBrands: string[];
  issueIndices: number[];
  issueSeverities: Severity[];
  vinExample: string;
  vinSegments: { chars: string; color: string; labelKey: string }[];
}

const COUNTRY_META: Record<string, CountryMeta> = {
  usa: {
    flagImg: "us",
    gradient: "from-blue-900 via-blue-800 to-red-900",
    vinPrefix: "1, 4, 5",
    totalVehicles: "280M+",
    topRisk: "Odometer rollback",
    popularBrands: ["Ford", "Chevrolet", "Toyota", "Honda", "Ram", "GMC", "Jeep", "Tesla"],
    issueIndices: [0, 1, 2],
    issueSeverities: ["high", "high", "medium"],
    vinExample: "1HGBH41JXMN109186",
    vinSegments: [
      { chars: "1",         color: "bg-primary",    labelKey: "vin_segment_country" },
      { chars: "HG",        color: "bg-blue-500",   labelKey: "vin_segment_maker"   },
      { chars: "BH4",       color: "bg-violet-500", labelKey: "vin_segment_model"   },
      { chars: "1",         color: "bg-amber-500",  labelKey: "vin_segment_check"   },
      { chars: "XMN109186", color: "bg-slate-500",  labelKey: "vin_segment_serial"  },
    ],
  },
  korea: {
    flagImg: "kr",
    gradient: "from-indigo-900 via-slate-800 to-red-900",
    vinPrefix: "K",
    totalVehicles: "25M+",
    topRisk: "Hidden accidents",
    popularBrands: ["Hyundai", "Kia", "Genesis", "Ssangyong", "GM Korea", "Renault Korea", "BMW", "Toyota"],
    issueIndices: [0, 1, 3],
    issueSeverities: ["high", "high", "medium"],
    vinExample: "KMHD35LE1JA103867",
    vinSegments: [
      { chars: "K",          color: "bg-primary",    labelKey: "vin_segment_country" },
      { chars: "MH",         color: "bg-blue-500",   labelKey: "vin_segment_maker"   },
      { chars: "D35",        color: "bg-violet-500", labelKey: "vin_segment_model"   },
      { chars: "L",          color: "bg-amber-500",  labelKey: "vin_segment_check"   },
      { chars: "E0JA103867", color: "bg-slate-500",  labelKey: "vin_segment_serial"  },
    ],
  },
  canada: {
    flagImg: "ca",
    gradient: "from-red-900 via-slate-800 to-red-950",
    vinPrefix: "2",
    totalVehicles: "30M+",
    topRisk: "Branded titles",
    popularBrands: ["Toyota", "Honda", "Ford", "Chevrolet", "GMC", "Ram", "Hyundai", "Kia"],
    issueIndices: [0, 1, 2],
    issueSeverities: ["high", "high", "medium"],
    vinExample: "2HGFB2F59CH501000",
    vinSegments: [
      { chars: "2",          color: "bg-primary",    labelKey: "vin_segment_country" },
      { chars: "HG",         color: "bg-blue-500",   labelKey: "vin_segment_maker"   },
      { chars: "FB2",        color: "bg-violet-500", labelKey: "vin_segment_model"   },
      { chars: "F",          color: "bg-amber-500",  labelKey: "vin_segment_check"   },
      { chars: "59CH501000", color: "bg-slate-500",  labelKey: "vin_segment_serial"  },
    ],
  },
};

function useCountryContent(slug: string, t: (k: string) => string) {
  if (!(slug in COUNTRY_META)) return null;
  const meta = COUNTRY_META[slug];
  return {
    description: t(`country_${slug}_description`),
    issues: meta.issueIndices.map(i => t(`country_${slug}_issue_${i}`)),
    included: [0, 1, 2, 3, 4, 5].map(i => t(`country_${slug}_included_${i}`)),
    faq:      [0, 1, 2].map(i => ({ q: t(`country_${slug}_faq_${i}_q`), a: t(`country_${slug}_faq_${i}_a`) })),
  };
}

const COUNTRY_CYCLING_SUFFIXES = ["_cycling_0", "_cycling_1", "_cycling_2", "_cycling_3"] as const;

function CountryCyclingHeadline({ slug }: { slug: string }) {
  const { t } = useTranslation();
  const keys = COUNTRY_CYCLING_SUFFIXES.map(s => `country_${slug}${s}`);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIdx(i => (i + 1) % keys.length), 2600);
    return () => clearInterval(id);
  }, [keys.length]);

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
        {t(keys[idx])}
      </motion.span>
    </AnimatePresence>
  );
}

interface Props { params: { lang: string; country: string } }

export default function CountryPage({ params }: Props) {
  const { t, language } = useTranslation();
  const [, setLocation] = useLocation();
  const { isSignedIn, user } = useAuth();
  const [vin, setVin] = useState("");
  const [error, setError] = useState("");
  const vinRef  = useRef<HTMLInputElement>(null);
  const heroRef = useRef<HTMLElement>(null);

  const slug        = params.country.toLowerCase();
  const meta        = COUNTRY_META[slug];
  const content     = useCountryContent(slug, t);
  const countryName = t(`country_${slug}_name`);
  const isKnownCountry = slug in COUNTRY_META;

  const normalizedCountryVin = vin.trim().toUpperCase();
  const countryLocalDecode = useMemo(
    () => (normalizedCountryVin.length === 17 ? decodeVinLocalFree(normalizedCountryVin) : null),
    [normalizedCountryVin],
  );
  const showVinRecheckHint =
    isKnownCountry
    && normalizedCountryVin.length === 17
    && !getVinValidationErrorKey(normalizedCountryVin)
    && !!countryLocalDecode
    && !isTrustworthyVinDecode({
      vin: normalizedCountryVin,
      make: countryLocalDecode.make,
      model: countryLocalDecode.model,
      year: countryLocalDecode.year ?? null,
    });
  const countryDecodeTrustworthy = !!countryLocalDecode && isTrustworthyVinDecode({
    vin: normalizedCountryVin,
    make: countryLocalDecode.make,
    model: countryLocalDecode.model,
    year: countryLocalDecode.year ?? null,
  });
  const { data: countryPeek } = useQuery({
    queryKey: ["/api/vin/peek", "country", slug, normalizedCountryVin],
    enabled: isSignedIn && isKnownCountry && normalizedCountryVin.length === 17 && countryDecodeTrustworthy,
    queryFn: async () => {
      const r = await fetch(`${basePath}/api/vin/peek/${encodeURIComponent(normalizedCountryVin)}`, {
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
  const showCountryPendingDoubleCheck = isKnownCountry && !!countryPeek && shouldShowPendingVinDoubleCheck({
    vin: normalizedCountryVin,
    make: countryLocalDecode?.make,
    model: countryLocalDecode?.model,
    year: countryLocalDecode?.year ?? null,
    ...countryPeek,
  });
  const vinFormAlerts = (showVinRecheckHint || showCountryPendingDoubleCheck) ? (
    <AnimatePresence>
      {showVinRecheckHint && (
        <motion.div
          key="vin-recheck-hint"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.25 }}
        >
          <VinDecodeRecheckHint />
        </motion.div>
      )}
      {showCountryPendingDoubleCheck && (
        <motion.div
          key="vin-pending-double-check"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.25 }}
        >
          <VinPendingDoubleCheckHint />
        </motion.div>
      )}
    </AnimatePresence>
  ) : null;

  const countryKey = slug === "korea"
    ? "country_korea"
    : slug === "canada"
      ? "country_canada"
      : slug === "usa"
        ? "country_usa"
        : "not_found";
  const seo = usePageSeo(countryKey as "country_usa" | "country_korea" | "country_canada" | "not_found");

  const {
    displayPrice: rawDisplay, basePrice: rawBase,
    isDiscount, loading: priceLoading, currencySymbol, fmtPrice,
  } = useDisplayPrice();
  const displayPrice = rawDisplay ?? 0;
  const basePrice    = rawBase    ?? 0;

  if (!meta || !content) {
    return (
      <>
        <SEOHead title={seo.title} description={seo.description} lang={seo.lang} noIndex favicons={seo.favicons} />
        <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
          <h1 className="text-3xl font-bold">{t("country_not_found")}</h1>
          <Button asChild><Link href={`/${language}`}>{t("back_to_home")}</Link></Button>
        </div>
      </>
    );
  }

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

  const focusVin = () => {
    heroRef.current?.scrollIntoView({ behavior: "smooth" });
    setTimeout(() => vinRef.current?.focus(), 400);
  };

  const otherCountries = Object.entries(COUNTRY_META).filter(([k]) => k !== slug);

  return (
    <div>
      <SEOHead title={seo.title} description={seo.description} lang={seo.lang} canonicalPath={seo.canonicalPath} ogImage={seo.ogImage} ogImageAlt={seo.ogImageAlt} favicons={seo.favicons} jsonLd={seo.jsonLd} />

      {/* ─────────────────────── HERO ─────────────────────── */}
      <section ref={heroRef} className="relative overflow-x-hidden px-4 -mt-[var(--site-header-offset,84px)] pt-[calc(2rem+var(--site-header-offset,84px))] md:pt-[calc(3.5rem+var(--site-header-offset,84px))] pb-0">
        {/* Base: light = pale green gradient, dark = very dark green-black */}
        <div className="absolute inset-0 -z-20 bg-gradient-to-b from-emerald-50/70 via-emerald-50/20 to-background dark:hidden" />
        <div className="absolute inset-0 -z-20 hidden dark:block" style={{ background: "#040d08" }} />
        {/* Dot grid — green in both modes */}
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(#16a34a_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.07] dark:opacity-[0.20]" />
        {/* Brand green glow from top */}
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_55%_at_50%_-5%,rgba(34,197,94,0.20),transparent)] dark:bg-[radial-gradient(ellipse_80%_60%_at_50%_-5%,rgba(34,197,94,0.42),transparent)]" />
        {/* Secondary accent glow bottom-left in dark */}
        <div className="absolute inset-0 -z-10 hidden dark:block bg-[radial-gradient(ellipse_50%_40%_at_0%_100%,rgba(34,197,94,0.08),transparent)]" />
        {/* Fade to background */}
        <div className="absolute bottom-0 left-0 right-0 h-40 -z-10 bg-gradient-to-t from-background to-transparent" />

        <div className="max-w-7xl mx-auto grid lg:grid-cols-[minmax(0,1fr)_minmax(280px,380px)] gap-8 lg:gap-10 items-center pb-20">

          {/* Left */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-8 pt-2 md:pt-6 lg:pt-14 relative z-20 text-center lg:text-start"
          >
            {/* Desktop eyebrow flag */}
            <div className="hidden lg:flex items-center justify-start gap-3">
              <FlagImg
                code={meta.flagImg}
                size={40}
                priority
                className="rounded-md shadow-md ring-1 ring-black/10"
              />
            </div>

            {/* Headline */}
            <h1 className="text-[2.65rem] sm:text-4xl md:text-5xl lg:text-[3.35rem] xl:text-[3.65rem] font-extrabold tracking-tight leading-[1.1]">
              {(() => {
                const verb = t(`country_${slug}_headline_verb`);
                return verb ? <>{verb}{" "}</> : null;
              })()}
              <CountryCyclingHeadline slug={slug} />
              <br />
              {/* Mobile — flag beside country name on its own line */}
              <span className="lg:hidden text-foreground/90 inline-flex items-center justify-center gap-x-2 gap-y-1 flex-wrap">
                <span>{t(`country_${slug}_headline_origin_prefix`)}</span>
                <span className="inline-flex items-center gap-2.5 whitespace-nowrap">
                  <FlagImg
                    code={meta.flagImg}
                    size={44}
                    priority
                    className="rounded-md shadow-md ring-1 ring-black/10 shrink-0"
                  />
                  <span className="text-foreground font-extrabold">{countryName}</span>
                </span>
              </span>
              {/* Desktop — full origin line (flag stays in eyebrow above) */}
              <span className="hidden lg:inline text-foreground/90">
                {t(`country_${slug}_headline_origin`)}
              </span>
            </h1>

            <p className="text-sm md:text-base text-muted-foreground max-w-lg mx-auto lg:mx-0 leading-relaxed">
              {content.description}
            </p>

            {/* VIN form */}
            <HeroVinForm
              vin={vin}
              onVinChange={(v) => { setVin(v); setError(""); }}
              onSubmit={handleCheck}
              error={error}
              disabled={vinLookupDisabled}
              placeholder={language === "sq" ? t("vin_placeholder_chassis") : t("vin_placeholder")}
              inputRef={vinRef}
              className="relative z-20 lg:mx-0"
              alerts={vinFormAlerts}
            />
          </motion.div>

          {/* Right */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.13 }}
            className="relative z-0 lg:sticky lg:top-8 pt-4 space-y-3 lg:overflow-visible hidden lg:flex flex-col items-stretch w-full min-w-0 lg:max-w-[380px] lg:justify-self-end"
          >
            <VinDemoCard country={slug as "usa" | "korea" | "canada"} showcase />

            {/* Price line */}
            <div className="px-1 flex items-center justify-center lg:justify-start gap-2 text-sm text-muted-foreground text-center lg:text-start max-w-lg w-full">
              <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
              <span>
                {t("country_cta_desc")}{" "}
                {priceLoading ? (
                  <Skeleton className="h-4 w-12 rounded inline-block align-middle" />
                ) : (
                  <span className="inline-flex items-baseline gap-1.5">
                    <span className="font-bold text-primary">{fmtPrice(displayPrice)}</span>
                    {isDiscount && basePrice > displayPrice && (
                      <span className="line-through text-muted-foreground/60 text-xs">{fmtPrice(basePrice)}</span>
                    )}
                  </span>
                )}
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─────────────────────── BRANDS BAR ─────────────────────── */}
      <div className="border-y bg-muted/25 dark:bg-white/[0.02]">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-wrap items-center justify-center lg:justify-start gap-2.5">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest shrink-0 mr-1">
            {t("popular_brands")}
          </span>
          {meta.popularBrands.map((brand) => (
            <button
              key={brand}
              type="button"
              onClick={focusVin}
              className="text-xs bg-background border rounded-full px-3.5 py-1.5 font-medium hover:border-primary hover:text-primary hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-sm"
            >
              {brand}
            </button>
          ))}
        </div>
      </div>

      {/* ─────────────────────── WHAT WE CHECK ─────────────────────── */}
      <DeferredSection minHeight={320}>
        <Suspense fallback={<SectionFallback minHeight={320} />}>
          <WhatWeCheckSection market={slug as "usa" | "korea" | "canada"} />
        </Suspense>
      </DeferredSection>

      {/* ─────────────────────── RISKS + INCLUDED ─────────────────────── */}
      <DeferredSection minHeight={360}>
      <CountryRisksIncludedSection
        slug={slug as "usa" | "korea" | "canada"}
        issues={content.issues}
        included={content.included}
        severities={meta.issueSeverities}
      />
      </DeferredSection>

      {/* ─────────────────────── VIN ANATOMY ─────────────────────── */}
      <section className="py-10 md:py-14 px-4">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-6 space-y-1.5"
          >
            <h2 className="text-xl md:text-2xl font-extrabold tracking-tight">{t("vin_anatomy_title")}</h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="rounded-2xl border bg-background shadow-sm p-5 space-y-4"
          >
            {/* Character blocks */}
            <div className="flex flex-wrap gap-1.5 justify-center">
              {meta.vinSegments.map(({ chars, color }, si) =>
                chars.split("").map((ch, ci) => (
                  <div
                    key={`${si}-${ci}`}
                    className={cn("h-9 w-8 rounded-lg text-white font-mono font-black text-xs flex items-center justify-center shadow-sm", color)}
                  >
                    {ch}
                  </div>
                ))
              )}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-2 justify-center">
              {meta.vinSegments.map(({ chars, color, labelKey }) => (
                <div key={labelKey} className="flex items-center gap-1.5 bg-muted/50 rounded-lg px-2.5 py-1">
                  <div className={cn("h-2 w-2 rounded-full shrink-0", color)} />
                  <span className="font-mono text-[11px] font-bold">{chars.length > 5 ? chars.slice(0, 3) + "…" : chars}</span>
                  <span className="text-[11px] text-muted-foreground">= {t(labelKey)}</span>
                </div>
              ))}
            </div>

            <div className="rounded-xl bg-muted/50 border border-dashed px-4 py-2.5 text-center">
              <p className="text-xs text-muted-foreground/60 font-mono tracking-[0.2em]">{meta.vinExample}</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─────────────────────── FAQ ─────────────────────── */}
      <section className="py-20 md:py-28 px-4 bg-muted/25 dark:bg-white/[0.015] border-t">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12 space-y-3"
          >
            <div className="inline-flex items-center gap-2.5 rounded-full border border-border bg-background px-4 py-1.5 text-xs font-semibold text-muted-foreground shadow-sm">
              <FlagImg code={meta.flagImg} size={16} className="rounded-sm" />
              {countryName} {t("country_vin_checks")}
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">{t("faq")}</h2>
          </motion.div>

          <Accordion type="single" collapsible className="space-y-2">
            {content.faq.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <AccordionItem
                  value={`faq-${i}`}
                  className="rounded-2xl border bg-background px-5 data-[state=open]:shadow-md data-[state=open]:border-primary/25 transition-all overflow-hidden"
                >
                  <AccordionTrigger className="font-semibold text-left py-5 hover:no-underline gap-4 text-sm">
                    <span className="flex items-center gap-3">
                      <span className="h-6 w-6 rounded-lg bg-primary/10 text-primary text-xs font-black flex items-center justify-center shrink-0">
                        {i + 1}
                      </span>
                      {item.q}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-5 pl-9">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ─────────────────────── CTA ─────────────────────── */}
      <section className="relative overflow-hidden bg-[#070c18] py-20 md:py-28 px-4">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_50%_0%,rgba(34,197,94,0.17),transparent)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(#1e2d40_1px,transparent_1px)] [background-size:28px_28px] opacity-[0.22] pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/25 to-transparent" />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto text-center space-y-8 relative z-10"
        >
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-white/[0.06] backdrop-blur-sm px-4 py-1.5 text-sm font-semibold text-white/70">
              <FlagImg code={meta.flagImg} size={24} className="rounded-sm shadow-sm" />
              {countryName} · {t("country_vin_checks")}
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white leading-tight tracking-tight">
              {t("country_cta_heading").replace("{country}", countryName)}
            </h2>
            <div className="text-white/45 text-base leading-relaxed">
              {t("country_cta_desc")}{" "}
              {priceLoading ? (
                <Skeleton className="h-5 w-14 rounded inline-block align-middle bg-white/15" />
              ) : (
                <span className="inline-flex items-baseline gap-2">
                  <span className="font-bold text-white">{fmtPrice(displayPrice)}</span>
                  {isDiscount && basePrice > displayPrice && (
                    <span className="line-through text-white/35 tabular-nums">{fmtPrice(basePrice)}</span>
                  )}
                </span>
              )}
            </div>
          </div>

          <HeroVinForm
            vin={vin}
            onVinChange={(v) => { setVin(v); setError(""); }}
            onSubmit={handleCheck}
            error={error}
            disabled={vinLookupDisabled}
            placeholder={language === "sq" ? t("vin_placeholder_chassis") : t("vin_placeholder")}
            helpVariant="on-dark"
            alerts={vinFormAlerts}
          />

          <div className="flex items-center justify-center gap-6 flex-wrap text-xs text-white/35">
            <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-white/45" />{t("trust_secure_payment")}</span>
            <span className="flex items-center gap-1.5"><Zap className="h-3.5 w-3.5 text-white/45" />{t("trust_instant_report")}</span>
          </div>
        </motion.div>
      </section>

      {/* ─────────────────────── COMPARISON TABLE ─────────────────────── */}
      <DeferredSection minHeight={280}>
        <Suspense fallback={<SectionFallback minHeight={280} />}>
          <CompareTable market={slug === "korea" ? "korea" : slug === "canada" ? "canada" : "usa"} />
        </Suspense>
      </DeferredSection>

      {/* ─────────────────────── OTHER COUNTRIES ─────────────────────── */}
      <section className="py-12 md:py-16 px-4 bg-muted/20 border-t">
        <div className="max-w-4xl mx-auto space-y-6">
          <h3 className="text-lg font-bold text-muted-foreground text-center lg:text-start">{t("browse_countries")}</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {otherCountries.map(([key, c], i) => (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -3, transition: { duration: 0.2 } }}
              >
                <Link
                  href={`/${language}/cars/${key}`}
                  className={cn(
                    "group relative block rounded-2xl overflow-hidden p-7",
                    "bg-gradient-to-br", c.gradient,
                    "hover:shadow-2xl hover:shadow-black/30 transition-all duration-300"
                  )}
                >
                  <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/2" />
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(ellipse_50%_60%_at_80%_20%,rgba(255,255,255,0.08),transparent)]" />
                  <div className="relative z-10 space-y-4">
                    <div className="flex items-center gap-3">
                      <FlagImg code={c.flagImg} size={60} className="rounded-md shadow-md group-hover:scale-110 transition-transform duration-300" />
                      <div>
                        <h4 className="text-xl font-black text-white">{t(`country_${key}_name`)}</h4>
                        <p className="text-white/50 text-xs">{c.totalVehicles} {t("country_registered_vehicles")}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {c.popularBrands.slice(0, 4).map(brand => (
                        <span key={brand} className="text-[10px] bg-white/10 text-white/70 px-2 py-0.5 rounded-md border border-white/10">
                          {brand}
                        </span>
                      ))}
                    </div>
                    <div className="inline-flex items-center gap-1.5 text-white/80 text-sm font-semibold bg-white/10 border border-white/15 rounded-xl px-3 py-1.5 group-hover:bg-white/20 transition-colors">
                      {t("vin_check_for")} {t(`country_${key}_name`)}
                      <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
