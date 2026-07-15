import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { Link } from "wouter";
import type { B2bCopy } from "./copy";
import {
  Database, Globe2, Search, FileCheck2, Zap, Terminal, ArrowRight, Check,
} from "lucide-react";

export function FlowDemo({ c }: { c: B2bCopy }) {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);
  const [cars, setCars] = useState(48_200_000);

  useEffect(() => {
    if (reduce) return;
    const id = window.setInterval(() => setActive((i) => (i + 1) % 4), 2800);
    return () => window.clearInterval(id);
  }, [reduce]);

  useEffect(() => {
    if (reduce) {
      setCars(50_000_000);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const from = 48_200_000;
    const to = 50_000_000;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / 2400);
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
    <div className="relative overflow-hidden rounded-[2rem] border border-emerald-400/20 bg-[#050d0a] text-white shadow-[0_40px_100px_-48px_rgba(16,185,129,0.65)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.28),transparent_52%),radial-gradient(ellipse_at_bottom_left,rgba(45,212,191,0.14),transparent_48%)]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.14]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(16,185,129,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.4) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          maskImage: "radial-gradient(ellipse at 70% 40%, black 20%, transparent 72%)",
        }}
      />
      {!reduce && (
        <motion.div
          className="pointer-events-none absolute -left-16 top-1/3 h-56 w-56 rounded-full bg-emerald-500/15 blur-3xl"
          animate={{ opacity: [0.25, 0.45, 0.25], x: [0, 20, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      <div className="relative grid gap-10 p-6 sm:p-8 lg:grid-cols-[0.92fr_1.08fr] lg:gap-12 lg:p-11">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-300 shadow-[0_0_24px_rgba(52,211,153,0.15)]">
            <Zap className="h-3.5 w-3.5" />
            {c.flowBadge}
          </div>
          <h2 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">{c.flowTitle}</h2>
          <p className="mt-3 max-w-md text-[15px] leading-relaxed text-slate-300/90">{c.flowSub}</p>

          {/* Mobile progress pills */}
          <div className="mt-6 flex gap-1.5 md:hidden">
            {steps.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Step ${i + 1}`}
                onClick={() => setActive(i)}
                className={`h-1.5 flex-1 rounded-full transition ${
                  active === i ? "bg-emerald-400" : "bg-white/15"
                }`}
              />
            ))}
          </div>

          <ol className="relative mt-8 space-y-2.5">
            <div className="pointer-events-none absolute bottom-4 left-[1.35rem] top-4 w-px bg-gradient-to-b from-emerald-400/50 via-emerald-400/20 to-transparent md:left-[1.55rem]" />
            {steps.map((s, i) => {
              const Icon = s.icon;
              const on = active === i;
              const done = active > i;
              return (
                <li key={s.title} className="relative">
                  <button
                    type="button"
                    onClick={() => setActive(i)}
                    className={`group flex w-full items-start gap-3.5 rounded-2xl border px-3.5 py-3.5 text-left transition duration-200 ${
                      on
                        ? "border-emerald-400/45 bg-emerald-400/[0.12] shadow-[0_0_0_1px_rgba(52,211,153,0.12),0_12px_40px_-20px_rgba(16,185,129,0.55)]"
                        : "border-transparent bg-white/[0.03] hover:border-white/10 hover:bg-white/[0.055]"
                    }`}
                  >
                    <span
                      className={`relative z-[1] mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition ${
                        on
                          ? "bg-emerald-400 text-emerald-950 shadow-lg shadow-emerald-400/30"
                          : done
                            ? "bg-emerald-400/20 text-emerald-300"
                            : "bg-white/10 text-slate-300"
                      }`}
                    >
                      {done && !on ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                    </span>
                    <span className="min-w-0 flex-1 pt-0.5">
                      <span className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold tracking-wider uppercase ${on ? "text-emerald-300" : "text-slate-500"}`}>
                          0{i + 1}
                        </span>
                        <span className={`block text-[15px] font-semibold ${on ? "text-white" : "text-slate-300"}`}>
                          {s.title}
                        </span>
                      </span>
                      <AnimatePresence mode="wait" initial={false}>
                        {on && (
                          <motion.span
                            key={s.detail}
                            initial={{ opacity: 0, height: 0, y: -4 }}
                            animate={{ opacity: 1, height: "auto", y: 0 }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.25 }}
                            className="mt-1.5 block text-xs leading-relaxed text-emerald-100/80"
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

        <div className="relative flex min-h-[360px] flex-col justify-center">
          <div className="absolute inset-0 rounded-[1.75rem] border border-white/[0.07] bg-gradient-to-b from-white/[0.06] to-black/30 shadow-inner" />

          <div className="relative grid gap-5 px-3 py-5 sm:px-5">
            <div className="hidden grid-cols-4 gap-2.5 md:grid">
              {stageLabels.map((label, i) => {
                const on = active === i;
                return (
                  <motion.button
                    key={label}
                    type="button"
                    onClick={() => setActive(i)}
                    animate={{
                      y: on ? -6 : 0,
                      borderColor: on ? "rgba(52,211,153,0.55)" : "rgba(255,255,255,0.08)",
                      backgroundColor: on ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.035)",
                    }}
                    transition={{ type: "spring", stiffness: 320, damping: 24 }}
                    className="relative rounded-2xl border px-2 py-4 text-center backdrop-blur-sm"
                  >
                    <div className="mx-auto mb-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-[11px] font-bold text-emerald-200">
                      {i + 1}
                    </div>
                    <div className="text-[11px] font-semibold leading-snug text-slate-100">{label}</div>
                    {i === 2 && (
                      <div className="mt-2 font-mono text-[10px] text-emerald-300">
                        {cars.toLocaleString()}+
                      </div>
                    )}
                    {on && !reduce && (
                      <motion.span
                        className="pointer-events-none absolute inset-0 rounded-2xl border border-emerald-300/50"
                        initial={{ opacity: 0.85, scale: 1 }}
                        animate={{ opacity: 0, scale: 1.1 }}
                        transition={{ duration: 1.35, repeat: Infinity }}
                      />
                    )}
                  </motion.button>
                );
              })}
            </div>

            <div className="relative mx-1 hidden h-2.5 md:block">
              <div className="absolute inset-y-[4px] left-0 right-0 rounded-full bg-white/10" />
              <motion.div
                className="absolute inset-y-[4px] left-0 rounded-full bg-gradient-to-r from-emerald-500 via-teal-300 to-emerald-400"
                animate={{ width: `${((active + 1) / 4) * 100}%` }}
                transition={{ type: "spring", stiffness: 140, damping: 22 }}
              />
              {!reduce && (
                <motion.div
                  className="absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full bg-white shadow-[0_0_22px_#6ee7b7]"
                  animate={{ left: `calc(${((active + 0.5) / 4) * 100}% - 7px)` }}
                  transition={{ type: "spring", stiffness: 110, damping: 18 }}
                />
              )}
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#071410] shadow-2xl">
              <div className="flex items-center gap-1.5 border-b border-white/10 bg-white/[0.04] px-3.5 py-2.5">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-400/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
                <div className="ml-3 flex-1 truncate rounded-lg bg-black/35 px-2.5 py-1.5 font-mono text-[10px] text-slate-400">
                  {c.flowMockBrowserUrl}
                </div>
                <span className="hidden rounded-md bg-emerald-400/15 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-emerald-300 sm:inline">
                  live
                </span>
              </div>
              <div className="relative min-h-[188px] p-5">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={active}
                    initial={{ opacity: 0, y: 12, filter: reduce ? "none" : "blur(4px)" }}
                    animate={{ opacity: 1, y: 0, filter: "none" }}
                    exit={{ opacity: 0, y: -8, filter: reduce ? "none" : "blur(4px)" }}
                    transition={{ duration: reduce ? 0.15 : 0.35 }}
                    className="space-y-3"
                  >
                    {active === 0 && (
                      <>
                        <p className="text-sm font-medium text-white">{c.flowMockVisitTitle}</p>
                        <p className="text-xs leading-relaxed text-slate-400">{c.flowMockVisitBody}</p>
                        <div className="mt-2 h-9 w-44 rounded-xl bg-gradient-to-r from-emerald-500/40 to-teal-400/25" />
                      </>
                    )}
                    {active === 1 && (
                      <>
                        <p className="text-xs text-slate-400">{c.flowMockVinLabel}</p>
                        <div className="flex gap-2">
                          <div className="flex-1 rounded-xl border border-emerald-400/35 bg-black/40 px-3.5 py-2.5 font-mono text-sm tracking-widest text-emerald-200">
                            KM8J3CA46NU•••••
                          </div>
                          <div className="rounded-xl bg-emerald-400 px-3.5 py-2.5 text-xs font-bold text-emerald-950">
                            {c.flowMockGo}
                          </div>
                        </div>
                      </>
                    )}
                    {active === 2 && (
                      <>
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/15">
                            <Database className="h-6 w-6 text-emerald-300" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white">{c.flowKmApi}</p>
                            <p className="font-mono text-xs text-emerald-300">
                              {cars.toLocaleString()} {c.flowDbLabel}
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 pt-1">
                          {[0, 1, 2].map((n) => (
                            <motion.div
                              key={n}
                              className="h-11 rounded-xl bg-emerald-400/10 ring-1 ring-emerald-400/10"
                              animate={reduce ? undefined : { opacity: [0.35, 1, 0.35] }}
                              transition={{ duration: 1.2, delay: n * 0.2, repeat: Infinity }}
                            />
                          ))}
                        </div>
                      </>
                    )}
                    {active === 3 && (
                      <>
                        <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-4">
                          <div className="mb-2 flex items-center gap-2">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400 text-emerald-950">
                              <Check className="h-3 w-3" />
                            </span>
                            <p className="text-sm font-semibold text-emerald-200">{c.flowMockPaidTitle}</p>
                          </div>
                          <p className="text-xs leading-relaxed text-slate-300">{c.flowMockPaidBody}</p>
                        </div>
                        <div className="flex gap-2">
                          <div className="h-[4.25rem] flex-1 rounded-xl bg-white/[0.06] ring-1 ring-white/5" />
                          <div className="h-[4.25rem] flex-1 rounded-xl bg-white/[0.06] ring-1 ring-white/5" />
                          <div className="h-[4.25rem] flex-1 rounded-xl bg-white/[0.06] ring-1 ring-white/5" />
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
