import { useTranslation } from "@/i18n/context";
import { useDisplayPrice } from "@/hooks/use-display-price";
import { useAuth } from "@/lib/auth-context";
import { useLocation, Link } from "wouter";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  CheckCircle2, ShieldCheck, Clock, Zap, RotateCcw, Star,
  AlertTriangle, Gauge, Lock, Users, FileText, BarChart3,
  X, ChevronRight,
} from "lucide-react";
import { motion } from "framer-motion";
import { SEOHead, usePageSeo } from "@/components/seo";
import { getPricingTestimonials } from "@/data/testimonials";
import { CompareTable } from "@/components/compare-table";
import { redirectGuestForVinCheckout } from "@/lib/checkout-vin-flow";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { MarketingPrice } from "@/components/marketing-price";


export default function Pricing() {
  const { t, language } = useTranslation();
  const { displayPrice: rawDisplayPrice, basePrice, isDiscount: discountEnabled, loading: priceLoading, currencySymbol, fmtPrice } = useDisplayPrice();
  const { isSignedIn } = useAuth();
  const [, setLocation] = useLocation();
  const [vin, setVin] = useState("");
  const [vinError, setVinError] = useState("");

  const TESTIMONIALS = useMemo(() => getPricingTestimonials(language), [language]);
  const displayPrice = rawDisplayPrice ?? 0;
  const discountedPrice = displayPrice;

  const handleGetReport = () => {
    if (!vin.trim()) { setVinError(t("vin_error_required")); return; }
    if (vin.length !== 17) { setVinError(t("vin_error_length")); return; }
    setVinError("");
    if (!isSignedIn) {
      const authPath = redirectGuestForVinCheckout(vin, language);
      if (authPath) setLocation(authPath);
      return;
    }
    sessionStorage.setItem("checkout_vin", vin);
    setLocation(`/${language}/checkout`);
  };

  const faqs = [
    { q: t("faq_1_q"), a: t("faq_1_a") },
    { q: t("faq_2_q"), a: t("faq_2_a") },
    { q: t("faq_3_q"), a: t("faq_3_a") },
  ];

  const WHAT_YOU_GET = [
    { icon: Gauge,         color: "text-orange-500", bg: "bg-orange-500/10", title: t("mileage_verification"),    desc: t("desc_mileage_verification") },
    { icon: AlertTriangle, color: "text-red-500",    bg: "bg-red-500/10",    title: t("accident_history"),        desc: t("desc_accident_records") },
    { icon: ShieldCheck,   color: "text-amber-500",  bg: "bg-amber-500/10",  title: t("report_salvage"),          desc: t("desc_salvage") },
    { icon: Lock,          color: "text-purple-500", bg: "bg-purple-500/10", title: t("theft_records"),           desc: t("desc_theft_records") },
    { icon: Users,         color: "text-blue-500",   bg: "bg-blue-500/10",   title: t("ownership_history"),       desc: t("desc_ownership") },
    { icon: FileText,      color: "text-primary",    bg: "bg-primary/10",    title: t("pricing_title_registration"), desc: t("desc_title_registration") },
    { icon: BarChart3,     color: "text-emerald-500",bg: "bg-emerald-500/10",title: t("technical_specs"),         desc: t("desc_technical_specs") },
    { icon: Zap,           color: "text-yellow-500", bg: "bg-yellow-500/10", title: t("auction_history"),         desc: t("desc_auction_history") },
  ];

  const seo = usePageSeo("pricing");
  return (
    <div className="min-h-screen bg-background">
      <SEOHead title={seo.title} description={seo.description} lang={seo.lang} canonicalPath={seo.canonicalPath} />

      {/* ── Hero ── */}
      <section className="relative py-12 md:py-16 px-4 overflow-hidden border-b border-border/60">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_50%_at_50%_-10%,hsl(var(--primary)/0.12),transparent)]" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(hsl(var(--foreground)/0.04)_1px,transparent_1px)] [background-size:24px_24px] opacity-60" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto text-center space-y-4"
        >
          {discountEnabled && (
            <Badge className="rounded-full bg-orange-500/90 text-white border-0 px-3.5 py-1 text-xs font-semibold">
              {t("pricing_limited_time")}
            </Badge>
          )}
          <h1 className="text-3xl sm:text-4xl md:text-[2.75rem] font-extrabold tracking-tight leading-tight">{t("pricing")}</h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed">{t("pricing_subtitle")}</p>
          <div className="flex items-center justify-center gap-2 flex-wrap pt-0.5">
            <Badge variant="secondary" className="rounded-full px-3 py-1 text-[11px] font-medium">{t("trust_secure_payment")}</Badge>
            <Badge variant="secondary" className="rounded-full px-3 py-1 text-[11px] font-medium">{t("trust_instant_report")}</Badge>
            <Badge variant="secondary" className="rounded-full px-3 py-1 text-[11px] font-medium">{t("trust_money_back")}</Badge>
          </div>
        </motion.div>
      </section>

      {/* ── Main layout: card + features ── */}
      <section className="px-4 py-10 md:py-14">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,380px)_1fr] gap-8 lg:gap-10 items-start">

            {/* Pricing card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:sticky lg:top-24 max-w-md mx-auto w-full lg:max-w-none"
            >
              <div className="rounded-2xl border border-primary/25 bg-card shadow-lg shadow-primary/5 overflow-hidden">
                {/* Card header */}
                <div className="relative bg-gradient-to-b from-primary/[0.08] to-transparent px-6 sm:px-7 pt-7 pb-6 text-center border-b border-border/60">
                  {discountEnabled && (
                    <div className="absolute top-3.5 right-3.5">
                      <Badge className="rounded-full bg-orange-500 text-white border-0 px-2.5 py-0.5 text-[10px] font-semibold">
                        {t("pricing_save").replace("{n}", String(Math.round((((basePrice ?? 0) - discountedPrice) / (basePrice ?? 1)) * 100)))}
                      </Badge>
                    </div>
                  )}
                  <p className="text-[11px] font-semibold text-primary uppercase tracking-[0.18em] mb-3">{t("pricing_report_title")}</p>
                  <MarketingPrice
                    amount={displayPrice}
                    currencySymbol={currencySymbol}
                    loading={priceLoading}
                    compareAmount={discountEnabled ? (basePrice ?? null) : null}
                    size="lg"
                  />
                  <p className="text-sm text-muted-foreground mt-2">{t("per_report")}</p>
                  <p className="text-xs text-muted-foreground/75 mt-0.5">{t("pricing_no_subscription")}</p>

                  {/* Stars */}
                  <div className="flex items-center justify-center gap-1 mt-3.5 pt-3.5 border-t border-border/50">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    ))}
                    <span className="text-[11px] text-muted-foreground ml-1.5">120,000+ {t("stats_reports")}</span>
                  </div>
                </div>

                {/* Features list */}
                <div className="px-6 sm:px-7 py-4 space-y-2 border-b border-border/60 bg-muted/20">
                  {[
                    t("full_vehicle_history"),
                    t("accident_records"),
                    t("mileage_verification"),
                    t("theft_records"),
                    t("auction_history"),
                    t("technical_specs"),
                  ].map((f, i) => (
                    <motion.div
                      key={f}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + i * 0.04 }}
                      className="flex items-center gap-2.5"
                    >
                      <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                      <span className="text-sm font-medium">{f}</span>
                    </motion.div>
                  ))}
                </div>

                {/* VIN input + CTA */}
                <div className="px-6 sm:px-7 py-5 space-y-3">
                  <Input
                    placeholder={t("vin_placeholder")}
                    value={vin}
                    onChange={(e) => { setVin(e.target.value.toUpperCase()); setVinError(""); }}
                    maxLength={17}
                    className="font-mono tracking-wider h-11 text-center text-sm sm:text-base"
                  />
                  {vinError && <p className="text-sm text-destructive text-center">{vinError}</p>}
                  <Button
                    onClick={handleGetReport}
                    className="w-full h-11 text-sm sm:text-base font-semibold rounded-xl"
                    size="lg"
                  >
                    {t("get_started")}
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>

              {/* Trust badges */}
              <div className="grid grid-cols-3 gap-2.5 mt-4">
                {[
                  { icon: ShieldCheck, label: t("trust_secure_payment") },
                  { icon: Clock,       label: t("trust_instant_report") },
                  { icon: RotateCcw,   label: t("trust_money_back") },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex flex-col items-center gap-1.5 text-center p-2.5 rounded-xl bg-muted/30 border border-border/60">
                    <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
                      <Icon className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <span className="text-[10px] text-muted-foreground font-medium leading-tight">{label}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* What you get */}
            <div className="space-y-6 min-w-0">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight">{t("what_you_get")}</h2>
                <p className="text-muted-foreground text-sm mt-1.5 leading-relaxed">{t("what_you_get_sub")}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {WHAT_YOU_GET.map(({ icon: Icon, color, bg, title, desc }, i) => (
                  <motion.div
                    key={title}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 + i * 0.05 }}
                    className="flex gap-3 p-4 rounded-xl bg-card border border-border/70 hover:border-primary/30 hover:shadow-sm transition-all"
                  >
                    <div className={`h-9 w-9 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
                      <Icon className={`h-4 w-4 ${color}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm">{title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Comparison — scroll on small screens */}
              <div className="rounded-xl border border-border/70 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <div className="min-w-[520px]">
                <div className="grid grid-cols-4 text-[11px] font-semibold bg-muted/50 border-b border-border/60">
                  <div className="col-span-1 px-4 py-2.5 text-muted-foreground">{t("pricing_compare_feature")}</div>
                  <div className="px-3 py-2.5 text-center text-primary bg-primary/5">kmcheck</div>
                  <div className="px-3 py-2.5 text-center text-muted-foreground">{t("pricing_compare_dealer")}</div>
                  <div className="px-3 py-2.5 text-center text-muted-foreground">{t("pricing_compare_seller")}</div>
                </div>
                {[
                  { feature: t("pricing_compare_price"),    km: priceLoading ? "…" : fmtPrice(displayPrice), dealer: `${currencySymbol}30–80`, seller: t("pricing_compare_free_risky") },
                  { feature: t("pricing_compare_instant"),   km: true, dealer: false,                    seller: false },
                  { feature: t("pricing_compare_official"),  km: true, dealer: t("pricing_compare_sometimes"), seller: false },
                  { feature: t("pricing_compare_odometer"),  km: true, dealer: t("pricing_compare_sometimes"), seller: false },
                  { feature: t("pricing_compare_countries"), km: true, dealer: false,                    seller: false },
                ].map(({ feature, km, dealer, seller }) => (
                  <div key={feature} className="grid grid-cols-4 border-b border-border/50 last:border-0 text-sm">
                    <div className="col-span-1 px-4 py-2.5 font-medium text-xs text-foreground">{feature}</div>
                    {[km, dealer, seller].map((val, ci) => (
                      <div key={ci} className={`px-3 py-2.5 flex items-center justify-center ${ci === 0 ? "bg-primary/[0.04]" : ""}`}>
                        {val === true ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : val === false ? (
                          <X className="h-4 w-4 text-muted-foreground/30" />
                        ) : (
                          <span className={`text-xs ${ci === 0 ? "font-semibold text-primary" : "text-muted-foreground"}`}>{val as string}</span>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Money-back guarantee ── */}
      <section className="py-10 md:py-12 px-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto rounded-2xl bg-gradient-to-br from-primary/[0.07] to-transparent border border-primary/15 px-6 sm:px-8 py-8 sm:py-10 text-center space-y-3.5"
        >
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <RotateCcw className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold">{t("money_back")}</h2>
          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed max-w-md mx-auto">{t("money_back_desc")}</p>
          <Button asChild size="lg" className="px-6 h-11 font-semibold mt-1">
            <Link href={`/${language}`}>
              {t("check_vin")}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </motion.div>
      </section>

      {/* ── Testimonials ── */}
      <section className="bg-muted/40 border-y py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10 space-y-3"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-yellow-400/40 bg-yellow-400/5 px-3.5 py-1.5 text-xs font-semibold text-yellow-600 dark:text-yellow-400">
              <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
              {t("testimonials_trust_badge")}
            </div>
            <h2 className="text-2xl font-bold">{t("pricing_customers_say")}</h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">{t("testimonials_subtitle")}</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((tm, i) => (
              <motion.div
                key={tm.name + i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="bg-background rounded-2xl border p-5 flex flex-col gap-3 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`h-3.5 w-3.5 ${s <= tm.stars ? "fill-yellow-400 text-yellow-400" : "fill-muted-foreground/15 text-muted-foreground/25"}`}
                      />
                    ))}
                  </div>
                  {tm.date && <span className="text-[10px] text-muted-foreground/70">{tm.date}</span>}
                </div>
                <p className="text-sm leading-relaxed text-foreground/85 flex-1">{tm.text}</p>
                {tm.resultBadge && (
                  <div className="inline-flex items-center gap-1.5 self-start rounded-lg px-2 py-1 text-[10px] font-medium bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50 text-amber-800 dark:text-amber-300">
                    <AlertTriangle className="h-3 w-3 shrink-0" />
                    {tm.resultBadge}
                  </div>
                )}
                <div className="flex items-center gap-2.5 pt-2 border-t border-border/50">
                  <div className={`h-8 w-8 rounded-full ${tm.avatarBg} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                    {tm.initials}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-sm truncate">{tm.name}</span>
                      <img src={`https://flagcdn.com/${tm.flagCode}.svg`} alt="" className="h-3 w-auto shrink-0 rounded-sm" />
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-tight truncate">{tm.car}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMPARISON TABLE ── */}
      <CompareTable />

      {/* ── FAQ ── */}
      <section className="py-10 md:py-16 px-4">
        <div className="max-w-2xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-2xl sm:text-3xl font-bold text-center mb-8"
          >
            {t("faq")}
          </motion.h2>
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
