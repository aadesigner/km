import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import type { B2bCopy } from "./copy";
import { Check, Car, FileBarChart2, Gauge, Loader2, Lock, AlertTriangle, Users2, ShieldCheck } from "lucide-react";

type CarPayload = {
  make: string;
  model: string;
  year: number;
  plant: string;
  accidents: number;
  odometer: number;
  title: string;
};

const SAMPLE_CARS: CarPayload[] = [
  { make: "Hyundai", model: "Tucson", year: 2022, plant: "Ulsan", accidents: 0, odometer: 48210, title: "Clean" },
  { make: "Toyota", model: "RAV4", year: 2021, plant: "Ontario", accidents: 1, odometer: 61420, title: "Rebuild" },
  { make: "BMW", model: "X3", year: 2020, plant: "Spartanburg", accidents: 0, odometer: 39105, title: "Clean" },
  { make: "Kia", model: "Sportage", year: 2023, plant: "Žilina", accidents: 0, odometer: 18440, title: "Clean" },
];

function useCyclePhase(reduce: boolean | null, steps: number, dwellMs: number) {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    if (reduce) {
      setPhase(steps - 1);
      return;
    }
    const id = window.setInterval(() => setPhase((p) => (p + 1) % steps), dwellMs);
    return () => window.clearInterval(id);
  }, [reduce, steps, dwellMs]);
  return phase;
}

