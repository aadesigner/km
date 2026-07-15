import { Link } from "wouter";
import { useApiB2bCopy } from "./use-copy";
import { Mail, Send, ArrowRight, ShieldCheck } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { fadeUp, staggerContainer, viewportOnce } from "./motion";

export default function ApiB2bContact() {
  const { c, base } = useApiB2bCopy();
  const reduce = useReducedMotion();
  const telegramHref = `https://t.me/${c.contactTelegram}`;

  return (
    <div className="relative overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 55% at 50% -10%, rgba(16,185,129,0.28), transparent 55%), linear-gradient(180deg, #e8f5ef 0%, #f4f7f5 42%, #f4f7f5 100%)",
        }}
      />
      {!reduce && (
        <motion.div
          className="pointer-events-none absolute left-[15%] top-16 h-64 w-64 rounded-full bg-emerald-400/15 blur-3xl"
          animate={{ opacity: [0.3, 0.5, 0.3], x: [0, 24, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      <div className="relative mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-24">
        <motion.div
          variants={staggerContainer(0.08)}
          initial={reduce ? false : "hidden"}
          animate="show"
          className="max-w-3xl"
        >
          <motion.div
            variants={fadeUp}
            className="inline-flex items-center gap-2 rounded-full border border-emerald-700/15 bg-white/70 px-3 py-1 text-xs font-semibold text-emerald-800 backdrop-blur"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            {c.brandApi} · {c.navContact}
          </motion.div>
          <motion.h1
            variants={fadeUp}
            className="mt-5 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl"
          >
            {c.contactHeroTitle}
          </motion.h1>
          <motion.p variants={fadeUp} className="mt-4 max-w-2xl text-lg leading-relaxed text-slate-600">
            {c.contactHeroSub}
          </motion.p>
        </motion.div>

        <motion.div
          className="mt-12 grid gap-4 sm:grid-cols-2"
          variants={staggerContainer(0.1)}
          initial={reduce ? false : "hidden"}
          animate="show"
        >
          <motion.a
            variants={fadeUp}
            whileHover={reduce ? undefined : { y: -4 }}
            href={`mailto:${c.contactEmail}`}
            className="group flex h-full flex-col rounded-[1.35rem] border border-emerald-900/10 bg-white p-6 shadow-sm transition hover:border-emerald-600/40 hover:shadow-lg sm:p-7"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 transition group-hover:bg-emerald-600 group-hover:text-white">
              <Mail className="h-5 w-5" />
            </span>
            <span className="mt-5 text-xs font-semibold uppercase tracking-wider text-slate-400">
              {c.contactEmailLabel}
            </span>
            <span className="mt-1.5 break-all text-lg font-semibold text-slate-900 group-hover:text-emerald-700">
              {c.contactEmail}
            </span>
            <span className="mt-auto pt-8 inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition group-hover:bg-emerald-600">
              {c.contactEmailLabel}
              <ArrowRight className="h-4 w-4" />
            </span>
          </motion.a>

          <motion.a
            variants={fadeUp}
            whileHover={reduce ? undefined : { y: -4 }}
            href={telegramHref}
            target="_blank"
            rel="noreferrer"
            className="group flex h-full flex-col rounded-[1.35rem] border border-sky-500/20 bg-gradient-to-br from-[#229ED9] to-[#1578ad] p-6 text-white shadow-md shadow-sky-900/15 transition hover:shadow-lg sm:p-7"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur">
              <Send className="h-5 w-5" />
            </span>
            <span className="mt-5 text-xs font-semibold uppercase tracking-wider text-white/70">
              {c.contactTelegramLabel}
            </span>
            <span className="mt-1.5 text-lg font-semibold tracking-tight">
              {c.ctaContact}
            </span>
            <span className="mt-auto pt-8 inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-4 py-3 text-sm font-semibold text-[#1578ad] transition group-hover:bg-white/95">
              <Send className="h-4 w-4" />
              {c.contactTelegramLabel}
            </span>
          </motion.a>
        </motion.div>

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          className="mt-10 rounded-[1.35rem] border border-emerald-900/10 bg-white/80 p-6 backdrop-blur sm:flex sm:items-center sm:justify-between sm:gap-6 sm:p-7"
        >
          <p className="max-w-md text-sm leading-relaxed text-slate-600">{c.contactNote}</p>
          <div className="mt-4 flex flex-wrap gap-2 sm:mt-0 sm:justify-end">
            <a
              href={telegramHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-[#229ED9] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1d8fc4]"
            >
              <Send className="h-4 w-4" />
              {c.contactTelegramLabel}
            </a>
            <Link
              href={`${base}/plans`}
              className="inline-flex items-center gap-2 rounded-full border border-emerald-900/12 bg-emerald-50 px-5 py-2.5 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100"
            >
              {c.ctaPlans} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
