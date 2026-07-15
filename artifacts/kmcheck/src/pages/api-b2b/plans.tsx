import { Link } from "wouter";
import { motion, useReducedMotion } from "framer-motion";
import { useApiB2bCopy } from "./use-copy";
import { VolumePricingBanner } from "./volume-pricing";
import { fadeUp, staggerContainer, viewportOnce } from "./motion";
import { ApiDevPlanDemo, ManagedSitePlanDemo } from "./plans-demos";
import { ArrowRight, Code2, Building2 } from "lucide-react";

export default function ApiB2bPlans() {
  const { c, base } = useApiB2bCopy();
  const reduce = useReducedMotion();

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-emerald-700">{c.brandApi}</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">{c.plansHeroTitle}</h1>
        <p className="mt-4 max-w-2xl text-slate-600 dark:text-slate-300">{c.plansHeroSub}</p>
      </motion.div>

      <div className="mt-10">
        <VolumePricingBanner c={c} />
      </div>

      <h2 className="mt-14 text-2xl font-semibold">{c.plansCompareTitle}</h2>

      {/* Developer plan */}
      <motion.section
        initial={reduce ? false : { opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={viewportOnce}
        className="mt-8 overflow-hidden rounded-[1.75rem] border border-emerald-900/10 bg-white shadow-sm dark:border-white/10 dark:bg-[#121a17]"
      >
        <div className="grid gap-0 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="flex flex-col justify-center p-6 sm:p-8 lg:p-10">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white dark:bg-emerald-500 dark:text-emerald-950">
              <Code2 className="h-5 w-5" />
            </div>
            <h3 className="mt-5 text-2xl font-semibold tracking-tight sm:text-3xl">{c.planDevTitle}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{c.planDevDesc}</p>
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

      <motion.div
        className="mt-12 space-y-6 rounded-2xl border border-emerald-900/10 bg-white p-6 dark:border-white/10 dark:bg-[#121a17] sm:p-8"
        variants={staggerContainer(0.08)}
        initial={reduce ? false : "hidden"}
        whileInView="show"
        viewport={viewportOnce}
      >
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