/** Developer plan: code + live-feeling API request → car payload. */
export function ApiDevPlanDemo({ c }: { c: B2bCopy }) {
  const reduce = useReducedMotion();
  const [carIndex, setCarIndex] = useState(0);
  const [phase, setPhase] = useState(0);
  // 0 idle → 1 requesting → 2 streaming JSON → 3 done
  const car = SAMPLE_CARS[carIndex]!;

  useEffect(() => {
    if (reduce) {
      setPhase(3);
      return;
    }
    let cancelled = false;
    const timers: number[] = [];
    const run = () => {
      if (cancelled) return;
      setPhase(0);
      timers.push(window.setTimeout(() => !cancelled && setPhase(1), 500));
      timers.push(window.setTimeout(() => !cancelled && setPhase(2), 1400));
      timers.push(window.setTimeout(() => !cancelled && setPhase(3), 2600));
      timers.push(
        window.setTimeout(() => {
          if (cancelled) return;
          setCarIndex((i) => (i + 1) % SAMPLE_CARS.length);
          run();
        }, 4800),
      );
    };
    run();
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [reduce]);

  const jsonPreview = useMemo(
    () =>
      `{
  "vin": "KM8J3CA46NU••••••",
  "make": "${car.make}",
  "model": "${car.model}",
  "year": ${car.year},
  "plant": "${car.plant}",
  "accidents": ${car.accidents},
  "odometer": ${car.odometer},
  "title": "${car.title}"
}`,
    [car],
  );

  const [typed, setTyped] = useState(0);
  useEffect(() => {
    if (reduce) {
      setTyped(jsonPreview.length);
      return;
    }
    if (phase < 2) {
      setTyped(0);
      return;
    }
    if (phase >= 3) {
      setTyped(jsonPreview.length);
      return;
    }
    setTyped(0);
    let i = 0;
    const id = window.setInterval(() => {
      i += 4;
      setTyped(Math.min(jsonPreview.length, i));
      if (i >= jsonPreview.length) clearInterval(id);
    }, 18);
    return () => clearInterval(id);
  }, [phase, jsonPreview, reduce]);

  const visibleJson = jsonPreview.slice(0, typed);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-800/80 bg-[#0b1220] text-slate-100 shadow-xl shadow-slate-900/20">
      <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.03] px-3 py-2">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-400/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
          <span className="ml-2 font-mono text-[10px] text-slate-400">integration.ts</span>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
          {phase === 1 ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" /> fetching
            </>
          ) : phase >= 3 ? (
            <>
              <Check className="h-3 w-3" /> 200 OK
            </>
          ) : (
            "ready"
          )}
        </span>
      </div>

      <div className="grid gap-0 lg:grid-cols-2">
        <div className="border-b border-white/10 p-4 lg:border-b-0 lg:border-r">
          <div className="rounded-xl border border-white/10 bg-[#0f1728] p-3">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">{c.planDevTitle}</p>
                <p className="mt-1 text-sm font-semibold text-white">POST /v1/reports</p>
              </div>
              <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
                POST /v1/reports
              </span>
            </div>
            <pre className="overflow-x-auto font-mono text-[11px] leading-relaxed text-slate-300 sm:text-xs">
              <code>
                <span className="text-violet-300">const</span>{" "}
                <span className="text-sky-300">res</span> ={" "}
                <span className="text-violet-300">await</span> fetch(
                {"\n"}
                {"  "}
                <span className="text-emerald-300">
                  &quot;https://api.kmcheck.com/v1/reports&quot;
                </span>
                ,
                {"\n"}
                {"  "}
                {"{"}
                {"\n"}
                {"    "}headers: {"{"} Authorization:{" "}
                <span className="text-amber-200">&quot;Bearer ••••••&quot;</span> {"}"},
                {"\n"}
                {"    "}
                <span className="text-sky-300">query</span>: {"{"} vin:{" "}
                <span className="text-emerald-300">&quot;KM8J3CA46NU…&quot;</span> {"}"},
                {"\n"}
                {"  "}
                {"}"}
                {"\n"}
                );
                {"\n\n"}
                <span className="text-violet-300">const</span>{" "}
                <span className="text-sky-300">report</span> ={" "}
                <span className="text-violet-300">await</span> res.json();
              </code>
            </pre>
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {[
              [c.navRegions, c.heroStatRegions],
              [c.plansDevBadge, "JSON / REST"],
              [c.plansCompareRowCheckout, c.plansCompareDevCheckout],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
                <p className="text-[10px] uppercase tracking-wider text-slate-500">{label}</p>
                <p className="mt-1 text-sm font-semibold text-white">{value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative min-h-[320px] p-4">
          <div className="mb-3 flex items-center justify-between text-[10px] uppercase tracking-wider text-slate-500">
            <span>{c.flowMockPaidTitle}</span>
            <motion.span
              key={phase}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="font-mono text-emerald-400/90"
            >
              {phase === 0 && "GET /v1/reports"}
              {phase === 1 && "→ waiting…"}
              {phase === 2 && "→ streaming JSON"}
              {phase >= 3 && "→ 86ms · complete"}
            </motion.span>
          </div>

          <AnimatePresence mode="wait">
            {phase < 2 ? (
              <motion.div
                key="pulse"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-2"
              >
                {[0, 1, 2, 3].map((n) => (
                  <motion.div
                    key={n}
                    className="h-3 rounded bg-white/5"
                    animate={reduce ? undefined : { opacity: [0.25, 0.7, 0.25] }}
                    transition={{ duration: 1.1, delay: n * 0.12, repeat: Infinity }}
                    style={{ width: `${70 - n * 12}%` }}
                  />
                ))}
              </motion.div>
            ) : (
              <motion.pre
                key={car.make + car.model + phase}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="font-mono text-[11px] leading-relaxed text-emerald-100/90 sm:text-xs"
              >
                {visibleJson}
                {phase === 2 && typed < jsonPreview.length && !reduce && (
                  <motion.span
                    className="ml-0.5 inline-block h-3 w-1.5 translate-y-0.5 bg-emerald-300"
                    animate={{ opacity: [1, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity }}
                  />
                )}
              </motion.pre>
            )}
          </AnimatePresence>

          {phase >= 3 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 space-y-3"
            >
              <div className="grid grid-cols-2 gap-2">
                {[
                  [c.mockLabelMake, car.make],
                  [c.mockLabelModel, car.model],
                  [c.mockLabelYear, String(car.year)],
                  [c.mockLabelPlant, car.plant],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-2">
                    <p className="font-sans text-[10px] text-slate-400">{label}</p>
                    <p className="font-sans text-sm font-semibold text-white">{value}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <FileBarChart2 className="h-4 w-4 text-emerald-300" />
                    <p className="text-sm font-semibold text-white">{c.flowMockPaidTitle}</p>
                  </div>
                  <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
                    webhook-ready
                  </span>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  {[
                    c.flowYourSite,
                    c.flowStep4,
                    c.plansCompareRowCheckout,
                  ].map((item) => (
                    <div key={item} className="rounded-lg bg-[#0b1220] px-2.5 py-2 text-center text-[11px] font-medium text-slate-300 ring-1 ring-white/6">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

const DEMO_VIN = "KM8J3CA46NU123456";

function managedReportMetrics(c: B2bCopy) {
  return [
    { icon: Gauge, label: c.managedDemoLblMileage, value: c.managedDemoValMileage, bar: 62, tone: "neutral" as const },
    { icon: AlertTriangle, label: c.managedDemoLblAccidents, value: c.managedDemoValAccidents, bar: 0, tone: "good" as const },
    { icon: Users2, label: c.managedDemoLblOwners, value: c.managedDemoValOwners, bar: 40, tone: "neutral" as const },
    { icon: ShieldCheck, label: c.managedDemoLblTheft, value: c.managedDemoValTheft, bar: 0, tone: "good" as const },
  ];
}

/** Managed plan: lightweight client-website VIN → kmcheck → report flow. */
export function ManagedSitePlanDemo({ c }: { c: B2bCopy }) {
  const reduce = useReducedMotion();
  const phase = useCyclePhase(reduce, 4, 3200);
  const [typedVin, setTypedVin] = useState("");
  const [btnPressed, setBtnPressed] = useState(false);

  useEffect(() => {
    if (reduce) {
      setTypedVin(DEMO_VIN);
      return;
    }
    if (phase === 0) {
      setTypedVin("");
      setBtnPressed(false);
      return;
    }
    if (phase === 1) {
      setTypedVin("");
      setBtnPressed(false);
      let i = 0;
      const id = window.setInterval(() => {
        i += 2;
        setTypedVin(DEMO_VIN.slice(0, i));
        if (i >= DEMO_VIN.length) clearInterval(id);
      }, 42);
      const clickTimer = window.setTimeout(() => setBtnPressed(true), 1100);
      return () => {
        clearInterval(id);
        clearTimeout(clickTimer);
      };
    }
    setTypedVin(DEMO_VIN);
    setBtnPressed(phase === 2);
    return;
  }, [phase, reduce]);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-lg shadow-slate-900/5 dark:border-white/10 dark:bg-[#0f1714] dark:shadow-black/30">
      {/* Browser chrome */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 bg-gradient-to-b from-slate-100 to-slate-50 px-3 py-2.5 dark:border-white/10 dark:from-white/[0.06] dark:to-white/[0.02]">
        <span className="h-2.5 w-2.5 rounded-full bg-rose-400/90" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400/90" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/90" />
        <div className="ml-2 flex flex-1 items-center gap-2 truncate rounded-lg border border-slate-200/80 bg-white px-2.5 py-1.5 shadow-sm dark:border-white/10 dark:bg-black/30">
          <Lock className="h-3 w-3 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span className="truncate font-mono text-[10px] text-slate-500 dark:text-slate-400">{c.managedDemoDomain}</span>
        </div>
      </div>

      {/* Site navbar */}
      <div className="flex items-center justify-between border-b border-slate-200/70 bg-white px-4 py-3 dark:border-white/10 dark:bg-[#0f1714] sm:px-5">
        <div className="flex items-center gap-2.5">
          <motion.div
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-slate-800 to-slate-950 text-[9px] font-bold tracking-[0.14em] text-white shadow-sm dark:from-emerald-500 dark:to-emerald-600 dark:text-emerald-950"
            animate={reduce ? undefined : { scale: [1, 1.02, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            YB
          </motion.div>
          <span className="text-sm font-semibold text-slate-900 dark:text-white">{c.managedDemoBrand}</span>
        </div>
        <div className="hidden items-center gap-5 text-xs text-slate-500 sm:flex dark:text-slate-400">
          <span className="font-medium text-slate-900 dark:text-white">{c.managedDemoNavHome}</span>
          <span>{c.managedDemoNavHistory}</span>
          <span>{c.navContact}</span>
        </div>
      </div>

      {/* Page content */}
      <div className="relative overflow-hidden bg-gradient-to-b from-slate-50/80 to-white px-4 py-6 dark:from-[#0c1411] dark:to-[#0f1714] sm:px-6 sm:py-8">
        <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-emerald-400/10 blur-2xl" />

        <h4 className="relative text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl dark:text-white">
          {c.managedDemoHero}
        </h4>
        <p className="relative mt-2 text-sm text-slate-500 dark:text-slate-400">{c.flowMockVinLabel}</p>

        <div className="relative mt-5 flex flex-col gap-2 sm:flex-row">
          <motion.div
            animate={
              reduce
                ? undefined
                : phase === 1
                  ? { borderColor: ["rgba(16,185,129,0.2)", "rgba(16,185,129,0.55)", "rgba(16,185,129,0.2)"] }
                  : phase >= 2
                    ? { borderColor: "rgba(16,185,129,0.35)" }
                    : undefined
            }
            transition={{ duration: 1.4, repeat: phase === 1 ? Infinity : 0 }}
            className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 font-mono text-sm tracking-wider text-slate-800 shadow-sm dark:border-white/10 dark:bg-black/25 dark:text-emerald-100"
          >
            {typedVin || <span className="text-slate-300 dark:text-slate-600">•••••••••••••••••</span>}
            {phase === 1 && !reduce && (
              <motion.span
                className="ml-0.5 inline-block h-4 w-0.5 bg-emerald-500"
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.55, repeat: Infinity }}
              />
            )}
          </motion.div>
          <motion.div
            animate={
              reduce
                ? undefined
                : btnPressed
                  ? { scale: [1, 0.96, 1] }
                  : phase >= 1
                    ? { boxShadow: ["0 0 0 rgba(16,185,129,0)", "0 4px 14px rgba(16,185,129,0.35)", "0 0 0 rgba(16,185,129,0)"] }
                    : undefined
            }
            transition={{ duration: btnPressed ? 0.22 : 1.6, repeat: btnPressed ? 0 : Infinity }}
            className={`inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold transition-colors ${
              phase >= 1
                ? "bg-emerald-600 text-white"
                : "bg-slate-200 text-slate-500 dark:bg-white/10 dark:text-slate-400"
            }`}
          >
            {c.flowMockGo}
          </motion.div>
        </div>

        {/* Phase dots — visual only */}
        <div className="relative mt-4 flex items-center gap-1.5">
          {[0, 1, 2].map((dot) => {
            const active = (phase <= 1 && dot === 0) || (phase === 2 && dot === 1) || (phase >= 3 && dot === 2);
            const done = (phase >= 2 && dot === 0) || (phase >= 3 && dot <= 1);
            return (
              <motion.span
                key={dot}
                animate={{ width: active ? 20 : 6, opacity: done || active ? 1 : 0.35 }}
                className={`h-1.5 rounded-full ${done || active ? "bg-emerald-500" : "bg-slate-300 dark:bg-white/20"}`}
                transition={{ duration: 0.35 }}
              />
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          {phase === 2 && (
            <motion.div
              key="connect"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.3 }}
              className="relative mt-4"
            >
              <div className="flex items-center gap-3 rounded-xl border border-emerald-200/80 bg-emerald-50/90 px-4 py-3.5 dark:border-emerald-500/20 dark:bg-emerald-500/10">
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <span className="truncate rounded-lg bg-white px-2.5 py-1.5 text-[10px] font-semibold text-slate-700 shadow-sm dark:bg-black/30 dark:text-slate-200">
                    {c.managedDemoDomain}
                  </span>
                  <div className="relative flex h-px flex-1 items-center">
                    <div className="h-px w-full bg-emerald-300/70" />
                    {!reduce && (
                      <motion.span
                        className="absolute h-2 w-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/40"
                        animate={{ left: ["0%", "100%"], opacity: [0, 1, 0] }}
                        transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
                      />
                    )}
                  </div>
                  <span className="shrink-0 rounded-lg bg-slate-900 px-2.5 py-1.5 text-[10px] font-semibold text-white dark:bg-emerald-600 dark:text-emerald-950">
                    kmcheck
                  </span>
                </div>
                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-emerald-600 dark:text-emerald-400" />
              </div>
            </motion.div>
          )}

          {phase >= 3 && (
            <motion.div
              key="report"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="relative mt-4 overflow-hidden rounded-xl border border-emerald-200/80 bg-white shadow-md shadow-emerald-900/5 dark:border-emerald-500/20 dark:bg-[#101816] dark:shadow-black/20"
            >
              {!reduce && (
                <motion.div
                  className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-emerald-400/8 to-transparent"
                  initial={{ x: "-100%" }}
                  animate={{ x: "100%" }}
                  transition={{ duration: 0.9, ease: "easeOut" }}
                />
              )}

              <div className="flex items-start gap-3 p-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                  <Car className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{c.managedDemoSampleCar}</p>
                      <p className="mt-0.5 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                        {DEMO_VIN.slice(0, 11)}•••••
                      </p>
                    </div>
                    <motion.span
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.15, type: "spring", stiffness: 420, damping: 22 }}
                      className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold uppercase text-white"
                    >
                      <Check className="h-3 w-3" />
                    </motion.span>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 p-4 dark:border-white/10">
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                  {managedReportMetrics(c).map(({ icon: Icon, label, value, bar, tone }, i) => (
                    <motion.div
                      key={label}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: reduce ? 0 : 0.1 + i * 0.07, duration: 0.3 }}
                      className="overflow-hidden rounded-xl border border-slate-200/80 bg-slate-50/80 dark:border-white/10 dark:bg-white/[0.03]"
                    >
                      <div className="flex items-center gap-2 px-3 pt-3">
                        <div
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                            tone === "good"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                              : "bg-slate-200/80 text-slate-600 dark:bg-white/10 dark:text-slate-300"
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          {label}
                        </p>
                      </div>
                      <p className="px-3 pb-1 pt-2 text-lg font-semibold tabular-nums tracking-tight text-slate-900 dark:text-white">
                        {value}
                      </p>
                      <div className="px-3 pb-3">
                        <div className="h-1.5 overflow-hidden rounded-full bg-slate-200/80 dark:bg-white/10">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${bar}%` }}
                            transition={{ delay: reduce ? 0 : 0.2 + i * 0.08, duration: 0.5, ease: "easeOut" }}
                            className={`h-full rounded-full ${
                              tone === "good" ? "bg-emerald-500" : "bg-slate-400 dark:bg-slate-500"
                            }`}
                          />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
