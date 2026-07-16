import { Link } from "wouter";
import { lazy, Suspense } from "react";
import { FlagImg } from "@/components/flag-img";
import { VolumePricingBanner } from "./volume-pricing";
import { API_B2B_REGIONS } from "./regions";
import { useApiB2bCopy } from "./use-copy";
import { HeroReportApiDemo } from "./hero-report-api";
import {
  ArrowRight, Code2, Building2, ShieldCheck,
  Gauge, CarFront, History, FileSearch, Globe,
} from "lucide-react";

const FlowDemo = lazy(() => import("./demos").then((m) => ({ default: m.FlowDemo })));
const ProfitStory = lazy(() => import("./demos").then((m) => ({ default: m.ProfitStory })));
const LiveApiConsole = lazy(() => import("./demos").then((m) => ({ default: m.LiveApiConsole })));

function DemoFallback({ className = "h-72" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-[1.5rem] border border-emerald-900/10 bg-emerald-900/[0.04] dark:border-white/10 dark:bg-white/[0.04] ${className}`}
    />
  );
}

export default function ApiB2bHome() {
  const { c, base, decoderHref } = useApiB2bCopy();

  const heroStats = [
    { value: c.heroStatCars, detail: c.heroStatCarsDetail, icon: CarFront },
    { value: c.heroStatRegions, detail: c.heroStatRegionsDetail, icon: Globe },
    { value: c.heroStatReports, detail: c.heroStatReportsDetail, icon: ShieldCheck },
  ];

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

        <div className="relative mx-auto max-w-[74rem] px-4 pb-16 pt-14 sm:px-6 sm:pb-20 sm:pt-20">
          <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-12">
            <div>
              <p className="text-sm font-semibold tracking-[0.14em] text-emerald-800 uppercase dark:text-emerald-400">
                {c.heroBrand}
              </p>
              <h1 className="mt-3 max-w-2xl text-4xl font-semibold tracking-[-0.04em] text-slate-900 sm:text-5xl md:text-[3.4rem] md:leading-[1.02] dark:text-white">
                {c.heroHeadline}
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg dark:text-slate-300">
                {c.heroSub}
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link
                  href={`${base}/contact`}
                  className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition hover:bg-emerald-500"
                >
                  {c.ctaContact} <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href={`${base}/plans`}
                  className="inline-flex items-center gap-2 rounded-full border border-emerald-900/15 bg-white/80 px-6 py-3 text-sm font-semibold text-slate-800 backdrop-blur transition hover:border-emerald-600/40 dark:border-white/15 dark:bg-white/5 dark:text-white"
                >
                  {c.ctaPlans}
                </Link>
              </div>

              <div className="mt-6 grid gap-4 border-t border-emerald-900/8 pt-4 sm:grid-cols-3 sm:gap-5 dark:border-white/8">
                {heroStats.map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <div key={stat.value} className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <Icon className="h-3 w-3 shrink-0 text-emerald-600/90 dark:text-emerald-400/90" />
                        <p className="text-xs font-semibold text-slate-900 dark:text-emerald-100">{stat.value}</p>
                      </div>
                      <p className="mt-1 text-[11px] leading-snug text-slate-500 dark:text-slate-400">{stat.detail}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <HeroReportApiDemo c={c} />
          </div>
        </div>
      </section>

      <section className="api-b2b-section mx-auto max-w-[74rem] px-4 py-16 sm:px-6">
        <Suspense fallback={<DemoFallback className="h-[22rem]" />}>
          <FlowDemo c={c} />
        </Suspense>
      </section>

      <section className="api-b2b-section mx-auto max-w-[74rem] px-4 py-12 sm:px-6">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-semibold tracking-[-0.03em] sm:text-[2.15rem]">{c.dataTitle}</h2>
          <p className="mt-3 max-w-xl text-slate-600 dark:text-slate-300">{c.dataSub}</p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {dataItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="rounded-2xl border border-emerald-900/10 bg-white p-5 dark:border-white/10 dark:bg-[#101816]"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{item.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="api-b2b-section mx-auto max-w-[74rem] px-4 py-14 sm:px-6">
        <Suspense fallback={<DemoFallback className="h-80" />}>
          <ProfitStory c={c} />
        </Suspense>
      </section>

      <section className="api-b2b-section mx-auto max-w-[74rem] px-4 py-8 sm:px-6">
        <Suspense fallback={<DemoFallback className="h-72" />}>
          <LiveApiConsole c={c} contactHref={`${base}/contact`} decoderHref={decoderHref} />
        </Suspense>
      </section>

      <section className="api-b2b-section mx-auto max-w-[74rem] px-4 py-16 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-400">{c.navPlans}</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] sm:text-[2.15rem]">{c.offeringsTitle}</h2>
          <p className="mt-3 max-w-xl text-slate-600 dark:text-slate-300">{c.offeringsSub}</p>
        </div>
        <div className="mt-8">
          <VolumePricingBanner c={c} />
        </div>
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <article className="rounded-[1.5rem] border border-emerald-900/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#101816] sm:p-8">
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
          </article>

          <article className="relative rounded-[1.5rem] border border-emerald-500/40 bg-gradient-to-br from-emerald-50 to-white p-6 shadow-md dark:from-emerald-950/40 dark:to-[#101816] sm:p-8">
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
              className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 mt-6"
            >
              {c.ctaContact} <ArrowRight className="h-4 w-4" />
            </Link>
          </article>
        </div>
      </section>

      <section className="api-b2b-section border-y border-emerald-900/10 bg-white/70 py-14 dark:border-white/10 dark:bg-transparent">
        <div className="mx-auto max-w-[74rem] px-4 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-400">{c.brandApi}</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] sm:text-[2.15rem]">{c.useCasesTitle}</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[c.useCase1, c.useCase2, c.useCase3].map((u) => (
              <div
                key={u}
                className="rounded-2xl border border-emerald-900/10 bg-[#f3f7f4] p-5 text-sm leading-relaxed text-slate-700 dark:border-white/10 dark:bg-[#101816] dark:text-slate-200"
              >
                {u}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="markets" className="api-b2b-section scroll-mt-24 py-16">
        <div className="mx-auto max-w-[74rem] px-4 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-400">{c.navRegions}</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] sm:text-[2.15rem]">{c.regionsTitle}</h2>
          <p className="mt-3 max-w-2xl text-slate-600 dark:text-slate-300">{c.regionsSub}</p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {API_B2B_REGIONS.map((r) => (
              <Link
                key={r.slug}
                href={`${base}/${r.slug}`}
                className="group relative block h-full overflow-hidden rounded-[1.35rem] border border-emerald-900/10 bg-white transition hover:border-emerald-600/40 hover:shadow-lg dark:border-white/10 dark:bg-[#101816]"
              >
                <div className="h-1.5 w-full" style={{ background: r.accent }} />
                <div className="p-5">
                  <div className="flex items-center gap-3">
                    <FlagImg code={r.flag} size={22} />
                    <h3 className="font-semibold text-slate-900 dark:text-white">{c[r.nameKey]}</h3>
                  </div>
                  <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{c[r.blurbKey]}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                    {c.regionExplore} <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
