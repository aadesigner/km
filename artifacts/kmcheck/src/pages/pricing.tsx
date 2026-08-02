import { useTranslation } from "@/i18n/context";
import { useDisplayPrice } from "@/hooks/use-display-price";
import { useAuth } from "@/lib/auth-context";
import { useLocation } from "wouter";
import { useState, useMemo, type FormEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle2, RotateCcw,
  CreditCard, UserCircle, Zap, FileText, Coins,
} from "lucide-react";
import { motion } from "framer-motion";
import { SEOHead, usePageSeo, productOfferJsonLd } from "@/components/seo";
import { SITE_ORIGIN } from "@/lib/seo-config";
import { DEFAULT_PRICING } from "@/lib/pricing-defaults";
import { getTestimonials } from "@/data/testimonials";
import { TestimonialsSlider } from "@/components/testimonials-slider";
import { HeroVinForm } from "@/components/hero-vin-form";
import { AUTH_RETURN_PATH_KEY, redirectGuestForVinCheckout } from "@/lib/checkout-vin-flow";
import { CREDIT_PACKS, type CreditPackId } from "@/lib/creditPacks";
import { cn } from "@/lib/utils";
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
  "photos_available",
  "auction_history",
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
    return <Skeleton className="h-12 w-36 mx-auto rounded-lg bg-white/10" />;
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="inline-flex items-end justify-center gap-2 tabular-nums leading-none">
        {showDiscount && baseAmount != null && baseAmount > amount && (
          <span className="text-base sm:text-lg font-medium text-white/40 line-through pb-1">
            {currencySymbol}
            {baseAmount.toFixed(2)}
          </span>
        )}
        <div className="inline-flex items-end leading-none">
          <span className="text-lg sm:text-xl font-semibold text-white/90 pb-1 pe-0.5">
            {currencySymbol}
          </span>
          <span className="text-[2.75rem] sm:text-[3.1rem] font-black text-white tracking-tighter">
            {whole}
          </span>
          <span className="text-lg sm:text-xl font-bold text-white/80 pb-1 ps-1">
            .{fraction}
          </span>
        </div>
      </div>
    </div>
  );
}

