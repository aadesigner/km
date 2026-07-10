import { useTranslation } from "@/i18n/context";
import { useDisplayPrice } from "@/hooks/use-display-price";
import { useAuth } from "@/lib/auth-context";
import { useLocation } from "wouter";
import { useState, useMemo, type FormEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle2, ShieldCheck, RotateCcw,
  Sparkles, CreditCard, UserCircle, Zap, FileText,
} from "lucide-react";
import { motion } from "framer-motion";
import { SEOHead, usePageSeo, productOfferJsonLd } from "@/components/seo";
import { SITE_ORIGIN } from "@/lib/seo-config";
import { DEFAULT_PRICING } from "@/lib/pricing-defaults";
import { getTestimonials } from "@/data/testimonials";
import { TestimonialsSlider } from "@/components/testimonials-slider";
import { HeroVinForm } from "@/components/hero-vin-form";
import { redirectGuestForVinCheckout } from "@/lib/checkout-vin-flow";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const CARD_FEATURES = [
  "full_vehicle_history",
  "pricing_feature_accidents",
  "mileage_verification",
  "theft_records",
  "auction_history",
  "technical_specs",
] as const;

const SEO_INCLUDED = [
  { feature: "full_vehicle_history", desc: "desc_vehicle_history" },
  { feature: "pricing_feature_accidents", desc: "desc_accident_records" },
  { feature: "mileage_verification", desc: "desc_mileage_verification" },
  { feature: "theft_records", desc: "desc_theft_records" },
  { feature: "auction_history", desc: "desc_auction_history" },
  { feature: "technical_specs", desc: "desc_technical_specs" },
] as const;

const SEO_VALUE_PROPS = [
  { icon: CreditCard, titleKey: "pricing_seo_value_pay_title", descKey: "pricing_seo_value_pay_desc" },
  { icon: UserCircle, titleKey: "pricing_seo_value_account_title", descKey: "pricing_seo_value_account_desc" },
  { icon: Zap, titleKey: "pricing_seo_value_delivery_title", descKey: "pricing_seo_value_delivery_desc" },
] as const;

