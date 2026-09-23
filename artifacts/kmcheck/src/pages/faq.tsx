import { useMemo, useState, type FormEvent } from "react";
import { useTranslation } from "@/i18n/context";
import { useLocation, Link } from "wouter";
import { EnterReveal } from "@/components/enter-reveal";
import { SEOHead, usePageSeo, faqPageJsonLd } from "@/components/seo";
import { HeroVinForm } from "@/components/hero-vin-form";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { redirectGuestForVinCheckout } from "@/lib/checkout-vin-flow";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ArrowRight,
  MessageCircle,
  Search,
  FileText,
  ShieldCheck,
  Gauge,
  AlertTriangle,
  Lock,
  Camera,
  Users,
  Globe2,
  Clock,
  CreditCard,
  RotateCcw,
  UserCircle,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type FaqItem = {
  q: string;
  a: string;
  icon: LucideIcon;
  rich?: "report";
};

type FaqCategory = {
  id: string;
  label: string;
  icon: LucideIcon;
  items: FaqItem[];
};

function ReportIncludesAnswer() {
  const { t } = useTranslation();
  const items = [
    { icon: Gauge, label: t("report_mileage"), color: "text-orange-500", bg: "bg-orange-500/10" },
    { icon: AlertTriangle, label: t("report_accidents"), color: "text-red-500", bg: "bg-red-500/10" },
    { icon: ShieldCheck, label: t("report_salvage"), color: "text-amber-500", bg: "bg-amber-500/10" },
    { icon: Lock, label: t("report_theft"), color: "text-purple-500", bg: "bg-purple-500/10" },
    { icon: Users, label: t("report_ownership"), color: "text-blue-500", bg: "bg-blue-500/10" },
    { icon: Camera, label: t("faq_report_photos"), color: "text-emerald-500", bg: "bg-emerald-500/10" },
  ];

  return (
    <div className="space-y-3.5">
      <p className="text-sm leading-relaxed">{t("faq_a5")}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {items.map(({ icon: Icon, label, color, bg }) => (
          <div
            key={label}
            className="flex items-center gap-2.5 rounded-xl border border-border/60 bg-muted/30 px-3 py-2.5"
          >
            <span className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0", bg)}>
              <Icon className={cn("h-4 w-4", color)} />
            </span>
            <span className="text-sm font-medium leading-snug">{label}</span>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{t("faq_a5_note")}</p>
    </div>
  );
}

export default function FAQ() {
  const { t, language } = useTranslation();
  const [, setLocation] = useLocation();
  const { isSignedIn } = useAuth();
  const [vin, setVin] = useState("");
  const [vinError, setVinError] = useState("");
  const seo = usePageSeo("faq");

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

  const categories: FaqCategory[] = useMemo(() => [
    {
      id: "basics",
      label: t("faq_cat_basics"),
      icon: Search,
      items: [
        { q: t("faq_q1"), a: t("faq_a1"), icon: Search },
        { q: t("faq_q2"), a: t("faq_a2"), icon: Globe2 },
        { q: t("faq_q3"), a: t("faq_a3"), icon: Clock },
      ],
    },
    {
      id: "report",
      label: t("faq_cat_report"),
      icon: FileText,
      items: [
        { q: t("faq_q4"), a: t("faq_a4"), icon: ShieldCheck },
        { q: t("faq_q5"), a: t("faq_a5"), icon: FileText, rich: "report" },
      ],
    },
    {
      id: "account",
      label: t("faq_cat_account"),
      icon: CreditCard,
      items: [
        { q: t("faq_q6"), a: t("faq_a6"), icon: CreditCard },
        { q: t("faq_q7"), a: t("faq_a7"), icon: RotateCcw },
        { q: t("faq_q8"), a: t("faq_a8"), icon: UserCircle },
      ],
    },
  ], [t]);

  const flatItems = useMemo(
    () => categories.flatMap((c) => c.items.map(({ q, a }) => ({ q, a }))),
    [categories],
  );

  const faqJsonLd = useMemo(
    () => faqPageJsonLd(flatItems),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- recompute when locale strings change
    [language],
  );

  let itemIndex = 0;

  const scrollToCategory = (id: string) => {
    const el = document.getElementById(`faq-${id}`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      <SEOHead
        title={seo.title}
        description={seo.description}
        lang={seo.lang}
        canonicalPath={seo.canonicalPath}
        jsonLd={faqJsonLd}
      />

      {/* Hero — same spacing rhythm as How it works / similar marketing pages */}
      <section className="relative overflow-hidden border-b border-border/60 px-5 py-14 md:py-20 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_55%_at_50%_-15%,hsl(var(--primary)/0.14),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(hsl(var(--foreground)/0.03)_1px,transparent_1px)] [background-size:22px_22px] opacity-60" />

        <EnterReveal y={14} className="relative max-w-2xl mx-auto space-y-5">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary bg-primary/10 border border-primary/15 px-2.5 py-1 rounded-full">
            <MessageCircle className="h-3 w-3" />
            {t("faq_badge")}
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-[2.65rem] font-extrabold tracking-tight leading-[1.12]">
            {t("faq_title")}
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto">
            {t("faq_subtitle")}
          </p>
        </EnterReveal>
      </section>

      {/* Category jump + FAQ list */}
      <section className="max-w-3xl mx-auto px-5 pt-6 pb-16 md:pt-8 md:pb-20 space-y-8">
        <nav
          aria-label={t("faq_title")}
          className="flex flex-wrap items-center justify-center sm:justify-start gap-2"
        >
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => scrollToCategory(category.id)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background px-3 py-1.5",
                "text-xs font-semibold text-muted-foreground transition-colors",
                "hover:border-primary/35 hover:text-primary hover:bg-primary/[0.04]",
              )}
            >
              <category.icon className="h-3.5 w-3.5 shrink-0" />
              {category.label}
            </button>
          ))}
        </nav>

        {categories.map((category, catIdx) => (
          <EnterReveal
            key={category.id}
            inView
            y={16}
            delay={catIdx * 0.05}
            className="space-y-3"
          >
            <div id={`faq-${category.id}`} className="scroll-mt-28 flex items-center gap-2.5">
              <span className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <category.icon className="h-3.5 w-3.5 text-primary" />
              </span>
              <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
                {category.label}
              </h2>
            </div>

            <Accordion type="single" collapsible className="space-y-2.5">
              {category.items.map((item) => {
                const idx = itemIndex++;
                const value = `item-${idx}`;
                return (
                  <AccordionItem
                    key={value}
                    value={value}
                    className="border border-border/70 rounded-xl px-3.5 sm:px-4 bg-background shadow-sm data-[state=open]:border-primary/30 data-[state=open]:shadow-md transition-all"
                  >
                    <AccordionTrigger className="text-left font-semibold text-[15px] py-3.5 hover:no-underline gap-3">
                      <span className="flex items-center gap-3 min-w-0">
                        <span className="h-8 w-8 rounded-lg bg-muted/80 flex items-center justify-center shrink-0">
                          <item.icon className="h-4 w-4 text-primary" />
                        </span>
                        <span className="min-w-0">{item.q}</span>
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed pb-3.5 text-sm pl-11">
                      {item.rich === "report" ? <ReportIncludesAnswer /> : item.a}
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </EnterReveal>
        ))}
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[hsl(142,80%,26%)] via-primary to-[hsl(158,76%,28%)] dark:from-[hsl(142,72%,20%)] dark:via-[hsl(142,72%,30%)] dark:to-[hsl(158,70%,24%)] px-4 py-14 md:py-16">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_80%_50%,rgba(255,255,255,0.12),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.04]" />

        <EnterReveal inView y={16} className="relative z-10 max-w-2xl mx-auto text-center space-y-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 border border-white/25 px-4 py-1.5 text-sm font-semibold text-white">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
              </span>
              {t("faq_cta_eyebrow")}
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight tracking-tight">
              {t("faq_cta_title")}
            </h2>
            <p className="text-white/70 text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
              {t("faq_cta_subtitle")}
            </p>
          </div>

          <HeroVinForm
            vin={vin}
            onVinChange={(v) => { setVin(v); setVinError(""); }}
            onSubmit={handleCheck}
            error={vinError}
            placeholder={t("vin_placeholder")}
            helpVariant="on-dark"
            className="max-w-xl mx-auto"
          />

          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            {[
              { icon: Zap, label: t("trust_instant_report") },
              { icon: RotateCcw, label: t("money_back") },
            ].map(({ icon: Icon, label }) => (
              <span key={label} className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-white/65">
                <Icon className="h-3.5 w-3.5 text-white/80 shrink-0" />
                {label}
              </span>
            ))}
          </div>

          <Button
            asChild
            variant="outline"
            size="lg"
            className="h-11 border-white/30 text-white hover:bg-white/10 hover:text-white bg-transparent"
          >
            <Link href={`/${language}/pricing`}>
              {t("see_whats_included")}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </EnterReveal>
      </section>
    </>
  );
}
