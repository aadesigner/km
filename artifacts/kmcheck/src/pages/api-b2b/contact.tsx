import { Link } from "wouter";
import { useApiB2bCopy } from "./use-copy";
import { Mail, Send, ArrowRight, Clock3 } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { fadeUp, staggerContainer, viewportOnce } from "./motion";

export default function ApiB2bContact() {
  const { c, base } = useApiB2bCopy();
  const reduce = useReducedMotion();
  const telegramHref = `https://t.me/${c.contactTelegram}`;

  return (
    <div className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 45% at 50% -5%, rgba(16,185,129,0.18), transparent 55%)",
        }}
      />

      <div className="relative mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
        <motion.div
          variants={staggerContainer(0.07)}
          initial={reduce ? false : "hidden"}
          animate="show"
          className="text-center"
        >
          <motion.p
            variants={fadeUp}
            className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-400"
          >
            {c.navContact}
          </motion.p>
          <motion.h1
            variants={fadeUp}
            className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl md:text-[2.75rem] md:leading-[1.15] dark:text-white"
          >
            {c.contactHeroTitle}
          </motion.h1>
          <motion.p
            variants={fadeUp}
            className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg dark:text-slate-300"
          >
            {c.contactHeroSub}
          </motion.p>
        </motion.div>

        <motion.div
          className="mt-12 space-y-3"
          variants={staggerContainer(0.08)}
          initial={reduce ? false : "hidden"}
          animate="show"
        >
          <motion.a
            variants={fadeUp}
            href={`mailto:${c.contactEmail}`}
            className="group flex items-center gap-4 rounded-2xl border border-slate-900/10 bg-white/70 px-5 py-4 transition hover:border-emerald-600/35 hover:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:hover:border-emerald-400/30 dark:hover:bg-white/[0.07]"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white dark:bg-emerald-500 dark:text-emerald-950">
              <Mail className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1 text-left">
              <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {c.contactEmailLabel}
              </span>
              <span className="mt-0.5 block text-[15px] font-semibold text-slate-900 dark:text-white">
                {c.contactEmailAction}
              </span>
              <span className="mt-0.5 block truncate text-xs text-slate-500 dark:text-slate-400">
                {c.contactEmail}
              </span>
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-emerald-600 dark:group-hover:text-emerald-400" />
          </motion.a>

          <motion.a
            variants={fadeUp}
            href={telegramHref}
            target="_blank"
            rel="noreferrer"
            className="group flex items-center gap-4 rounded-2xl bg-[#229ED9] px-5 py-4 text-white shadow-md shadow-sky-900/10 transition hover:bg-[#1d8fc4]"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/20">
              <Send className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1 text-left">
              <span className="block text-xs font-semibold uppercase tracking-wider text-white/70">
                {c.contactTelegramLabel}
              </span>
              <span className="mt-0.5 block text-[15px] font-semibold">
                {c.contactTelegramAction}
              </span>
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 text-white/70 transition group-hover:translate-x-0.5 group-hover:text-white" />
          </motion.a>
        </motion.div>

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          className="mt-10 flex flex-col items-center gap-4 border-t border-slate-900/8 pt-8 dark:border-white/10 sm:flex-row sm:justify-between"
        >
          <p className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <Clock3 className="h-4 w-4 shrink-0 opacity-70" />
            {c.contactNote}
          </p>
          <Link
            href={`${base}/plans`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 transition hover:text-emerald-600 dark:text-emerald-400 dark:hover:text-emerald-300"
          >
            {c.ctaPlans}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
