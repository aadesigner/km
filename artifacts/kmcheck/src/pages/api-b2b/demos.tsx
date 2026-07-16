import { Link } from "wouter";
import type { B2bCopy } from "./copy";
import { ArrowRight, Database, FileCheck2, Globe2, Search } from "lucide-react";

export function FlowDemo({ c }: { c: B2bCopy }) {
  const steps = [
    { title: c.flowStep1, detail: c.flowStep1Detail, icon: Globe2, label: c.flowVisitor },
    { title: c.flowStep2, detail: c.flowStep2Detail, icon: Search, label: c.flowYourSite },
    { title: c.flowStep3, detail: c.flowStep3Detail, icon: Database, label: c.flowKmApi },
    { title: c.flowStep4, detail: c.flowStep4Detail, icon: FileCheck2, label: c.flowReport },
  ];

  return (
    <div className="rounded-[1.5rem] border border-emerald-900/10 bg-white dark:border-white/10 dark:bg-[#101816]">
      <div className="border-b border-emerald-900/8 px-5 py-7 sm:px-8 sm:py-8 dark:border-white/8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-400">
          {c.flowBadge}
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] sm:text-[1.85rem]">{c.flowTitle}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">{c.flowSub}</p>
      </div>

      <ol className="grid gap-0 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, i) => {
          const Icon = step.icon;
          const last = i === steps.length - 1;
          return (
            <li
              key={step.title}
              className="relative border-b border-emerald-900/8 p-5 sm:p-6 lg:border-b-0 lg:border-r last:lg:border-r-0 dark:border-white/8"
            >
              {!last && (
                <ArrowRight
                  aria-hidden
                  className="pointer-events-none absolute right-3 top-1/2 hidden h-4 w-4 -translate-y-1/2 text-emerald-600/40 lg:block dark:text-emerald-400/50"
                />
              )}
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-700 dark:text-emerald-400">
                      {step.label}
                    </p>
                  </div>
                  <p className="mt-1.5 text-sm font-semibold text-slate-900 dark:text-white">{step.title}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{step.detail}</p>
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="border-t border-emerald-900/8 px-5 py-5 sm:px-8 dark:border-white/8">
        <div className="overflow-hidden rounded-xl border border-emerald-900/10 bg-[#f3f7f4] dark:border-white/10 dark:bg-[#0a110e]">
          <div className="flex items-center gap-2 border-b border-emerald-900/8 px-3 py-2 dark:border-white/8">
            <span className="h-2 w-2 rounded-full bg-slate-300 dark:bg-white/20" />
            <span className="h-2 w-2 rounded-full bg-slate-300 dark:bg-white/20" />
            <span className="h-2 w-2 rounded-full bg-slate-300 dark:bg-white/20" />
            <span className="ml-1 truncate font-mono text-[10px] text-slate-500">{c.flowMockBrowserUrl}</span>
          </div>
          <div className="grid gap-4 p-4 sm:grid-cols-[1fr_auto_1fr] sm:items-center sm:gap-3 sm:p-5">
            <div className="rounded-lg border border-emerald-900/10 bg-white px-3 py-2.5 dark:border-white/10 dark:bg-[#101816]">
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">{c.flowMockVinLabel}</p>
              <p className="mt-1 font-mono text-sm tracking-wide text-slate-800 dark:text-emerald-200/90">
                KM8J3CA46NU•••••
              </p>
            </div>
            <ArrowRight className="mx-auto hidden h-4 w-4 text-emerald-600 sm:block dark:text-emerald-400" />
            <div className="rounded-lg border border-emerald-500/25 bg-emerald-50 px-3 py-2.5 dark:border-emerald-500/20 dark:bg-emerald-500/10">
              <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">{c.flowMockPaidTitle}</p>
              <p className="mt-1 text-xs leading-relaxed text-emerald-800/80 dark:text-emerald-100/70">{c.flowMockPaidBody}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** API live console + VIN decode as included API capability */
export function LiveApiConsole({
  c,
  contactHref,
  decoderHref,
}: {
  c: B2bCopy;
  contactHref: string;
  decoderHref: string;
}) {
  const lines = [
    `GET /v1/reports?vin=KM8J3CA46NU••••••`,
    `→ 200 OK · 86ms · ${c.flowKmApi}`,
    `{ "make": "Hyundai", "model": "Tucson", "year": 2022,`,
    `  "accidents": 0, "odometer": [ … ], "sources": 14 }`,
  ] as const;

  return (
    <div className="relative overflow-hidden rounded-[1.5rem] border border-emerald-500/25 bg-gradient-to-br from-[#0f1a16] to-[#132820] p-6 text-white sm:p-10">
      <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-300">
            {c.brandApi}
          </div>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight">{c.decoderTitle}</h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-300">{c.decoderSub}</p>
          <ul className="mt-5 space-y-2 text-sm text-slate-200">
            {c.decoderPoints.map((p) => (
              <li key={p} className="flex gap-2.5">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                {p}
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={contactHref}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-400 px-6 py-3 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-300"
            >
              {c.ctaContact} <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href={decoderHref}
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              {c.decoderCta}
            </Link>
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/40 p-4 font-mono text-[11px] leading-relaxed shadow-inner sm:text-xs">
          <div className="mb-3 flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-400/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
            <span className="ml-2 text-[10px] uppercase tracking-wider text-slate-500">api.kmcheck.com</span>
          </div>
          <div className="space-y-1.5">
            {lines.map((line, i) => (
              <p
                key={line}
                className={i === 0 ? "text-emerald-300" : i === 1 ? "text-teal-200/90" : "text-slate-300"}
              >
                {line}
              </p>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-[10px] sm:text-[11px]">
            {[
              [c.mockLabelMake, "Hyundai"],
              [c.mockLabelModel, "Tucson"],
              [c.mockLabelYear, "2022"],
              [c.mockLabelPlant, "Ulsan"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg bg-emerald-400/10 p-2.5">
                <p className="font-sans text-slate-400">{label}</p>
                <p className="mt-0.5 font-sans font-semibold tracking-normal text-white">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProfitStory({ c }: { c: B2bCopy }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="relative overflow-hidden rounded-[1.5rem] border border-emerald-900/10 bg-white p-6 dark:border-white/10 dark:bg-[#101816] sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-400">
          {c.profitTitle}
        </p>
        <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{c.profitSub}</p>
        <div className="mt-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-4xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
                $1.75B
              </p>
              <p className="mt-1 text-sm text-slate-500">{c.profitCarfaxNote}</p>
            </div>
            <p className="max-w-[10rem] text-right text-xs text-slate-500">{c.profitCarfax}</p>
          </div>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
            <div className="h-full w-[92%] rounded-full bg-gradient-to-r from-emerald-600 to-teal-400" />
          </div>
        </div>
        <p className="mt-6 text-xs leading-relaxed text-slate-500">{c.profitFootnote}</p>
      </div>

      <div className="rounded-[1.5rem] border border-emerald-500/20 bg-gradient-to-br from-emerald-700 via-emerald-800 to-teal-900 p-6 text-white sm:p-8">
        <p className="text-lg font-semibold">{c.profitYou}</p>
        <p className="mt-2 text-sm text-emerald-50/85">{c.profitYouNote}</p>
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {[c.profitPillar1, c.profitPillar2, c.profitPillar3].map((p) => (
            <div key={p} className="rounded-xl border border-white/15 bg-white/10 px-3 py-3 text-xs font-medium leading-snug">
              {p}
            </div>
          ))}
        </div>
        <div className="mt-8 border-t border-white/20 pt-6">
          <p className="text-sm font-semibold">{c.profitMathTitle}</p>
          <p className="mt-2 text-sm leading-relaxed text-emerald-50/90">{c.profitMathBody}</p>
        </div>
      </div>
    </div>
  );
}
