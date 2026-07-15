import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import type { B2bCopy } from "./copy";
import { Check, ImagePlus, Loader2, ShieldCheck, Upload } from "lucide-react";

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
        <pre className="overflow-x-auto border-b border-white/10 p-4 font-mono text-[11px] leading-relaxed text-slate-300 sm:text-xs lg:border-b-0 lg:border-r">
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

        <div className="relative min-h-[220px] p-4">
          <div className="mb-3 flex items-center justify-between text-[10px] uppercase tracking-wider text-slate-500">
            <span>Response</span>
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
              className="mt-4 grid grid-cols-2 gap-2"
            >
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
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Managed plan: white-label site with “Your brand” logo placeholder. */
export function ManagedSitePlanDemo({ c }: { c: B2bCopy }) {
  const reduce = useReducedMotion();
  const phase = useCyclePhase(reduce, 4, 2400);
  // 0 brand empty → 1 logo uploaded → 2 VIN search → 3 report on YOUR site

  return (
    <div className="relative overflow-hidden rounded-2xl border border-emerald-900/15 bg-gradient-to-b from-white to-slate-50 shadow-xl shadow-emerald-900/10 dark:border-white/10 dark:from-[#101816] dark:to-[#0c1411]">
      {/* Browser chrome */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 bg-slate-100/80 px-3 py-2 dark:border-white/10 dark:bg-white/[0.04]">
        <span className="h-2.5 w-2.5 rounded-full bg-rose-400/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
        <div className="ml-2 flex-1 truncate rounded-md bg-white px-2.5 py-1 font-mono text-[10px] text-slate-500 shadow-sm dark:bg-black/30 dark:text-slate-400">
          your-brand.com/vin-check
        </div>
      </div>

      <div className="p-4 sm:p-5">
        {/* Site header with Your brand */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AnimatePresence mode="wait">
              {phase === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.92 }}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-slate-400 dark:border-white/20 dark:bg-white/5"
                >
                  <ImagePlus className="h-4 w-4" />
                </motion.div>
              ) : (
                <motion.div
                  key="logo"
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-slate-800 to-slate-950 text-[10px] font-bold tracking-wide text-white shadow-md"
                >
                  <span>YB</span>
                  {!reduce && (
                    <motion.span
                      className="absolute inset-0 bg-white/20"
                      initial={{ x: "-100%" }}
                      animate={{ x: "120%" }}
                      transition={{ duration: 0.7, delay: 0.1 }}
                    />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                {phase === 0 ? "Your brand" : "Your Brand Motors"}
              </p>
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                {phase === 0 ? "logo placeholder" : "white-label site"}
              </p>
            </div>
          </div>
          {phase === 0 ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-dashed border-slate-300 px-2.5 py-1 text-[10px] font-semibold text-slate-500 dark:border-white/20">
              <Upload className="h-3 w-3" /> Drop logo
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
              <ShieldCheck className="h-3 w-3" /> Live
            </span>
          )}
        </div>

        <div className="mt-5 min-h-[148px]">
          <AnimatePresence mode="wait">
            {phase <= 1 && (
              <motion.div
                key="upload"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="rounded-xl border border-dashed border-slate-300 bg-slate-50/80 p-4 text-center dark:border-white/15 dark:bg-white/[0.03]"
              >
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  {phase === 0 ? "Add your company logo & domain" : "Branding applied — site is yours"}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {phase === 0
                    ? "Upload mark · set colors · keep reports on your domain"
                    : "Logo live on your-brand.com — checkout stays yours"}
                </p>
                <div className="mx-auto mt-3 h-1.5 w-40 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                  <motion.div
                    className="h-full rounded-full bg-emerald-500"
                    animate={{ width: phase === 0 ? "35%" : "100%" }}
                    transition={{ duration: 0.6 }}
                  />
                </div>
              </motion.div>
            )}

            {phase === 2 && (
              <motion.div
                key="search"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="rounded-xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-black/20"
              >
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  {c.flowMockVinLabel}
                </p>
                <div className="mt-2 flex gap-2">
                  <div className="flex-1 rounded-lg border border-emerald-500/30 bg-slate-50 px-3 py-2.5 font-mono text-sm tracking-wider text-slate-800 dark:bg-black/30 dark:text-emerald-100">
                    KM8J3CA46NU•••••
                  </div>
                  <div className="rounded-lg bg-slate-900 px-3 py-2.5 text-xs font-bold text-white dark:bg-emerald-500 dark:text-emerald-950">
                    {c.flowMockGo}
                  </div>
                </div>
                {!reduce && (
                  <motion.div
                    className="mt-3 h-1 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10"
                  >
                    <motion.div
                      className="h-full bg-emerald-500"
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 1.6, ease: "easeInOut" }}
                    />
                  </motion.div>
                )}
              </motion.div>
            )}

            {phase >= 3 && (
              <motion.div
                key="report"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-emerald-500/25 bg-white p-4 shadow-sm dark:border-emerald-400/20 dark:bg-black/25"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      Hyundai Tucson · 2022
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">{c.flowMockPaidTitle}</p>
                  </div>
                  <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                    Your Brand
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {["0 accidents", "48k mi", "Clean title"].map((t, i) => (
                    <motion.div
                      key={t}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.08 * i }}
                      className="rounded-lg bg-emerald-50 px-2 py-2 text-center text-[10px] font-semibold text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-200"
                    >
                      {t}
                    </motion.div>
                  ))}
                </div>
                <p className="mt-3 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                  {c.flowMockPaidBody}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