function PricingHeroPrice({
  amount,
  baseAmount,
  currencySymbol,
  loading,
  showDiscount,
}: {
  amount: number;
  baseAmount: number | null;
  currencySymbol: string;
  loading: boolean;
  showDiscount: boolean;
}) {
  const [whole, fraction] = amount.toFixed(2).split(".");

  if (loading) {
    return <Skeleton className="h-14 w-44 mx-auto rounded-lg bg-white/10" />;
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="inline-flex items-end justify-center gap-2 sm:gap-3 tabular-nums leading-none">
        {showDiscount && baseAmount != null && baseAmount > amount && (
          <span className="text-lg sm:text-xl font-medium text-white/40 line-through pb-1 sm:pb-1.5">
            {currencySymbol}
            {baseAmount.toFixed(2)}
          </span>
        )}
        <div className="inline-flex items-end leading-none">
          <span className="text-xl sm:text-2xl font-semibold text-white/90 pb-1 sm:pb-1.5 pe-0.5">
            {currencySymbol}
          </span>
          <span className="text-[3.35rem] sm:text-[3.75rem] font-black text-white tracking-tighter">
            {whole}
          </span>
          <span className="text-xl sm:text-2xl font-bold text-white/80 pb-1 sm:pb-1.5 ps-1 sm:ps-1.5">
            .{fraction}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function Pricing() {
  const { t, language } = useTranslation();
  const {
    displayPrice: rawDisplayPrice,
    basePrice,
    isDiscount: discountEnabled,
    loading: priceLoading,
    currencySymbol,
    currency,
  } = useDisplayPrice();
  const { isSignedIn } = useAuth();
  const [, setLocation] = useLocation();
  const [vin, setVin] = useState("");
  const [vinError, setVinError] = useState("");

  const TESTIMONIALS = useMemo(() => getTestimonials(language), [language]);
  const displayPrice = rawDisplayPrice ?? 0;
  const savePct =
    discountEnabled && basePrice
      ? Math.round(((basePrice - displayPrice) / basePrice) * 100)
      : 0;

  const handleGetReport = (e?: FormEvent) => {
    e?.preventDefault();
    const normalized = vin.trim().toUpperCase();
    if (!normalized) {
      setVinError(t("vin_error_required"));
      return;
    }
    if (normalized.length !== 17) {
      setVinError(t("vin_error_length"));
      return;
    }
    setVinError("");
    if (!isSignedIn) {
      const authPath = redirectGuestForVinCheckout(normalized, language);
      if (authPath) setLocation(authPath);
      return;
    }
    sessionStorage.setItem("checkout_vin", normalized);
    setLocation(`/${language}/checkout`);
  };

  const faqs = [
    { q: t("faq_1_q"), a: t("faq_1_a") },
    { q: t("faq_2_q"), a: t("faq_2_a") },
    { q: t("faq_3_q"), a: t("faq_3_a") },
  ];

  const seo = usePageSeo("pricing");

  const pricingJsonLd = useMemo(() => {
    const price = rawDisplayPrice ?? (discountEnabled ? DEFAULT_PRICING.discountPrice : DEFAULT_PRICING.basePrice);
    return productOfferJsonLd({
      name: t("pricing_seo_product_name"),
      description: seo.description,
      url: `${SITE_ORIGIN}/${language}/pricing`,
      price,
      currency,
    });
  }, [rawDisplayPrice, discountEnabled, t, seo.description, language, currency]);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={seo.title}
        description={seo.description}
        lang={seo.lang}
        canonicalPath={seo.canonicalPath}
        jsonLd={pricingJsonLd}
      />

      {/* Hero — split layout + premium card */}
      <section className="relative overflow-hidden border-b border-border/60 -mt-[var(--site-header-offset,84px)] pt-[calc(2.5rem+var(--site-header-offset,84px))] pb-10 sm:pt-[calc(3rem+var(--site-header-offset,84px))] sm:pb-12 md:pt-[calc(4rem+var(--site-header-offset,84px))] md:pb-16 lg:pt-[calc(5rem+var(--site-header-offset,84px))] lg:pb-20">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-50/80 via-emerald-50/25 to-background dark:hidden" />
        <div className="absolute inset-0 hidden dark:block bg-[#040d08]" />
        <div className="absolute inset-0 bg-[radial-gradient(#16a34a_1px,transparent_1px)] [background-size:28px_28px] opacity-[0.06] dark:opacity-[0.18]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_75%_55%_at_15%_-5%,rgba(34,197,94,0.18),transparent)] dark:bg-[radial-gradient(ellipse_75%_55%_at_15%_-5%,rgba(34,197,94,0.35),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_45%_at_95%_20%,rgba(34,197,94,0.10),transparent)] dark:bg-[radial-gradient(ellipse_50%_45%_at_95%_20%,rgba(34,197,94,0.22),transparent)]" />
        <div
          aria-hidden
          className="hero-orb-a pointer-events-none absolute -top-10 left-[5%] h-48 w-48 rounded-full bg-primary/10 blur-3xl"
        />
        <div
          aria-hidden
          className="hero-orb-b pointer-events-none absolute top-24 right-[8%] h-40 w-40 rounded-full bg-emerald-400/10 blur-3xl hidden sm:block"
        />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col gap-8 sm:gap-10 lg:grid lg:grid-cols-[1fr_minmax(340px,440px)] lg:gap-x-12 xl:gap-x-14 lg:items-center">
            {/* Left column — split on mobile; vertically centered with card on desktop */}
            <div className="contents lg:flex lg:flex-col lg:justify-center lg:gap-6 lg:col-start-1 lg:row-start-1">
            {/* Headline */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="order-1 text-center lg:text-left lg:order-none space-y-3 sm:space-y-4"
            >
              <span className="inline-flex items-center gap-1.5 text-xs sm:text-[13px] font-semibold uppercase tracking-widest text-primary bg-primary/10 border border-primary/15 px-3.5 py-1.5 rounded-full">
                <Sparkles className="h-3.5 w-3.5" />
                {t("pricing_hero_eyebrow")}
              </span>
              <h1 className="text-[2.9rem] sm:text-5xl md:text-5xl lg:text-[3.5rem] xl:text-[3.85rem] font-black tracking-tight leading-[1.08]">
                {t("pricing_hero_title_1")}
                <br />
                <span className="block text-primary">
                  {t("pricing_hero_title_2")}
                </span>
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground dark:text-white/60 leading-relaxed max-w-xl mx-auto lg:mx-0">
                {t("pricing_hero_lead")}
              </p>
            </motion.div>

            {/* Proof + trust — below card on mobile */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.5 }}
              className="order-3 lg:order-none text-center lg:text-left space-y-3 sm:space-y-4 lg:space-y-3"
            >
              <div className="hidden sm:flex justify-center lg:justify-start mt-3 sm:mt-4 lg:mt-5">
                <p className="inline-flex items-start gap-1.5 text-[11px] sm:text-xs leading-snug text-muted-foreground dark:text-white/50 max-w-[19rem] sm:max-w-md text-left">
                  <RotateCcw className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                  <span>{t("money_back")}</span>
                </p>
              </div>
            </motion.div>
            </div>

            {/* Pricing card — right after headline on mobile */}
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.55 }}
              className="order-2 relative w-full max-w-lg mx-auto lg:max-w-none lg:mx-0 lg:order-none lg:col-start-2 lg:row-start-1 lg:sticky lg:top-[calc(var(--site-header-offset,84px)+1rem)]"
            >
              <div
                aria-hidden
                className="absolute -inset-1.5 rounded-[1.85rem] bg-gradient-to-b from-primary/35 via-emerald-400/25 to-primary/15 dark:from-primary/50 dark:via-emerald-400/35 dark:to-primary/20 blur-lg opacity-70 dark:opacity-85"
              />

              <div className="relative rounded-[1.75rem] border border-border/70 dark:border-white/20 bg-card shadow-2xl shadow-black/10 dark:shadow-black/40 overflow-hidden ring-1 ring-primary/15">
                {/* Price panel */}
                <div className="relative px-7 sm:px-8 pt-7 sm:pt-8 pb-6 text-center bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 dark:from-[#010a05] dark:via-[#052e16] dark:to-[#047857]">
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_80%_at_50%_-30%,rgba(255,255,255,0.18),transparent)] dark:bg-[radial-gradient(ellipse_90%_80%_at_50%_-30%,rgba(34,197,94,0.45),transparent)] pointer-events-none" />
                  <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:18px_18px] opacity-[0.12] dark:opacity-[0.05] pointer-events-none" />
                  <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent dark:via-emerald-400/50" />

                  {discountEnabled && savePct > 0 && (
                    <Badge className="absolute top-4 right-4 rounded-full bg-orange-500 text-white border-0 px-2.5 py-0.5 text-[10px] font-bold shadow-lg shadow-orange-500/35">
                      {t("pricing_save").replace("{n}", String(savePct))}
                    </Badge>
                  )}

                  <div className="relative space-y-2">
                    <Badge className="rounded-full bg-white/20 text-white border-white/25 hover:bg-white/20 dark:bg-white/10 dark:text-emerald-100 dark:border-white/15 text-[10px] sm:text-[11px] font-semibold tracking-wide px-2.5 py-0.5">
                      {t("pricing_report_title")}
                    </Badge>

                    <PricingHeroPrice
                      amount={displayPrice}
                      baseAmount={discountEnabled ? (basePrice ?? null) : null}
                      currencySymbol={currencySymbol}
                      loading={priceLoading}
                      showDiscount={discountEnabled}
                    />

                    <p className="text-sm text-white/75 dark:text-white/55">{t("per_report")}</p>
                  </div>
                </div>

                {/* Features */}
                <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-border/60 bg-muted/20 dark:bg-white/[0.02]">
                  <div className="grid grid-cols-1 min-[400px]:grid-cols-2 gap-x-4 gap-y-2.5 max-w-[19rem] min-[400px]:max-w-none mx-auto min-[400px]:mx-0">
                    {CARD_FEATURES.map((key) => (
                      <div key={key} className="flex items-center gap-2 min-w-0 justify-center min-[400px]:justify-start">
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                        <span className="text-xs sm:text-sm font-medium leading-snug">{t(key)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* VIN + CTA */}
                <div className="px-5 sm:px-6 py-5 sm:py-6 space-y-3.5 bg-background">
                  <HeroVinForm
                    vin={vin}
                    onVinChange={(v) => {
                      setVin(v);
                      setVinError("");
                    }}
                    onSubmit={handleGetReport}
                    error={vinError}
                    placeholder={t("vin_placeholder")}
                    submitLabelKey="check_vin_short"
                    showHelp={false}
                    className="max-w-none mx-0 [&_.hero-vin-field]:rounded-xl [&_input]:h-[3.25rem] [&_input]:sm:h-14 [&_input]:text-base [&_input]:pr-[5.5rem] [&_button]:h-10 [&_button]:sm:h-11 [&_button]:px-4 [&_button]:text-sm"
                  />

                  <div className="flex flex-row flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] sm:text-xs text-muted-foreground text-center">
                    <span className="inline-flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3 text-primary shrink-0" />
                      {t("trust_secure_payment")}
                    </span>
                    <span className="text-border">·</span>
                    <span className="inline-flex items-center gap-1">
                      <RotateCcw className="h-3 w-3 text-primary shrink-0" />
                      {t("trust_money_back")}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* SEO — what's included + pricing model */}
      <section className="relative overflow-hidden border-b border-border/60 bg-muted/40 dark:bg-[#060a12] py-14 md:py-20 px-4">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_0%,hsl(var(--primary)/0.08),transparent)] dark:bg-[radial-gradient(ellipse_70%_60%_at_50%_0%,rgba(34,197,94,0.12),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(hsl(var(--foreground)/0.04)_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-60 dark:opacity-50" />

        <div className="max-w-6xl mx-auto relative space-y-10 md:space-y-14">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.45 }}
            className="text-center max-w-3xl mx-auto space-y-4"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3.5 py-1 text-xs font-semibold text-primary dark:border-white/15 dark:bg-white/5">
              <FileText className="h-3.5 w-3.5" />
              {t("pricing_included_label")}
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-[2.35rem] font-extrabold tracking-tight leading-[1.12]">
              {t("pricing_seo_title")}
            </h2>
            <p className="text-base md:text-lg text-muted-foreground dark:text-white/55 leading-relaxed">
              {t("pricing_seo_sub")}
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-3 gap-4 md:gap-5">
            {SEO_VALUE_PROPS.map(({ icon: Icon, titleKey, descKey }, i) => (
              <motion.div
                key={titleKey}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                className="rounded-2xl border border-border/70 bg-card/90 dark:border-white/10 dark:bg-white/[0.05] p-5 md:p-6 shadow-sm hover:border-primary/30 hover:shadow-md dark:hover:border-primary/30 transition-all"
              >
                <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-primary to-emerald-400 flex items-center justify-center mb-4 shadow-md shadow-primary/20">
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-bold text-foreground dark:text-white text-base mb-2 leading-snug">
                  {t(titleKey)}
                </h3>
                <p className="text-sm text-muted-foreground dark:text-white/50 leading-relaxed">
                  {t(descKey)}
                </p>
              </motion.div>
            ))}
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {SEO_INCLUDED.map(({ feature, desc }, i) => (
              <motion.div
                key={feature}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: i * 0.05, duration: 0.35 }}
                className="rounded-2xl border border-border/70 bg-background/80 dark:border-white/10 dark:bg-white/[0.04] p-5 hover:border-primary/25 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div className="space-y-1.5 min-w-0">
                    <h3 className="font-semibold text-sm sm:text-[15px] leading-snug">
                      {t(feature)}
                    </h3>
                    <p className="text-sm text-muted-foreground dark:text-white/50 leading-relaxed">
                      {t(desc)}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <TestimonialsSlider testimonials={TESTIMONIALS} className="bg-muted/40 border-y" />

      {/* FAQ */}
      <section className="px-4 py-14 md:py-16 bg-muted/25 border-t border-border/60">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-center mb-8">{t("faq")}</h2>
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map(({ q, a }, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="bg-background rounded-2xl border px-6 data-[state=open]:border-primary/40 transition-colors"
              >
                <AccordionTrigger className="font-semibold text-left hover:no-underline py-5">
                  {q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm leading-relaxed pb-5">
                  {a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
    </div>
  );
}
