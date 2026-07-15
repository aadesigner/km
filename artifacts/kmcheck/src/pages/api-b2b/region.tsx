import { Link, Redirect } from "wouter";
import { lazy, Suspense } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { FlagImg } from "@/components/flag-img";
import { findApiB2bRegion, API_B2B_REGIONS } from "./regions";
import { useApiB2bCopy } from "./use-copy";
import { viewportOnce } from "./motion";
import { ArrowRight } from "lucide-react";

const FlowDemo = lazy(() => import("./demos").then((m) => ({ default: m.FlowDemo })));

export default function ApiB2bRegion({ params }: { params: { region: string } }) {
  const { c, base } = useApiB2bCopy();
  const region = findApiB2bRegion(params.region);
  const reduce = useReducedMotion();

  if (!region) return <Redirect to={base} />;

  const name = c[region.nameKey];

  return (
    <div>
      <section className="relative overflow-hidden border-b border-emerald-900/10">
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse 70% 55% at 80% 0%, ${region.accent}33, transparent 55%), linear-gradient(180deg, #e8f5ef, #f4f7f5)`,
          }}
        />
        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="flex items-center gap-3">
            <FlagImg code={region.flag} className="h-6 w-9 rounded-[3px] shadow" />
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-emerald-800">{c.heroBrand}</p>
          </div>
          <motion.h1
            initial={reduce ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl"
          >
            {name}
          </motion.h1>
          <p className="mt-4 max-w-2xl text-lg text-slate-600">{c.regionHeroSub}</p>
          <p className="mt-3 max-w-2xl text-slate-600">{c[region.blurbKey]}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={`${base}/contact`}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 hover:gap-2.5"
            >
              {c.ctaContact} <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href={`${base}/plans`}
              className="inline-flex rounded-full border border-emerald-900/15 bg-white/80 px-6 py-3 text-sm font-semibold transition hover:border-emerald-600/40"
            >
              {c.ctaPlans}
            </Link>
          </div>
        </div>
      </section>

      <section className="api-b2b-section mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <Suspense
          fallback={
            <div className="h-[28rem] animate-pulse rounded-[1.75rem] border border-emerald-900/10 bg-emerald-900/[0.04]" />
          }
        >
          <FlowDemo c={c} />
        </Suspense>
      </section>

      <section className="api-b2b-section mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-2">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewportOnce}
          >
            <h2 className="text-2xl font-semibold">{c.regionCoverageTitle}</h2>
            <p className="mt-3 text-slate-600 dark:text-slate-300">{c.regionCoverageBody}</p>
          </motion.div>
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewportOnce}
            transition={{ delay: 0.06 }}
            className="rounded-2xl border border-emerald-900/10 bg-white p-6 dark:border-white/10 dark:bg-[#121a17]"
          >
            <h3 className="font-semibold">{c.regionDataTitle}</h3>
            <ul className="mt-4 space-y-3 text-sm text-slate-700 dark:text-slate-200">
              {c.regionDataItems.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        <div className="mt-14 rounded-2xl bg-[#0f1a16] px-6 py-10 text-white sm:px-10">
          <h2 className="text-2xl font-semibold">{c.regionCtaTitle}</h2>
          <p className="mt-3 max-w-xl text-slate-300">{c.regionCtaBody}</p>
          <Link
            href={`${base}/contact`}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400 hover:gap-2.5"
          >
            {c.ctaStart} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-12">
          <p className="text-sm font-semibold text-slate-500">{c.navRegions}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {API_B2B_REGIONS.filter((r) => r.slug !== region.slug).map((r) => (
              <Link
                key={r.slug}
                href={`${base}/${r.slug}`}
                className="inline-flex items-center gap-2 rounded-full border border-emerald-900/10 bg-white px-3 py-1.5 text-sm transition hover:-translate-y-0.5 hover:border-emerald-600/40 dark:border-white/10 dark:bg-[#121a17]"
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
