import type { B2bCopy } from "./copy";
import {
  AlertTriangle,
  CheckCircle2,
  Gauge,
  ShieldCheck,
} from "lucide-react";

type DemoCar = {
  make: string;
  model: string;
  year: number;
  vin: string;
  odometer: number;
  accidents: number;
  title: string;
  score: string;
  scoreLabel: string;
};

const DEMO_CAR: DemoCar = {
  make: "Hyundai",
  model: "Tucson",
  year: 2022,
  vin: "KM8J3CA46NU••••••",
  odometer: 48210,
  accidents: 0,
  title: "Clean",
  score: "9.2",
  scoreLabel: "Clean",
};

function formatKm(n: number) {
  return `${n.toLocaleString()} km`;
}

function mileageTone(km: number) {
  if (km < 60000) return { bar: "bg-emerald-500", text: "text-emerald-700 dark:text-emerald-400" };
  if (km < 120000) return { bar: "bg-amber-500", text: "text-amber-700 dark:text-amber-400" };
  return { bar: "bg-red-500", text: "text-red-700 dark:text-red-400" };
}

function scoreTone(label: string) {
  if (label === "Caution") {
    return {
      accent: "from-amber-500 to-orange-400",
      box: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300",
    };
  }
  return {
    accent: "from-emerald-500 to-teal-400",
    box: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300",
  };
}

/** Hero split: consumer-style report preview ↔ API payload (static). */
export function HeroReportApiDemo({ c }: { c: B2bCopy }) {
  const car = DEMO_CAR;
  const score = scoreTone(car.scoreLabel);
  const miles = mileageTone(car.odometer);
  const jsonPreview = `{
  "vin": "${car.vin}",
  "make": "${car.make}",
  "model": "${car.model}",
  "year": ${car.year},
  "odometer": ${car.odometer},
  "accidents": ${car.accidents},
  "title": "${car.title}",
  "score": ${car.score}
}`;
  const codeSnippet = `await kmcheck.reports.get({
  vin: "${car.vin.slice(0, 11)}••••••"
});`;

  return (
    <div className="relative overflow-hidden rounded-[1.5rem] border border-slate-900/10 bg-white/40 shadow-[0_24px_60px_-28px_rgba(15,23,42,0.35)] backdrop-blur dark:border-white/10 dark:bg-white/[0.03] dark:shadow-black/40">
      <div className="grid lg:grid-cols-2">
        <div className="relative border-b border-slate-900/8 p-3 sm:p-4 lg:border-b-0 lg:border-r dark:border-white/10">
          <div className="mb-2.5 flex items-center justify-between px-0.5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
              {c.flowReport}
            </span>
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
              yourbrand.com
            </span>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-900/10 bg-white shadow-sm dark:border-white/10 dark:bg-[#0f1613]">
            <div className={`h-0.5 bg-gradient-to-r ${score.accent}`} />
            <div className="p-3.5 sm:p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-base font-bold tracking-tight text-slate-900 sm:text-lg dark:text-white">
                    {car.year} {car.make} {car.model}
                  </p>
                  <span className="mt-1.5 inline-flex rounded-md border border-slate-900/10 bg-slate-50 px-2 py-0.5 font-mono text-[10px] tracking-wider text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                    {car.vin}
                  </span>
                </div>
                <div className={`shrink-0 rounded-xl border px-2.5 py-1.5 text-center ${score.box}`}>
                  <p className="text-lg font-black leading-none">{car.score}</p>
                  <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-wide opacity-80">
                    {car.scoreLabel}
                  </p>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-1.5">
                <PassChip ok={car.accidents === 0} label="0 accidents" />
                <PassChip ok={car.title === "Clean"} label={car.title} />
                <PassChip ok label="No theft" />
              </div>

              <div className="mt-3 overflow-hidden rounded-xl border border-slate-900/8 dark:border-white/10">
                <div className="flex items-center gap-2 border-b border-slate-900/8 bg-slate-50/80 px-3 py-2 dark:border-white/10 dark:bg-white/[0.04]">
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-orange-500/10">
                    <Gauge className="h-3 w-3 text-orange-600 dark:text-orange-400" />
                  </span>
                  <span className="text-[11px] font-bold text-slate-800 dark:text-slate-100">{c.dataItem3Title}</span>
                  <span className={`ml-auto text-[11px] font-semibold ${miles.text}`}>{formatKm(car.odometer)}</span>
                </div>
                <div className="px-3 py-2.5">
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                    <div
                      className={`h-full rounded-full ${miles.bar}`}
                      style={{ width: `${Math.min(100, (car.odometer / 300000) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-2.5 overflow-hidden rounded-xl border border-slate-900/8 dark:border-white/10">
                <div className="flex items-center gap-2 border-b border-slate-900/8 bg-slate-50/80 px-3 py-2 dark:border-white/10 dark:bg-white/[0.04]">
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-red-500/10">
                    <AlertTriangle className="h-3 w-3 text-red-600 dark:text-red-400" />
                  </span>
                  <span className="text-[11px] font-bold text-slate-800 dark:text-slate-100">{c.dataItem2Title}</span>
                </div>
                <div className="px-3 py-2.5">
                  <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-2.5 py-2 text-[11px] font-medium text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                    No accidents on record
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative bg-[#0b1210] p-3 sm:p-4">
          <div className="mb-2.5 flex items-center justify-between px-0.5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-400/90">
              {c.planDevTitle}
            </span>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-slate-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              200 OK · 86ms
            </span>
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#070c0a]">
            <div className="flex items-center gap-1.5 border-b border-white/[0.07] px-3 py-2">
              <span className="h-2 w-2 rounded-full bg-white/20" />
              <span className="h-2 w-2 rounded-full bg-white/20" />
              <span className="h-2 w-2 rounded-full bg-white/20" />
              <span className="ml-2 font-mono text-[10px] text-slate-500">api/v1/reports</span>
            </div>
            <div className="grid gap-0 sm:grid-rows-[auto_1fr]">
              <pre className="overflow-x-auto border-b border-white/[0.06] px-3 py-3 font-mono text-[10px] leading-relaxed text-slate-400 sm:text-[11px]">
                <code>
                  <span className="text-emerald-400/80">GET</span>
                  {"  /v1/reports?vin=…\n"}
                  <span className="text-slate-600">{codeSnippet}</span>
                </code>
              </pre>
              <pre className="min-h-[9.5rem] overflow-x-auto px-3 py-3 font-mono text-[10px] leading-relaxed text-emerald-200/85 sm:min-h-[11rem] sm:text-[11px]">
                <code>{jsonPreview}</code>
              </pre>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {[
              `${c.mockLabelMake}: ${car.make}`,
              `${c.mockLabelModel}: ${car.model}`,
              `${c.mockLabelYear}: ${car.year}`,
            ].map((chip) => (
              <span
                key={chip}
                className="rounded-md border border-emerald-400/25 bg-emerald-400/10 px-2 py-1 text-[10px] font-medium text-emerald-200"
              >
                {chip}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 border-t border-slate-900/8 bg-white/50 px-3 py-2 dark:border-white/10 dark:bg-white/[0.02]">
        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
        <p className="line-clamp-1 text-[11px] text-slate-500 dark:text-slate-400">{c.flowSub}</p>
      </div>
    </div>
  );
}

function PassChip({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full px-1.5 py-1 text-center text-[9px] font-semibold sm:text-[10px] ${
        ok
          ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300"
          : "bg-red-50 text-red-800 dark:bg-red-500/15 dark:text-red-300"
      }`}
    >
      {label}
    </span>
  );
}
