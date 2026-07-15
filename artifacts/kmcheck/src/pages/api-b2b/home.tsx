import { Link } from "wouter";
import { lazy, Suspense } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { FlagImg } from "@/components/flag-img";
import { VolumePricingBanner } from "./volume-pricing";
import { API_B2B_REGIONS } from "./regions";
import { useApiB2bCopy } from "./use-copy";
import { fadeUp, fadeUpTransition, staggerContainer, viewportOnce } from "./motion";
import {
  ArrowRight, Code2, Building2, ShieldCheck,
  Gauge, CarFront, History, FileSearch,
} from "lucide-react";

const FlowDemo = lazy(() => import("./demos").then((m) => ({ default: m.FlowDemo })));
const ProfitStory = lazy(() => import("./demos").then((m) => ({ default: m.ProfitStory })));
const LiveApiConsole = lazy(() => import("./demos").then((m) => ({ default: m.LiveApiConsole })));

function DemoFallback({ className = "h-72" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-[1.75rem] border border-emerald-900/10 bg-emerald-900/[0.04] dark:border-white/10 dark:bg-white/[0.04] ${className}`}
    />
  );
}

export default function ApiB2bHome() {
  const { c, base, decoderHref } = useApiB2bCopy();
  const reduce = useReducedMotion();

  const dataItems = [
    { title: c.dataItem1Title, body: c.dataItem1Body, icon: FileSearch },
    { title: c.dataItem2Title, body: c.dataItem2Body, icon: History },
    { title: c.dataItem3Title, body: c.dataItem3Body, icon: Gauge },
    { title: c.dataItem4Title, body: c.dataItem4Body, icon: CarFront },
  ];

  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_75%_-10%,rgba(16,185,129,0.32),transparent_55%),radial-gradient(ellipse_45%_40%_at_5%_90%,rgba(20,184,166,0.16),transparent_50%),linear-gradient(180deg,#dff3ea_0%,#f3f7f4_58%,#f3f7f4_100%)] dark:bg-[radial-gradient(ellipse_80%_60%_at_75%_-10%,rgba(16,185,129,0.18),transparent_55%),linear-gradient(180deg,#0b1511,#090f0d)]" />
        {!reduce && (
          <motion.div
            className="pointer-events-none absolute -right-24 top-10 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl will-change-transform"
            animate={{ opacity: [0.35, 0.55, 0.35], scale: [1, 1.06, 1] }}
            transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
          />
        )}

        <motion.div
          className="relative mx-auto max-w-6xl px-4 pb-20 pt-16 sm:px-6 sm:pt-24"
          variants={staggerContainer(0.07)}
          initial={reduce ? false : "hidden"}
          animate="show"
        >
          <motion.div
            variants={fadeUp}
            transition={fadeUpTransition()}
            className="inline-flex items-center gap-2 rounded-full border border-emerald-700/15 bg-white/70 px-3 py-1 text-xs font-semibold text-emerald-800 backdrop-blur dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-300"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            {c.heroTrust}
          </motion.div>
          <motion.p
            variants={fadeUp}
            transition={fadeUpTransition()}
            className="mt-5 text-sm font-semibold tracking-[0.14em] text-emerald-800 uppercase dark:text-emerald-400"
          >
            {c.heroBrand}
          </motion.p>
          <motion.h1
            variants={fadeUp}
            transition={fadeUpTransition()}
            className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl md:text-6xl dark:text-white"
          >
            {c.heroHeadline}
          </motion.h1>
          <motion.p
            variants={fadeUp}
            transition={fadeUpTransition()}
            className="mt-5 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg dark:text-slate-300"
          >
            {c.heroSub}
          </motion.p>
          <motion.div
            variants={fadeUp}
            transition={fadeUpTransition()}
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            <Link
              href={`${base}/contact`}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition hover:bg-emerald-500 hover:gap-2.5 active:scale-[0.98]"
            >
              {c.ctaContact} <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href={`${base}/plans`}
              className="inline-flex items-center gap-2 rounded-full border border-emerald-900/15 bg-white/80 px-6 py-3 text-sm font-semibold text-slate-800 backdrop-blur transition hover:border-emerald-600/40 active:scale-[0.98] dark:border-white/15 dark:bg-white/5 dark:text-white"
            >
              {c.ctaPlans}
            </Link>
          </motion.div>

          <motion.div
            variants={fadeUp}
            transition={fadeUpTransition()}
            className="mt-12 grid grid-cols-1 gap-4 border-t border-emerald-900/10 pt-8 sm:grid-cols-3 dark:border-white/10"
          >
            {[c.heroStatCars, c.heroStatRegions, c.heroStatReports].map((stat, i) => (
              <motion.div
                key={stat}
                whileHover={reduce ? undefined : { y: -3 }}
                transition={{ type: "spring", stiffness: 400, damping: 24 }}
                className="rounded-2xl border border-emerald-900/8 bg-white/55 px-4 py-4 backdrop-blur dark:border-white/10 dark:bg-white/5"
                style={{ transitionDelay: `${i * 40}ms` }}
              >
                <p className="text-xl font-semibold text-emerald-800 dark:text-emerald-300 sm:text-2xl">{stat}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      <section className="api-b2b-section mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <Suspense fallback={<DemoFallback className="h-[28rem]" />}>
          <FlowDemo c={c} />
        </Suspense>
      </section>

      <section className="api-b2b-section mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-semibold tracking-tight">{c.dataTitle}</h2>
          <p className="mt-3 text-slate-600 dark:text-slate-300">{c.dataSub}</p>
        </div>
        <motion.div
          className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          variants={staggerContainer(0.06)}
          initial={reduce ? false : "hidden"}
          whileInView="show"
          viewport={viewportOnce}
        >
          {dataItems.map((item) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                variants={fadeUp}
                whileHover={reduce ? undefined : { y: -4, transition: { type: "spring", stiffness: 400, damping: 22 } }}
                className="rounded-2xl border border-emerald-900/10 bg-white p-5 dark:border-white/10 dark:bg-[#101816]"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{item.body}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      <section className="api-b2b-section mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <Suspense fallback={<DemoFallback className="h-80" />}>
          <ProfitStory c={c} />
        </Suspense>
      </section>

      <section className="api-b2b-section mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Suspense fallback={<DemoFallback className="h-72" />}>
          <LiveApiConsole c={c} contactHref={`${base}/contact`} decoderHref={decoderHref} />
        </Suspense>
      </section>

      <section className="api-b2b-section mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-semibold tracking-tight">{c.offeringsTitle}</h2>
          <p className="mt-3 text-slate-600 dark:text-slate-300">{c.offeringsSub}</p>
        </div>
        <div className="mt-8">
          <VolumePricingBanner c={c} />
        </div>
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <motion.article
            initial={reduce ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewportOnce}
            whileHover={reduce ? undefined : { y: -3 }}
            className="rounded-[1.5rem] border border-emerald-900/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#101816] sm:p-8"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
              <Code2 className="h-5 w-5" />
            </div>
            <h3 className="mt-5 text-xl font-semibold">{c.planDevTitle}</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{c.planDevDesc}</p>
            <ul className="mt-5 space-y-2 text-sm text-slate-700 dark:text-slate-200">
              {c.planDevPoints.map((p) => (
                <li key={p} className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                  {p}
                </li>
              ))}
            </ul>
            <Link href={`${base}/plans`} className="mt-6 inline-flex text-sm font-semibold text-emerald-700 hover:underline dark:text-emerald-400">
              {c.ctaPlans}
            </Link>
          </motion.article>

          <motion.article
            initial={reduce ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewportOnce}
            transition={{ delay: 0.08 }}
            whileHover={reduce ? undefined : { y: -3 }}
            className="relative rounded-[1.5rem] border border-emerald-500/40 bg-gradient-to-br from-emerald-50 to-white p-6 shadow-md dark:from-emerald-950/40 dark:to-[#101816] sm:p-8"
          >
            <span className="absolute right-5 top-5 rounded-full bg-emerald-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
              {c.planPopular}
            </span>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white">
              <Building2 className="h-5 w-5" />
            </div>
            <h3 className="mt-5 text-xl font-semibold">{c.planManagedTitle}</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{c.planManagedDesc}</p>
            <ul className="mt-5 space-y-2 text-sm text-slate-700 dark:text-slate-200">
              {c.planManagedPoints.map((p) => (
                <li key={p} className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                  {p}
                </li>
              ))}
            </ul>
            <Link
              href={`${base}/contact`}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 hover:gap-2.5"
            >
              {c.ctaContact} <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.article>
        </div>
      </section>

      <section className="api-b2b-section border-y border-emerald-900/10 bg-white/70 py-14 dark:border-white/10 dark:bg-transparent">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{c.useCasesTitle}</h2>
          <motion.div
            className="mt-8 grid gap-4 md:grid-cols-3"
            variants={staggerContainer(0.07)}
            initial={reduce ? false : "hidden"}
            whileInView="show"
            viewport={viewportOnce}
          >
            {[c.useCase1, c.useCase2, c.useCase3].map((u) => (
              <motion.div
                key={u}
                variants={fadeUp}
                className="rounded-2xl border border-emerald-900/10 bg-[#f3f7f4] p-5 text-sm leading-relaxed text-slate-700 dark:border-white/10 dark:bg-[#101816] dark:text-slate-200"
              >
                {u}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section id="markets" className="api-b2b-section scroll-mt-24 py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-3xl font-semibold tracking-tight">{c.regionsTitle}</h2>
          <p className="mt-3 max-w-2xl text-slate-600 dark:text-slate-300">{c.regionsSub}</p>
          <motion.div
            className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            variants={staggerContainer(0.05)}
            initial={reduce ? false : "hidden"}
            whileInView="show"
            viewport={viewportOnce}
          >
            {API_B2B_REGIONS.map((r) => (
              <motion.div key={r.slug} variants={fadeUp}>
                <Link
                  href={`${base}/${r.slug}`}
                  className="group block h-full overflow-hidden rounded-[1.35rem] border border-emerald-900/10 bg-white transition duration-300 hover:-translate-y-1 hover:border-emerald-600/40 hover:shadow-xl dark:border-white/10 dark:bg-[#101816]"
                >
                  <div className="h-1.5 w-full transition-all duration-300 group-hover:h-2" style={{ background: r.accent }} />
                  <div className="p-5">
                    <div className="flex items-center gap-3">
                      <FlagImg code={r.flag} size={22} />
                      <h3 className="font-semibold text-slate-900 dark:text-white">{c[r.nameKey]}</h3>
                    </div>
                    <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{c[r.blurbKey]}</p>
                    <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 transition-all group-hover:gap-2 dark:text-emerald-400">
                      {c.regionExplore} <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </div>
  );
}
