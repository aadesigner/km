import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { Link } from "wouter";
import type { B2bCopy } from "./copy";
import {
  Database, Globe2, Search, FileCheck2, Terminal, ArrowRight, Check,
} from "lucide-react";

export function FlowDemo({ c }: { c: B2bCopy }) {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);
  const [cars, setCars] = useState(49_400_000);

  useEffect(() => {
    if (reduce) return;
    const id = window.setInterval(() => setActive((i) => (i + 1) % 4), 3200);
    return () => window.clearInterval(id);
  }, [reduce]);

  useEffect(() => {
    if (reduce) {
      setCars(50_000_000);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const from = 49_400_000;
    const to = 50_000_000;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / 2000);
      const eased = 1 - (1 - p) ** 3;
      setCars(Math.round(from + (to - from) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduce]);

  const steps = [
    { title: c.flowStep1, detail: c.flowStep1Detail, icon: Globe2 },
    { title: c.flowStep2, detail: c.flowStep2Detail, icon: Search },
    { title: c.flowStep3, detail: c.flowStep3Detail, icon: Database },
    { title: c.flowStep4, detail: c.flowStep4Detail, icon: FileCheck2 },
  ];

  const stageLabels = [c.flowVisitor, c.flowYourSite, c.flowKmApi, c.flowReport];

  return (
    <div className="relative overflow-hidden rounded-[1.75rem] border border-slate-900/10 bg-[#0b1210] text-white dark:border-white/[0.08]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_100%_0%,rgba(16,185,129,0.12),transparent_55%)]" />

      <div className="relative grid gap-10 p-6 sm:p-8 lg:grid-cols-[1fr_1.05fr] lg:gap-14 lg:p-10">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-400/90">
            {c.flowBadge}
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">{c.flowTitle}</h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-400">{c.flowSub}</p>

          <ol className="mt-8 space-y-1">
            {steps.map((s, i) => {
              const Icon = s.icon;
              const on = active === i;
              return (
                <li key={s.title}>
                  <button
                    type="button"
                    onClick={() => setActive(i)}
                    className={`flex w-full items-start gap-3 rounded-xl px-2.5 py-2.5 text-left transition-colors ${
                      on ? "bg-white/[0.06]" : "hover:bg-white/[0.03]"
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-semibold transition-colors ${
                        on
                          ? "bg-emerald-500 text-emerald-950"
                          : "bg-white/[0.06] text-slate-400"
                      }`}
                    >
                      {on ? <Icon className="h-3.5 w-3.5" /> : String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={`block text-sm font-medium ${on ? "text-white" : "text-slate-400"}`}>
                        {s.title}
                      </span>
                      <AnimatePresence mode="wait" initial={false}>
                        {on && (
                          <motion.span
                            key={s.detail}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="mt-1 block text-xs leading-relaxed text-slate-500"
                          >
                            {s.detail}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>

        <div className="flex flex-col justify-center">
          <div className="mb-4 flex items-center gap-1 overflow-x-auto pb-1">
            {stageLabels.map((label, i) => {
              const on = active === i;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => setActive(i)}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors ${
                    on
                      ? "bg-white text-slate-900"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <div className="mb-4 h-px w-full overflow-hidden bg-white/10">
            <motion.div
              className="h-full bg-emerald-400/80"
              animate={{ width: `${((active + 1) / 4) * 100}%` }}
              transition={{ type: "spring", stiffness: 160, damping: 26 }}
            />
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#07110e]">
            <div className="flex items-center gap-1.5 border-b border-white/[0.07] px-3.5 py-2.5">
              <span className="h-2 w-2 rounded-full bg-white/20" />
              <span className="h-2 w-2 rounded-full bg-white/20" />
              <span className="h-2 w-2 rounded-full bg-white/20" />
              <div className="ml-2 flex-1 truncate font-mono text-[10px] text-slate-500">
                {c.flowMockBrowserUrl}
              </div>
            </div>
            <div className="relative min-h-[200px] p-5 sm:p-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={active}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: reduce ? 0.12 : 0.28 }}
                  className="space-y-3"
                >
                  {active === 0 && (
                    <>
                      <p className="text-sm font-medium text-white">{c.flowMockVisitTitle}</p>
                      <p className="max-w-sm text-xs leading-relaxed text-slate-400">{c.flowMockVisitBody}</p>
                      <div className="mt-3 h-8 w-36 rounded-lg bg-emerald-500/25" />
                    </>
                  )}
                  {active === 1 && (
                    <>
                      <p className="text-xs text-slate-500">{c.flowMockVinLabel}</p>
                      <div className="flex gap-2">
                        <div className="flex-1 rounded-xl border border-white/10 bg-black/30 px-3.5 py-2.5 font-mono text-sm tracking-widest text-emerald-200/90">
                          KM8J3CA46NU•••••
                        </div>
                        <div className="rounded-xl bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-900">
                          {c.flowMockGo}
                        </div>
                      </div>
                    </>
                  )}
                  {active === 2 && (
                    <>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.06]">
                          <Database className="h-5 w-5 text-emerald-300/90" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{c.flowKmApi}</p>
                          <p className="font-mono text-xs text-slate-400">
                            {cars.toLocaleString()} {c.flowDbLabel}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 pt-1">
                        {[0, 1, 2].map((n) => (
                          <div
                            key={n}
                            className="h-10 rounded-lg bg-white/[0.04] ring-1 ring-white/[0.06]"
                          />
                        ))}
                      </div>
                    </>
                  )}
                  {active === 3 && (
                    <>
                      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                        <div className="mb-2 flex items-center gap-2">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-emerald-950">
                            <Check className="h-3 w-3" />
                          </span>
                          <p className="text-sm font-medium text-white">{c.flowMockPaidTitle}</p>
                        </div>
                        <p className="text-xs leading-relaxed text-slate-400">{c.flowMockPaidBody}</p>
                      </div>
                      <div className="flex gap-2">
                        <div className="h-14 flex-1 rounded-lg bg-white/[0.04]" />
                        <div className="h-14 flex-1 rounded-lg bg-white/[0.04]" />
                        <div className="h-14 flex-1 rounded-lg bg-white/[0.04]" />
                      </div>
                    </>
                  )}
                </motion.div>
              </AnimatePresence>
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
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState(reduce ? 4 : 0);
  const lines = [
    `GET /v1/reports?vin=KM8J3CA46NU••••••`,
    `→ 200 OK · 86ms · ${c.flowKmApi}`,
    `{ "make": "Hyundai", "model": "Tucson", "year": 2022,`,
    `  "accidents": 0, "odometer": [ … ], "sources": 14 }`,
  ] as const;

  useEffect(() => {
    if (reduce) {
      setPhase(lines.length);
      return;
    }
    let cancelled = false;
    const ids: number[] = [];
    const clear = () => {
      while (ids.length) clearTimeout(ids.pop()!);
    };
    const run = () => {
      if (cancelled) return;
      clear();
      setPhase(0);
      lines.forEach((_, i) => {
        ids.push(
          window.setTimeout(() => {
            if (!cancelled) setPhase(i + 1);
          }, 380 + i * 480),
        );
      });
      ids.push(
        window.setTimeout(() => {
          if (!cancelled) run();
        }, 380 + lines.length * 480 + 2400),
      );
    };
    run();
    return () => {
      cancelled = true;
      clear();
    };
  }, [reduce, c.flowKmApi]);

  return (
    <div className="relative overflow-hidden rounded-[1.75rem] border border-emerald-500/25 bg-gradient-to-br from-[#0f1a16] to-[#132820] p-6 text-white sm:p-10">
      {!reduce && (
        <motion.div
          className="pointer-events-none absolute -right-10 top-0 h-48 w-48 rounded-full bg-emerald-400/20 blur-3xl"
          animate={{ x: [0, -16, 0], opacity: [0.35, 0.55, 0.35] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
      <div className="relative grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-300">
            <Terminal className="h-3.5 w-3.5" />
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
              className="inline-flex items-center gap-2 rounded-full bg-emerald-400 px-6 py-3 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-300 hover:gap-2.5"
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
        <div className="rounded-2xl border border-white/10 bg-black/40 p-4 font-mono text-[11px] leading-relaxed shadow-inner backdrop-blur sm:text-xs">
          <div className="mb-3 flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-400/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
            <span className="ml-2 text-[10px] uppercase tracking-wider text-slate-500">api.kmcheck.com</span>
          </div>
          <div className="min-h-[7.5rem] space-y-1.5">
            {lines.map((line, i) => (
              <motion.p
                key={line}
                initial={false}
                animate={{
                  opacity: phase > i ? 1 : 0.15,
                  x: phase > i ? 0 : 6,
                }}
                transition={{ duration: 0.25 }}
                className={i === 0 ? "text-emerald-300" : i === 1 ? "text-teal-200/90" : "text-slate-300"}
              >
                {line}
                {phase === i + 1 && !reduce && (
                  <motion.span
                    className="ml-0.5 inline-block h-3 w-1.5 translate-y-0.5 bg-emerald-300"
                    animate={{ opacity: [1, 0] }}
                    transition={{ duration: 0.7, repeat: Infinity }}
                  />
                )}
              </motion.p>
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
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(reduce ? 1.75 : 0);

  useEffect(() => {
    if (reduce) return;
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / 1800);
      setShown(1.75 * (0.5 - 0.5 * Math.cos(Math.PI * p)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduce]);

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
                ${shown.toFixed(2)}B
              </p>
              <p className="mt-1 text-sm text-slate-500">{c.profitCarfaxNote}</p>
            </div>
            <p className="max-w-[10rem] text-right text-xs text-slate-500">{c.profitCarfax}</p>
          </div>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-teal-400"
              initial={{ width: 0 }}
              whileInView={{ width: "92%" }}
              viewport={{ once: true }}
              transition={{ duration: 1.4, ease: "easeOut" }}
            />
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
