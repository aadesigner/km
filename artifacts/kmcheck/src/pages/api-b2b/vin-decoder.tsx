import { Link } from "wouter";
import { useApiB2bCopy } from "./use-copy";
import { ArrowRight, ArrowUpRight, Check, Code2, ScanLine, Wrench } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { fadeUp, staggerContainer, viewportOnce } from "./motion";

export default function ApiB2bVinDecoder() {
  const { c, base, decoderHref } = useApiB2bCopy();
  const reduce = useReducedMotion();

  return (
    <div className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 dark:opacity-100"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% -8%, rgba(16,185,129,0.22), transparent 55%)",
        }}
      />

      <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <motion.div
          variants={staggerContainer(0.07)}
          initial={reduce ? false : "hidden"}
          animate="show"
          className="max-w-3xl"
        >
          <motion.div
            variants={fadeUp}
            className="inline-flex items-center gap-2 rounded-full border border-emerald-700/15 bg-white/60 px-3 py-1 text-xs font-semibold text-emerald-800 backdrop-blur dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-300"
          >
            <ScanLine className="h-3.5 w-3.5" />
            {c.navDecoder}
          </motion.div>
          <motion.h1
            variants={fadeUp}
            className="mt-5 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl dark:text-white"
          >
            {c.decoderPageHeroTitle}
          </motion.h1>
          <motion.p
            variants={fadeUp}
            className="mt-4 max-w-2xl text-lg leading-relaxed text-slate-600 dark:text-slate-300"
          >
            {c.decoderPageHeroSub}
          </motion.p>
          <motion.div variants={fadeUp} className="mt-8 flex flex-wrap gap-3">
            <Link
              href={`${base}/contact`}
              className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-emerald-500 dark:text-emerald-950 dark:hover:bg-emerald-400"
            >
              {c.ctaStart}
              <ArrowUpRight className="h-4 w-4" />
            </Link>
            <a
              href={decoderHref}
              className="inline-flex items-center gap-2 rounded-full border border-slate-900/10 bg-white/70 px-5 py-3 text-sm font-semibold text-slate-800 transition hover:bg-white dark:border-white/15 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10"
            >
              {c.decoderCta}
              <ArrowRight className="h-4 w-4 opacity-60" />
            </a>
          </motion.div>
        </motion.div>

        <motion.p
          variants={fadeUp}
          initial={reduce ? false : "hidden"}
          whileInView="show"
          viewport={viewportOnce}
          className="mt-14 max-w-3xl text-base leading-relaxed text-slate-600 dark:text-slate-300"
        >
          {c.decoderPageLead}
        </motion.p>

        <motion.section
          variants={staggerContainer(0.05)}
          initial={reduce ? false : "hidden"}
          whileInView="show"
          viewport={viewportOnce}
          className="mt-14"
        >
          <motion.h2
            variants={fadeUp}
            className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white"
          >
            {c.decoderPageSpecsTitle}
          </motion.h2>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {c.decoderPageSpecs.map((item) => (
              <motion.li
                key={item}
                variants={fadeUp}
                className="flex items-start gap-3 rounded-2xl border border-slate-900/[0.06] bg-white/50 px-4 py-3.5 text-sm text-slate-700 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-200"
              >
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>{item}</span>
              </motion.li>
            ))}
          </ul>
        </motion.section>

        <motion.section
          variants={staggerContainer(0.06)}
          initial={reduce ? false : "hidden"}
          whileInView="show"
          viewport={viewportOnce}
          className="mt-16"
        >
          <motion.h2
            variants={fadeUp}
            className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white"
          >
            {c.decoderPageDeliveryTitle}
          </motion.h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <motion.div
              variants={fadeUp}
              className="rounded-3xl border border-slate-900/[0.07] bg-white/60 p-6 dark:border-white/10 dark:bg-white/[0.03]"
            >
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white dark:bg-emerald-500 dark:text-emerald-950">
                <Code2 className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">
                {c.decoderPageApiTitle}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {c.decoderPageApiBody}
              </p>
              <Link
                href={`${base}/plans`}
                className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 dark:text-emerald-400"
              >
                {c.planDevTitle}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </motion.div>
            <motion.div
              variants={fadeUp}
              className="rounded-3xl border border-slate-900/[0.07] bg-white/60 p-6 dark:border-white/10 dark:bg-white/[0.03]"
            >
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white dark:bg-emerald-500 dark:text-emerald-950">
                <Wrench className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">
                {c.decoderPageManagedTitle}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {c.decoderPageManagedBody}
              </p>
              <Link
                href={`${base}/plans`}
                className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 dark:text-emerald-400"
              >
                {c.planManagedTitle}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </motion.div>
          </div>
        </motion.section>

        <motion.section
          variants={fadeUp}
          initial={reduce ? false : "hidden"}
          whileInView="show"
          viewport={viewportOnce}
          className="mt-16 rounded-3xl border border-emerald-900/10 bg-gradient-to-br from-emerald-50/80 to-white/40 p-7 sm:p-9 dark:border-emerald-400/15 dark:from-emerald-500/10 dark:to-white/[0.03]"
        >
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{c.decoderPageTryTitle}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            {c.decoderPageTryBody}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href={decoderHref}
              className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white dark:bg-emerald-500 dark:text-emerald-950"
            >
              {c.ctaTryDecoder}
              <ArrowUpRight className="h-4 w-4" />
            </a>
            <Link
              href={`${base}/contact`}
              className="inline-flex items-center gap-2 rounded-full border border-slate-900/10 px-5 py-3 text-sm font-semibold text-slate-800 dark:border-white/15 dark:text-slate-100"
            >
              {c.ctaContact}
            </Link>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
