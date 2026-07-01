import { useTranslation } from "@/i18n/context";
import { useLocation } from "wouter";
import { useMemo } from "react";
import { motion, type Variants } from "framer-motion";
import { SEOHead, usePageSeo, faqPageJsonLd } from "@/components/seo";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ArrowRight, MessageCircle } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.07, duration: 0.4, ease: "easeOut" },
  }),
} as unknown as Variants;

export default function FAQ() {
  const { t, language } = useTranslation();
  const [, setLocation] = useLocation();
  const seo = usePageSeo("faq");

  const items = [
    { q: t("faq_q1"), a: t("faq_a1") },
    { q: t("faq_q2"), a: t("faq_a2") },
    { q: t("faq_q3"), a: t("faq_a3") },
    { q: t("faq_q4"), a: t("faq_a4") },
    { q: t("faq_q5"), a: t("faq_a5") },
    { q: t("faq_q6"), a: t("faq_a6") },
    { q: t("faq_q7"), a: t("faq_a7") },
    { q: t("faq_q8"), a: t("faq_a8") },
  ];

  const faqJsonLd = useMemo(
    () => faqPageJsonLd(items.map(({ q, a }) => ({ q, a }))),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- recompute when locale strings change
    [language],
  );

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
      <section className="py-24 text-center px-5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-xl mx-auto"
        >
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full mb-5">
            <MessageCircle className="h-3 w-3" />
            {t("faq_badge")}
          </span>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
            {t("faq_title")}
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            {t("faq_subtitle")}
          </p>
        </motion.div>
      </section>

      {/* FAQ accordion */}
      <section className="max-w-2xl mx-auto px-5 pb-24">
        <Accordion type="single" collapsible className="space-y-3">
          {items.map(({ q, a }, i) => (
            <motion.div
              key={i}
              custom={i}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-40px" }}
              variants={fadeUp}
            >
              <AccordionItem
                value={`item-${i}`}
                className="border rounded-2xl px-5 bg-background shadow-sm"
              >
                <AccordionTrigger className="text-left font-semibold text-[15px] py-4 hover:no-underline">
                  {q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed pb-4 text-sm">
                  {a}
                </AccordionContent>
              </AccordionItem>
            </motion.div>
          ))}
        </Accordion>
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
