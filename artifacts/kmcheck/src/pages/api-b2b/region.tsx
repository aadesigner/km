import { Link, Redirect } from "wouter";
import { lazy, Suspense } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { FlagImg } from "@/components/flag-img";
import { findApiB2bRegion, API_B2B_REGIONS } from "./regions";
import { getRegionHeadlineLabel, getRegionSeoLabel } from "./copy";
import { useApiB2bCopy } from "./use-copy";
import { fadeUp, staggerContainer, viewportOnce } from "./motion";
import { ArrowRight, ArrowUpRight, Check, Code2, HelpCircle, Wrench } from "lucide-react";

const FlowDemo = lazy(() => import("./demos").then((m) => ({ default: m.FlowDemo })));

function fillRegion(template: string, label: string) {
  return template.replace(/\{region\}/g, label);
}

export default function ApiB2bRegion({ params }: { params: { region: string } }) {
  const { c, base, lang } = useApiB2bCopy();
  const region = findApiB2bRegion(params.region);
  const reduce = useReducedMotion();

  if (!region) return <Redirect to={base} />;

  const name = c[region.nameKey];
  const label = getRegionSeoLabel(c, region.slug);
  const headline = fillRegion(
    c.regionHeroTitle,
    getRegionHeadlineLabel(c, region.slug, lang),
  );
  const ctaTitle = fillRegion(c.regionCtaTitle, label);
  const whyTitle = fillRegion(c.regionWhyTitle, label);
  const whyBody = fillRegion(c.regionWhyBody, label);
  const sellTitle = fillRegion(c.regionSellTitle, label);
  const faq1q = fillRegion(c.regionFaq1q, label);
  const faq1a = fillRegion(c.regionFaq1a, label);

  return (
    <div>
      <section className="relative overflow-hidden border-b border-emerald-900/10 dark:border-white/10">
        <div
          className="absolute inset-0 opacity-90 dark:opacity-100"
          style={{
            background: `radial-gradient(ellipse 70% 50% at 85% -10%, ${region.accent}40, transparent 55%)`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-50/80 to-transparent dark:from-emerald-500/[0.06] dark:to-transparent" />

        <div className="relative mx-auto max-w-[74rem] px-4 py-14 sm:px-6 sm:py-16">
          <motion.div
            variants={staggerContainer(0.06)}
            initial={reduce ? false : "hidden"}
            animate="show"
          >
            <motion.div variants={fadeUp} className="flex items-center gap-3">
              <FlagImg code={region.flag} className="h-6 w-9 rounded-[3px] shadow" />
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-800 dark:text-emerald-400">
                {name} · {c.heroBrand}
              </p>
            </motion.div>
            <motion.h1
              variants={fadeUp}
              className="mt-5 max-w-3xl text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl md:text-5xl dark:text-white"
            >
              {headline}
            </motion.h1>
            <motion.p
              variants={fadeUp}
              className="mt-4 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg dark:text-slate-300"
            >
              {c.regionHeroSub}
            </motion.p>
            <motion.p
              variants={fadeUp}
              className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-500 dark:text-slate-400"
            >
              {c[region.blurbKey]}
            </motion.p>
            <motion.div variants={fadeUp} className="mt-8 flex flex-wrap gap-3">
              <Link
                href={`${base}/contact`}
                className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-emerald-500 dark:text-emerald-950 dark:hover:bg-emerald-400"
              >
                {c.ctaStart}
                <ArrowUpRight className="h-4 w-4" />
              </Link>
              <Link
                href={`${base}/plans`}
                className="inline-flex rounded-full border border-slate-900/10 bg-white/70 px-6 py-3 text-sm font-semibold text-slate-800 transition hover:bg-white dark:border-white/15 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10"
              >
                {c.ctaPlans}
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section className="api-b2b-section mx-auto max-w-[74rem] px-4 py-14 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewportOnce}
          >
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
              {whyTitle}
            </h2>
            <p className="mt-3 text-slate-600 dark:text-slate-300">{whyBody}</p>
            <ul className="mt-6 space-y-3">
              {c.regionWhyPoints.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-200"
                >
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewportOnce}
            className="rounded-3xl border border-slate-900/[0.07] bg-white/60 p-6 dark:border-white/10 dark:bg-white/[0.03]"
          >
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{c.regionDataTitle}</h3>
            <ul className="mt-4 space-y-3 text-sm text-slate-700 dark:text-slate-200">
              {c.regionDataItems.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-5 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              {c.regionCoverageBody}
            </p>
          </motion.div>
        </div>
      </section>

      <section className="api-b2b-section mx-auto max-w-[74rem] px-4 pb-6 sm:px-6">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
            {sellTitle}
          </h2>
          <p className="mt-3 text-slate-600 dark:text-slate-300">{c.regionSellSub}</p>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <Link
            href={`${base}/plans`}
            className="group rounded-3xl border border-slate-900/[0.07] bg-white/60 p-6 transition hover:border-emerald-600/30 dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-emerald-400/25"
          >
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white dark:bg-emerald-500 dark:text-emerald-950">
              <Code2 className="h-5 w-5" />
            </span>
            <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">
              {c.planDevTitle}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {c.planDevDesc}
            </p>
            <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
              {c.ctaPlans}
              <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
            </span>
          </Link>
          <Link
            href={`${base}/plans`}
            className="group rounded-3xl border border-slate-900/[0.07] bg-white/60 p-6 transition hover:border-emerald-600/30 dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-emerald-400/25"
          >
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white dark:bg-emerald-500 dark:text-emerald-950">
              <Wrench className="h-5 w-5" />
            </span>
            <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">
              {c.planManagedTitle}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {c.planManagedDesc}
            </p>
            <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
              {c.ctaContact}
              <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
            </span>
          </Link>
        </div>
      </section>

      <section className="api-b2b-section mx-auto max-w-[74rem] px-4 py-12 sm:px-6">
        <Suspense
          fallback={
            <div className="h-[22rem] animate-pulse rounded-[1.75rem] border border-slate-900/10 bg-slate-900/[0.04] dark:border-white/10" />
          }
        >
          <FlowDemo c={c} />
        </Suspense>
      </section>

      <section className="api-b2b-section mx-auto max-w-[74rem] px-4 py-10 sm:px-6">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{c.regionProofTitle}</h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {c.regionProofItems.map((item) => (
            <div
              key={item}
              className="rounded-2xl border border-slate-900/[0.06] bg-white/50 px-4 py-4 text-sm font-medium text-slate-700 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-200"
            >
              {item}
            </div>
          ))}
        </div>
      </section>

      <section className="api-b2b-section mx-auto max-w-[74rem] px-4 pb-10 sm:px-6">
        <div className="grid gap-4 md:grid-cols-2">
          {[
            { q: faq1q, a: faq1a },
            { q: c.regionFaq2q, a: c.regionFaq2a },
          ].map((faq) => (
            <div
              key={faq.q}
              className="rounded-2xl border border-slate-900/[0.06] bg-white/40 p-5 dark:border-white/10 dark:bg-white/[0.03]"
            >
              <p className="flex items-start gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                {faq.q}
              </p>
              <p className="mt-2 pl-6 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="api-b2b-section mx-auto max-w-[74rem] px-4 pb-16 sm:px-6">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          className="rounded-3xl bg-[#0b1210] px-6 py-10 text-white sm:px-10"
        >
          <h2 className="text-2xl font-semibold tracking-tight">{ctaTitle}</h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-400">{c.regionCtaBody}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={`${base}/contact`}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400"
            >
              {c.ctaStart}
              <ArrowUpRight className="h-4 w-4" />
            </Link>
            <Link
              href={`${base}/vin-decoder`}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/5"
            >
              {c.navDecoder}
              <ArrowRight className="h-4 w-4 opacity-60" />
            </Link>
          </div>
        </motion.div>

        <div className="mt-12">
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{c.navRegions}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {API_B2B_REGIONS.filter((r) => r.slug !== region.slug).map((r) => (
              <Link
                key={r.slug}
                href={`${base}/${r.slug}`}
                className="inline-flex items-center gap-2 rounded-full border border-slate-900/10 bg-white/70 px-3 py-1.5 text-sm text-slate-700 transition hover:border-emerald-600/35 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
              >
                <FlagImg code={r.flag} className="h-3.5 w-5 rounded-[2px]" />
                {c[r.nameKey]}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
