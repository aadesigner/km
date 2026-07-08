import { useMemo } from "react";
import { useTranslation } from "@/i18n/context";
import { useLocation } from "wouter";
import { motion, type Variants } from "framer-motion";
import { SEOHead, usePageSeo, faqPageJsonLd } from "@/components/seo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: "easeOut" },
  }),
} as unknown as Variants;

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
    <div className="space-y-4">
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
    </div>
  );
}

export default function FAQ() {
  const { t, language } = useTranslation();
  const [, setLocation] = useLocation();
  const seo = usePageSeo("faq");

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

  return (
    <>
      <SEOHead
        title={seo.title}
        description={seo.description}
        lang={seo.lang}
        canonicalPath={seo.canonicalPath}
        jsonLd={faqJsonLd}
      />

      {/* Hero */}
      <section className="relative overflow-hidden py-20 md:py-28 px-5 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,hsl(var(--primary)/0.12),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(hsl(var(--foreground)/0.03)_1px,transparent_1px)] [background-size:22px_22px] opacity-70" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative max-w-2xl mx-auto"
        >
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-primary bg-primary/10 border border-primary/15 px-3 py-1 rounded-full mb-5">
            <MessageCircle className="h-3 w-3" />
            {t("faq_badge")}
          </span>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
            {t("faq_title")}
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto">
            {t("faq_subtitle")}
          </p>
        </motion.div>
      </section>

      {/* FAQ by category */}
      <section className="max-w-3xl mx-auto px-5 pb-24 pt-4 space-y-10">
        {categories.map((category, catIdx) => (
          <motion.div
            key={category.id}
            custom={catIdx}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-40px" }}
            variants={fadeUp}
            className="space-y-4"
          >
            <div className="flex items-center gap-2.5">
              <span className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center">
                <category.icon className="h-4 w-4 text-foreground" />
              </span>
              <div>
                <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                  {category.label}
                </h2>
              </div>
            </div>

            <Accordion type="single" collapsible className="space-y-3">
              {category.items.map((item) => {
                const idx = itemIndex++;
                const value = `item-${idx}`;
                return (
                  <AccordionItem
                    key={value}
                    value={value}
                    className="border rounded-2xl px-4 sm:px-5 bg-background shadow-sm data-[state=open]:border-primary/30 data-[state=open]:shadow-md transition-all"
                  >
                    <AccordionTrigger className="text-left font-semibold text-[15px] py-4 hover:no-underline gap-3">
                      <span className="flex items-center gap-3 min-w-0">
                        <span className="h-8 w-8 rounded-lg bg-muted/80 flex items-center justify-center shrink-0">
                          <item.icon className="h-4 w-4 text-primary" />
                        </span>
                        <span className="min-w-0">{item.q}</span>
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed pb-4 text-sm pl-11">
                      {item.rich === "report" ? <ReportIncludesAnswer /> : item.a}
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </motion.div>
        ))}

      </section>

      {/* CTA */}
      <section className="bg-primary/[0.05] border-t py-20 px-5 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          className="max-w-xl mx-auto"
        >
          <Badge variant="secondary" className="mb-4">{t("instant_report")}</Badge>
          <h2 className="text-3xl font-black tracking-tight mb-3">{t("hiw_cta_title")}</h2>
          <p className="text-muted-foreground mb-8">{t("hiw_cta_subtitle")}</p>
          <Button
            size="lg"
            className="rounded-full px-8 gap-2 text-base"
            onClick={() => setLocation(`/${language}`)}
          >
            {t("hiw_cta_btn")}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </motion.div>
      </section>
    </>
  );
}