function FeatureGrid({ items }: { items: { key: string; label: string }[] }) {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
      {items.map(({ key, label }) => (
        <div key={key} className="flex items-start gap-1.5 min-w-0">
          <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary shrink-0 mt-0.5" />
          <span className="text-[11px] sm:text-sm font-medium leading-snug">{label}</span>
        </div>
      ))}
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
  const [selectedPack, setSelectedPack] = useState<CreditPackId>("pack3");

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

  const handleBuyCredits = (packId: CreditPackId) => {
    const path = `/${language}/credits/checkout?pack=${packId}`;
    if (!isSignedIn) {
      sessionStorage.setItem(AUTH_RETURN_PATH_KEY, path);
      setLocation(`/${language}/sign-up`);
      return;
    }
    setLocation(path);
  };

  const faqs = [
    { q: t("faq_1_q"), a: t("faq_1_a") },
    { q: t("faq_2_q"), a: t("faq_2_a") },
    { q: t("faq_3_q"), a: t("faq_3_a") },
  ];

  const seo = usePageSeo("pricing");
  const selectedPackData = CREDIT_PACKS[selectedPack];

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
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center space-y-3 sm:space-y-4 mb-8 sm:mb-10"
          >
            <h1 className="text-[2.6rem] sm:text-[3.15rem] md:text-[3.25rem] lg:text-[3.5rem] font-black tracking-tight leading-[1.12] sm:leading-[1.14]">
              {t("pricing_hero_title_1")}
              <br />
              <span className="text-primary">{t("pricing_hero_title_2")}</span>
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground dark:text-white/60 leading-relaxed max-w-2xl mx-auto">
              {t("pricing_hero_lead")}
            </p>
          </motion.div>

          {/* Two equal columns on desktop */}
          <div className="grid gap-5 lg:grid-cols-2 lg:gap-6 lg:items-stretch max-w-5xl mx-auto w-full">
            {/* Primary — single report + VIN */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="flex flex-col rounded-2xl border border-border/70 dark:border-white/15 bg-card shadow-xl shadow-black/5 dark:shadow-black/30 overflow-hidden ring-1 ring-primary/10"
            >
              <div className="relative px-6 sm:px-8 pt-8 pb-7 text-center bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 dark:from-[#010a05] dark:via-[#052e16] dark:to-[#047857]">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_80%_at_50%_-30%,rgba(255,255,255,0.18),transparent)] pointer-events-none" />
                {discountEnabled && savePct > 0 && (
                  <Badge className="absolute top-4 right-4 rounded-full bg-orange-500 text-white border-0 px-2.5 py-0.5 text-[10px] font-bold">
                    {t("pricing_save").replace("{n}", String(savePct))}
                  </Badge>
                )}
                <div className="relative space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-widest text-white/80">
                    {t("pricing_report_title")}
                  </p>
                  <PricingHeroPrice
                    amount={displayPrice}
                    baseAmount={discountEnabled ? (basePrice ?? null) : null}
                    currencySymbol={currencySymbol}
                    loading={priceLoading}
                    showDiscount={discountEnabled}
                  />
                  <p className="text-sm text-white/70">{t("per_report")}</p>
                </div>
              </div>

              <div className="px-6 sm:px-8 py-5 border-b border-border/60 bg-muted/15">
                <FeatureGrid
                  items={CARD_FEATURES.map((key) => ({ key, label: t(key) }))}
                />
              </div>

              <div className="px-6 sm:px-8 py-6 space-y-3 flex-1 flex flex-col justify-end">
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
                  className="max-w-none mx-0 [&_.hero-vin-field]:rounded-xl [&_input]:h-12 [&_input]:sm:h-14 [&_input]:text-sm [&_input]:pr-[5rem] [&_button]:h-9 [&_button]:sm:h-11 [&_button]:px-3 [&_button]:text-xs"
                />
              </div>
            </motion.div>

            {/* Packs — equal-weight companion to single report */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08, duration: 0.45 }}
              className="flex flex-col rounded-2xl border border-border/70 dark:border-white/15 bg-card shadow-xl shadow-black/5 dark:shadow-black/30 overflow-hidden lg:sticky lg:top-24"
            >
              <div className="relative px-6 sm:px-8 pt-8 pb-7 text-center bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 dark:from-[#010a05] dark:via-[#052e16] dark:to-[#047857]">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_80%_at_50%_-30%,rgba(255,255,255,0.18),transparent)] pointer-events-none" />
                <div className="relative space-y-2.5">
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-white/90">
                    <Coins className="h-3.5 w-3.5" />
                    {t("pricing_packs_section")}
                  </div>
                  <p className="text-sm sm:text-[15px] text-white/75 leading-relaxed max-w-xs mx-auto">
                    {t("pricing_packs_section_lead")}
                  </p>
                </div>
              </div>

              <div className="px-6 sm:px-8 py-6 flex-1 flex flex-col gap-5">
                <div
                  className="grid grid-cols-2 gap-3"
                  role="radiogroup"
                  aria-label={t("pricing_packs_section")}
                >
                  {(["pack3", "pack5"] as const).map((id) => {
                    const active = selectedPack === id;
                    const option = CREDIT_PACKS[id];
                    return (
                      <button
                        key={id}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => setSelectedPack(id)}
                        className={cn(
                          "relative rounded-xl px-3 py-4 text-center transition-all duration-200",
                          "border outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                          active
                            ? "border-primary/40 bg-primary/[0.06] shadow-md shadow-primary/10 ring-1 ring-primary/25"
                            : "border-border/70 bg-muted/25 hover:bg-muted/45 hover:border-border",
                        )}
                      >
                        {id === "pack3" && (
                          <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[9px] font-bold uppercase tracking-wide text-primary bg-background px-2 py-0.5 rounded-full border border-primary/30 shadow-sm whitespace-nowrap">
                            {t("pricing_best_value")}
                          </span>
                        )}
                        <span className={cn(
                          "block text-sm font-semibold tracking-tight",
                          active ? "text-foreground" : "text-muted-foreground",
                        )}>
                          {t(`pricing_plan_${id}_title`)}
                        </span>
                        <span className={cn(
                          "mt-2 inline-flex items-baseline justify-center gap-0.5 tabular-nums leading-none",
                          active ? "text-primary" : "text-foreground",
                        )}>
                          <span className="text-base font-semibold opacity-80">{currencySymbol}</span>
                          <span className="text-[2.15rem] font-black tracking-tighter">
                            {option.unitPrice.toFixed(2).split(".")[0]}
                          </span>
                          <span className="text-base font-bold opacity-70">
                            .{option.unitPrice.toFixed(2).split(".")[1]}
                          </span>
                        </span>
                        <span className="block mt-1.5 text-[11px] text-muted-foreground">
                          {t("per_report").toLowerCase()}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="text-center space-y-1">
                  <div className="flex items-center justify-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    <span className="font-medium leading-snug text-foreground/90">
                      {t("pricing_plan_reports_included").replace("{n}", String(selectedPackData.credits))}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t("pricing_credits_never_expire")}
                  </p>
                </div>

                <div className="mt-auto pt-1">
                  <Button
                    className="w-full h-12 font-bold rounded-xl shadow-md shadow-primary/15 text-[15px]"
                    onClick={() => handleBuyCredits(selectedPack)}
                  >
                    {t("pricing_buy_pack").replace("{n}", String(selectedPackData.credits))}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>

          <p className="mt-6 text-center text-[11px] sm:text-xs text-muted-foreground inline-flex items-center justify-center gap-1.5 w-full">
            <RotateCcw className="h-3.5 w-3.5 text-primary shrink-0" />
            {t("money_back")}
          </p>
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
