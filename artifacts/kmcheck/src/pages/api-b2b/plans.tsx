import { Fragment } from "react";
import { Link } from "wouter";
import { motion, useReducedMotion } from "framer-motion";
import { useApiB2bCopy } from "./use-copy";
import { VolumePricingBanner } from "./volume-pricing";
import { fadeUp, staggerContainer, viewportOnce } from "./motion";
import { ApiDevPlanDemo, ManagedSitePlanDemo } from "./plans-demos";
import { ArrowRight, Code2, Building2, ShieldCheck, TimerReset, Handshake, Check } from "lucide-react";

export default function ApiB2bPlans() {
  const { c, base } = useApiB2bCopy();
  const reduce = useReducedMotion();
  const topOfferCards = [
    {
      title: c.planDevTitle,
      body: c.planDevDesc,
      icon: Code2,
    },
    {
      title: c.plansTopBuildTitle,
      body: c.plansTopBuildBody,
      icon: Building2,
    },
    {
      title: c.plansTopMaintainTitle,
      body: c.plansTopMaintainBody,
      icon: ShieldCheck,
    },
  ];
  const compareRows = [
    { label: c.plansCompareRowDelivery, dev: c.plansCompareDevDelivery, managed: c.plansCompareManagedDelivery },
    { label: c.plansCompareRowCheckout, dev: c.plansCompareDevCheckout, managed: c.plansCompareManagedCheckout },
    { label: c.plansCompareRowBestFor, dev: c.plansCompareDevBestFor, managed: c.plansCompareManagedBestFor },
    { label: c.plansCompareRowBrand, dev: c.plansCompareDevBrand, managed: c.plansCompareManagedBrand },
    { label: c.plansCompareRowLaunch, dev: c.plansCompareDevLaunch, managed: c.plansCompareManagedLaunch },
    { label: c.plansCompareRowMaintenance, dev: c.plansCompareDevMaintenance, managed: c.plansCompareManagedMaintenance },
  ];
  const devHighlights = [
    c.plansDevHighlight1,
    c.plansDevHighlight2,
    c.plansDevHighlight3,
  ];
  const managedHighlights = [
    c.plansManagedHighlight1,
    c.plansManagedHighlight2,
    c.plansManagedHighlight3,
  ];
  const commercialStages = [
    {
      title: c.plansRolloutPhase1Title,
      body: c.plansRolloutPhase1Body,
    },
    {
      title: c.plansRolloutPhase2Title,
      body: c.plansRolloutPhase2Body,
    },
    {
      title: c.plansRolloutPhase3Title,
      body: c.plansRolloutPhase3Body,
    },
  ];

  return (
    <div className="mx-auto max-w-[74rem] px-4 py-14 sm:px-6 sm:py-20">
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">{c.brandApi}</p>
        <h1 className="mt-3 max-w-4xl text-4xl font-semibold tracking-[-0.04em] sm:text-5xl md:text-[3.45rem] md:leading-[1.03]">{c.plansHeroTitle}</h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-600 dark:text-slate-300">{c.plansHeroSub}</p>
      </motion.div>

      <motion.div
        className="mt-8 grid gap-4 lg:grid-cols-3"
        variants={staggerContainer(0.06)}
        initial={reduce ? false : "hidden"}
        whileInView="show"
        viewport={viewportOnce}
      >
        {topOfferCards.map((card) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.title}
              variants={fadeUp}
              className="rounded-[1.4rem] border border-emerald-900/10 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#121a17]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="mt-4 text-lg font-semibold tracking-tight">{card.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{card.body}</p>
            </motion.div>
          );
        })}
      </motion.div>

      <div className="mt-8">
        <VolumePricingBanner c={c} />
      </div>

      {/* Developer plan */}
      <motion.section
        initial={reduce ? false : { opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={viewportOnce}
        className="mt-10 overflow-hidden rounded-[1.75rem] border border-emerald-900/10 bg-white shadow-sm dark:border-white/10 dark:bg-[#121a17]"
      >
        <div className="grid gap-0 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="flex flex-col justify-center p-6 sm:p-8 lg:p-10">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white dark:bg-emerald-500 dark:text-emerald-950">
              <Code2 className="h-5 w-5" />
            </div>
            <h3 className="mt-5 text-2xl font-semibold tracking-tight sm:text-3xl">{c.planDevTitle}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{c.planDevDesc}</p>
            <div className="mt-4 inline-flex w-fit rounded-full border border-slate-900/10 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300">
              {c.plansDevBadge}
            </div>
            <ul className="mt-5 space-y-2 text-sm text-slate-600 dark:text-slate-300">
              {devHighlights.map((item) => (
                <li key={item} className="flex gap-2.5">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <ul className="mt-6 space-y-3 text-sm">
              {c.planDevPoints.map((p, i) => (
                <motion.li
                  key={p}
                  initial={reduce ? false : { opacity: 0, x: -8 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={viewportOnce}
                  transition={{ delay: 0.05 * i }}
                  className="flex gap-2 border-b border-slate-100 pb-3 dark:border-white/10"
                >
                  <span className="text-emerald-600">✓</span> {p}
                </motion.li>
              ))}
            </ul>
          </div>
          <div className="border-t border-emerald-900/10 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-black/20 sm:p-6 lg:border-l lg:border-t-0">
            <ApiDevPlanDemo c={c} />
          </div>
        </div>
      </motion.section>

      {/* Managed plan */}
      <motion.section
        initial={reduce ? false : { opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={viewportOnce}
        transition={{ delay: 0.06 }}
        className="relative mt-8 overflow-hidden rounded-[1.75rem] border border-emerald-500/40 bg-gradient-to-br from-emerald-50/90 to-white shadow-md dark:from-emerald-950/40 dark:to-[#121a17]"
      >
        <span className="absolute right-5 top-5 z-10 rounded-full bg-emerald-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
          {c.planPopular}
        </span>
        <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="order-2 border-t border-emerald-900/10 p-4 dark:border-white/10 sm:p-6 lg:order-1 lg:border-r lg:border-t-0">
            <ManagedSitePlanDemo c={c} />
          </div>
          <div className="order-1 flex flex-col justify-center p-6 sm:p-8 lg:order-2 lg:p-10">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white">
              <Building2 className="h-5 w-5" />
            </div>
            <h3 className="mt-5 max-w-md text-2xl font-semibold tracking-tight sm:text-3xl">{c.planManagedTitle}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{c.planManagedDesc}</p>
            <div className="mt-4 inline-flex w-fit rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-300">
              {c.plansManagedBadge}
            </div>
            <ul className="mt-5 space-y-2 text-sm text-slate-600 dark:text-slate-300">
              {managedHighlights.map((item) => (
                <li key={item} className="flex gap-2.5">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <ul className="mt-6 space-y-3 text-sm">
              {c.planManagedPoints.map((p, i) => (
                <motion.li
                  key={p}
                  initial={reduce ? false : { opacity: 0, x: -8 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={viewportOnce}
                  transition={{ delay: 0.05 * i }}
                  className="flex gap-2 border-b border-emerald-900/10 pb-3 dark:border-white/10"
                >
                  <span className="text-emerald-600">✓</span> {p}
                </motion.li>
              ))}
            </ul>
          </div>
        </div>
      </motion.section>

      <div className="mt-14 max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-400">{c.navPlans}</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] sm:text-[2.15rem]">{c.plansCompareTitle}</h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{c.plansCompareIntro}</p>
      </div>

      <div className="mt-8 overflow-hidden rounded-[1.5rem] border border-emerald-900/10 bg-white shadow-sm dark:border-white/10 dark:bg-[#121a17]">
        <div className="grid gap-px bg-emerald-900/10 md:grid-cols-[0.9fr_1fr_1fr] dark:bg-white/10">
          <div className="bg-[#f5f8f6] px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:bg-[#101816] dark:text-slate-400">
            {c.plansCompareLabel}
          </div>
          <div className="bg-[#f5f8f6] px-5 py-4 text-sm font-semibold text-slate-900 dark:bg-[#101816] dark:text-white">{c.planDevTitle}</div>
          <div className="bg-[#f5f8f6] px-5 py-4 text-sm font-semibold text-slate-900 dark:bg-[#101816] dark:text-white">{c.planManagedTitle}</div>
          {compareRows.map((row) => (
            <Fragment key={row.label}>
              <div className="bg-white px-5 py-4 text-sm font-medium text-slate-700 dark:bg-[#121a17] dark:text-slate-200">{row.label}</div>
              <div className="bg-white px-5 py-4 text-sm text-slate-600 dark:bg-[#121a17] dark:text-slate-300">{row.dev}</div>
              <div className="bg-white px-5 py-4 text-sm text-slate-600 dark:bg-[#121a17] dark:text-slate-300">{row.managed}</div>
            </Fragment>
          ))}
        </div>
      </div>

      <div className="mt-6 rounded-[1.5rem] border border-emerald-900/10 bg-[#f5f8f6] p-5 dark:border-white/10 dark:bg-[#101816] sm:p-6">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white">
            <TimerReset className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">{c.plansRolloutTitle}</h3>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">{c.plansRolloutBody}</p>
          </div>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {commercialStages.map((stage) => (
            <div key={stage.title} className="rounded-2xl border border-emerald-900/10 bg-white p-4 dark:border-white/10 dark:bg-[#121a17]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-400">{stage.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{stage.body}</p>
            </div>
          ))}
        </div>
      </div>

      <motion.div
        className="mt-12 space-y-6 rounded-2xl border border-emerald-900/10 bg-white p-6 dark:border-white/10 dark:bg-[#121a17] sm:p-8"
        variants={staggerContainer(0.08)}
        initial={reduce ? false : "hidden"}
        whileInView="show"
        viewport={viewportOnce}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
            <Handshake className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-400">{c.plansFaqEyebrow}</p>
            <h3 className="mt-1 text-xl font-semibold tracking-tight">{c.plansFaqTitle}</h3>
          </div>
        </div>
        {[
          [c.plansFaq1q, c.plansFaq1a],
          [c.plansFaq2q, c.plansFaq2a],
          [c.plansFaq3q, c.plansFaq3a],
        ].map(([q, a], i) => (
          <motion.div
            key={q}
            variants={fadeUp}
            className={i > 0 ? "border-t border-slate-100 pt-6 dark:border-white/10" : undefined}
          >
            <p className="font-semibold">{q}</p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{a}</p>
          </motion.div>
        ))}
      </motion.div>

      <Link
        href={`${base}/contact`}
        className="mt-10 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 hover:gap-2.5"
      >
        {c.ctaContact} <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
