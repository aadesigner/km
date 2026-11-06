import { useId } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Gauge, Lock, ShieldCheck, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n/context";
import { useLightMotion } from "@/hooks/use-light-motion";
import { KmcheckLogo } from "@/components/logo";
import { DemoCarPhoto } from "@/components/demo-car-photo";
import { AnimatedMileageKm } from "@/components/vin-mileage-animated";
import type { WhatWeCheckFeature, WhatWeCheckMarket } from "@/lib/what-we-check-features";
import { getWhatWeCheckDemoReport, type WwcDemoFinding } from "@/lib/what-we-check-demo";
import { scoreStylesForDisplay } from "@/lib/vin-condition-score";
import { localizeProviderDate } from "@/lib/korean-provider-text";
import type { Language } from "@/lib/languages";

function usePreviewMotionOff() {
  const reduced = useReducedMotion();
  const light = useLightMotion();
  return Boolean(reduced || light);
}

const EASE = [0.22, 1, 0.36, 1] as const;

function formatWwcDemoDate(date: string, language: Language): string {
  if (!date || date === "—") return date;
  const iso = /^\d{4}-\d{2}$/.test(date) ? `${date}-01` : date;
  return localizeProviderDate(iso, language) ?? date;
}

function formatReportGeneratedDate(language: Language): string {
  const now = new Date();
  const iso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  return localizeProviderDate(iso, language) ?? iso;
}

function sortHistoryNewestFirst<T extends { date: string }>(rows: readonly T[]): T[] {
  return [...rows].sort((a, b) => {
    if (a.date === "—" && b.date === "—") return 0;
    if (a.date === "—") return 1;
    if (b.date === "—") return -1;
    return b.date.localeCompare(a.date);
  });
}

const FEATURE_THEME = {
  mileage: {
    icon: Gauge,
    accent: "text-orange-600 dark:text-orange-400",
    bar: "bg-orange-500",
    active: "ring-orange-500/40",
  },
  accidents: {
    icon: AlertTriangle,
    accent: "text-red-600 dark:text-red-400",
    bar: "bg-red-500",
    active: "ring-red-500/40",
  },
  salvage: {
    icon: ShieldCheck,
    accent: "text-emerald-600 dark:text-emerald-400",
    bar: "bg-emerald-500",
    active: "ring-emerald-500/40",
  },
  theft: {
    icon: Lock,
    accent: "text-emerald-600 dark:text-emerald-400",
    bar: "bg-emerald-500",
    active: "ring-emerald-500/40",
  },
} as const;

function findingToneClass(tone: WwcDemoFinding["tone"]) {
  if (tone === "negative") {
    return "border-red-200/80 bg-red-50/80 text-red-950 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-100";
  }
  if (tone === "positive") {
    return "border-emerald-200/80 bg-emerald-50/80 text-emerald-950 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-100";
  }
  return "border-border/70 bg-muted/30 text-foreground";
}

function ScoreBadge({
  score,
  label,
  textColor,
  bgColor,
  borderColor,
}: {
  score: number;
  label: string;
  textColor: string;
  bgColor: string;
  borderColor: string;
}) {
  return (
    <div className={cn("shrink-0 rounded-xl border-2 px-3 py-2 text-center min-w-[4.5rem]", bgColor, borderColor)}>
      <p className={cn("text-xl font-black tabular-nums leading-none", textColor)}>{score.toFixed(1)}</p>
      <p className="text-[9px] font-semibold text-muted-foreground mt-0.5">/10</p>
      <p className={cn("text-[8px] font-bold mt-1 leading-tight line-clamp-2 max-w-[4.5rem] mx-auto", textColor)}>
        {label}
      </p>
    </div>
  );
}

function MileageDemo({
  odometer,
  unit,
  sectionLabel,
  flaggedLabel,
  flagged,
  chart,
}: {
  odometer: number;
  unit: "km" | "mi";
  sectionLabel: string;
  flaggedLabel: string;
  flagged: boolean;
  chart: ReturnType<typeof getWhatWeCheckDemoReport>["mileageChart"];
}) {
  const reduced = usePreviewMotionOff();
  const gradId = useId().replace(/:/g, "");
  const chartW = 320;
  const chartH = 108;
  const padX = 16;
  const padY = 14;
  const labelH = 16;
  const viewH = chartH + labelH;
  const kms = chart.map((p) => p.km);
  const pad = unit === "mi" ? 4_000 : 8_000;
  const minKm = Math.max(0, Math.min(...kms) - pad);
  const maxKm = Math.max(...kms) + pad;
  const spanX = chartW - padX * 2;
  const toY = (km: number) => padY + (1 - (km - minKm) / (maxKm - minKm)) * (chartH - padY * 2);
  const points = chart.map((p, i) => {
    const x = padX + (chart.length === 1 ? spanX / 2 : (i / (chart.length - 1)) * spanX);
    return { x, y: toY(p.km), km: p.km, label: p.year, rollback: p.rollback };
  });
  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1]!.x} ${chartH - padY / 2} L ${points[0]!.x} ${chartH - padY / 2} Z`;
  const fmt = (v: number) => `${Math.round(v / 1000)}k`;

  return (
    <div className="rounded-xl border border-border/60 bg-background p-3.5">
      <div className="flex items-end justify-between gap-3 mb-3">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-muted-foreground mb-1">{sectionLabel}</p>
          <div className="flex items-baseline gap-1.5">
            <AnimatedMileageKm value={odometer} className="text-2xl font-black tabular-nums text-foreground" />
            <span className="text-[10px] font-semibold text-muted-foreground">{unit}</span>
          </div>
        </div>
        <span
          className={cn(
            "text-[9px] font-bold rounded-md px-2 py-1 border",
            flagged
              ? "text-orange-900 bg-orange-100 border-orange-200 dark:text-orange-100 dark:bg-orange-950/50 dark:border-orange-800/60"
              : "text-emerald-900 bg-emerald-50 border-emerald-200 dark:text-emerald-100 dark:bg-emerald-950/40 dark:border-emerald-800/50",
          )}
        >
          {flaggedLabel}
        </span>
      </div>
      <svg
        viewBox={`0 0 ${chartW} ${viewH}`}
        className="w-full h-auto max-h-28 text-foreground"
        style={{ aspectRatio: `${chartW} / ${viewH}` }}
        aria-hidden
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id={`wwcFill-${gradId}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ea580c" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#ea580c" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((t) => (
          <line
            key={t}
            x1={padX}
            x2={chartW - padX}
            y1={padY + t * (chartH - padY * 2)}
            y2={padY + t * (chartH - padY * 2)}
            stroke="currentColor"
            strokeOpacity="0.08"
            strokeWidth="1"
          />
        ))}
        <motion.path
          d={areaPath}
          fill={`url(#wwcFill-${gradId})`}
          initial={reduced ? { opacity: 1 } : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, ease: EASE }}
        />
        <motion.path
          d={linePath}
          fill="none"
          stroke="#c2410c"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={reduced ? { pathLength: 1 } : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.8, ease: EASE }}
        />
        {points.map((p, i) => {
          if (!p.rollback || i === 0) return null;
          const prev = points[i - 1]!;
          return (
            <line
              key={`rb-${p.label}`}
              x1={prev.x}
              y1={prev.y}
              x2={p.x}
              y2={p.y}
              stroke="#ea580c"
              strokeWidth="2.5"
              strokeDasharray="4 3"
            />
          );
        })}
        {points.map((p) => (
          <g key={`${p.label}-${p.km}`}>
            <circle
              cx={p.x}
              cy={p.y}
              r={p.rollback ? 4.5 : 3.5}
              fill={p.rollback ? "#ea580c" : "hsl(var(--background))"}
              stroke={p.rollback ? "#c2410c" : "currentColor"}
              strokeWidth="1.5"
              strokeOpacity={p.rollback ? 1 : 0.5}
            />
            <text
              x={p.x}
              y={p.y - 9}
              textAnchor="middle"
              fontSize="8.5"
              fill={p.rollback ? "#c2410c" : "currentColor"}
              fillOpacity={p.rollback ? 1 : 0.5}
              fontWeight="700"
            >
              {fmt(p.km)}
            </text>
            <text x={p.x} y={chartH + 12} textAnchor="middle" fontSize="8.5" fill="currentColor" fillOpacity="0.4" fontWeight="600">
              {p.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function AccidentDemo({
  t,
  hot,
}: {
  t: (k: string) => string;
  hot: ReturnType<typeof getWhatWeCheckDemoReport>["accidentHot"];
}) {
  const bodyPath =
    "M 50 3 C 59 3 68 7 71 16 L 75 28 Q 78 38 78 48 L 79 64 L 78 80 Q 77 94 73 104 L 70 114 C 67 123 59 127 50 127 C 41 127 33 123 30 114 L 27 104 Q 23 94 22 80 L 21 64 L 22 48 Q 22 38 25 28 L 29 16 C 32 7 41 3 50 3 Z";
  const zones = [
    { id: "front" as const, hot: hot.front, d: "M 35 6 L 65 6 L 62 40 L 38 40 Z", labelKey: "wwc_demo_event_front" },
    { id: "left" as const, hot: hot.left, d: "M 24 38 L 38 40 L 38 90 L 24 94 Z", labelKey: "wwc_demo_event_left" },
    { id: "right" as const, hot: hot.right, d: "M 76 38 L 62 40 L 62 90 L 76 94 Z", labelKey: "wwc_demo_event_right" },
    { id: "rear" as const, hot: hot.rear, d: "M 38 96 L 62 96 L 64 118 L 36 118 Z", labelKey: "wwc_demo_event_rear" },
  ];
  const hotZones = zones.filter((z) => z.hot);

  return (
    <div className="rounded-xl border border-border/60 bg-background p-3.5">
      <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-muted-foreground mb-3">
        {t("wwc_demo_accident_map")}
      </p>
      <div className="flex items-center gap-4">
        <svg viewBox="0 0 100 132" className="h-28 w-auto shrink-0 text-foreground" aria-hidden>
          <ellipse cx="50" cy="124" rx="26" ry="3.5" fill="currentColor" fillOpacity="0.06" />
          <path
            d={bodyPath}
            fill="currentColor"
            fillOpacity="0.06"
            stroke="currentColor"
            strokeOpacity="0.2"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
          {zones.map((z) => (
            <path
              key={z.id}
              d={z.d}
              fill={z.hot ? "#ef4444" : "currentColor"}
              fillOpacity={z.hot ? 0.35 : 0.03}
              stroke={z.hot ? "#b91c1c" : "currentColor"}
              strokeOpacity={z.hot ? 0.85 : 0.08}
              strokeWidth="1"
              strokeLinejoin="round"
            />
          ))}
        </svg>
        <ul className="space-y-2 min-w-0">
          {hotZones.map((z) => (
            <li key={z.id} className="flex items-center gap-2 text-xs font-semibold text-red-800 dark:text-red-300">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />
              {t(z.labelKey)}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ClearStatusDemo({ clearLabel, note }: { clearLabel: string; note: string }) {
  return (
    <div className="rounded-xl border border-emerald-200/80 dark:border-emerald-900/50 bg-emerald-50/70 dark:bg-emerald-950/25 px-4 py-3.5 flex items-start gap-3">
      <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
      <div className="min-w-0">
        <p className="text-sm font-bold text-emerald-950 dark:text-emerald-100">{clearLabel}</p>
        <p className="text-[11px] text-emerald-900/70 dark:text-emerald-300/70 mt-1 leading-relaxed">{note}</p>
      </div>
    </div>
  );
}

function FeatureDemonstration({
  featureId,
  demo,
  t,
}: {
  featureId: WhatWeCheckFeature["id"];
  demo: ReturnType<typeof getWhatWeCheckDemoReport>;
  t: (k: string) => string;
}) {
  if (featureId === "mileage") {
    return (
      <MileageDemo
        odometer={demo.odometer}
        unit={demo.odometerUnit}
        sectionLabel={t("mock_label_mileage")}
        flaggedLabel={t(demo.findings.mileage.valueKey)}
        flagged={demo.findings.mileage.tone === "negative"}
        chart={demo.mileageChart}
      />
    );
  }
  if (featureId === "accidents") {
    return <AccidentDemo t={t} hot={demo.accidentHot} />;
  }
  if (featureId === "salvage") {
    return <ClearStatusDemo clearLabel={t(demo.findings.salvage.valueKey)} note={t(demo.salvageNoteKey)} />;
  }
  return <ClearStatusDemo clearLabel={t(demo.findings.theft.valueKey)} note={t(demo.theftNoteKey)} />;
}

function DocTable({
  columns,
  rows,
}: {
  columns: [string, string];
  rows: Array<{ date: string; primary: string; detail: string }>;
}) {
  return (
    <div className="rounded-xl border border-border/60 overflow-hidden bg-background">
      <table className="w-full border-collapse text-[11px]">
        <thead>
          <tr className="border-b border-border/50 bg-muted/40">
            {columns.map((col) => (
              <th key={col} className="py-2 px-3 text-left text-[9px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={`${row.date}-${row.primary}-${i}`} className="border-b border-border/25 last:border-0 even:bg-muted/15">
              <td className="py-2.5 px-3 text-muted-foreground whitespace-nowrap align-top font-mono text-[10px] tabular-nums w-[4.5rem]">
                {row.date}
              </td>
              <td className="py-2.5 px-3 text-foreground align-top leading-snug">
                <span className="font-semibold">{row.primary || "—"}</span>
                {row.detail ? <span className="text-muted-foreground"> · {row.detail}</span> : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function WhatWeCheckReportPreview({
  feature,
  market,
  onSelectFeature,
}: {
  feature: WhatWeCheckFeature;
  market?: WhatWeCheckMarket;
  onSelectFeature?: (id: WhatWeCheckFeature["id"]) => void;
}) {
  const { t, language } = useTranslation();
  const reduced = usePreviewMotionOff();
  const demo = getWhatWeCheckDemoReport(market);
  const theme = FEATURE_THEME[feature.id];
  const scoreNum = parseFloat(demo.score);
  const scoreStyle = scoreStylesForDisplay(scoreNum, t);
  const generatedDate = formatReportGeneratedDate(language);

  const historyTitle =
    feature.id === "mileage"
      ? t("print_summary_mileage_history")
      : feature.id === "accidents"
        ? t("vin_public_accidents_section")
        : feature.id === "salvage"
          ? t("report_salvage")
          : t("report_theft");

  const historyRows =
    feature.id === "mileage"
      ? demo.mileageRows
      : feature.id === "accidents"
        ? demo.accidentRows
        : feature.id === "salvage"
          ? demo.salvageRows
          : demo.theftRows;

  const tableRows = sortHistoryNewestFirst(historyRows)
    .slice(0, 5)
    .map((row) => ({
      date: formatWwcDemoDate(row.date, language),
      primary: row.primaryKey ? t(row.primaryKey) : row.primary,
      detail: t(row.detailKey),
    }));

  const tableColumns: [string, string] =
    feature.id === "salvage" || feature.id === "theft"
      ? [t("wwc_demo_col_date"), t("wwc_demo_col_status")]
      : [t("wwc_demo_col_date"), feature.id === "mileage" ? t("mock_label_mileage") : t("wwc_demo_col_event")];

  const specs = [
    { label: t("body_type"), value: t(demo.bodyKey) },
    { label: t("engine"), value: demo.engine },
    { label: t("transmission"), value: demo.transmission },
    { label: t("fuel_type"), value: t(demo.fuelKey) },
  ];

  return (
    <motion.div
      className="relative w-full"
      initial={reduced ? false : { opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-20px" }}
      transition={{ duration: 0.35, ease: EASE }}
    >
      <article className="relative overflow-hidden rounded-2xl border border-border/70 bg-card shadow-[0_18px_40px_-24px_rgba(0,0,0,0.35)] dark:shadow-[0_22px_48px_-22px_rgba(0,0,0,0.65)]">
        <div className={cn("h-1 w-full bg-gradient-to-r", scoreStyle.accentBar)} aria-hidden />

        {/* Letterhead */}
        <div className="flex items-center justify-between gap-3 px-4 sm:px-5 pt-4 pb-3 border-b border-border/50">
          <div className="flex items-center gap-2.5 min-w-0">
            <KmcheckLogo className="h-5 shrink-0" />
            <span className="hidden sm:inline h-3.5 w-px bg-border/70" aria-hidden />
            <span className="hidden sm:inline text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground truncate">
              {t("what_we_check_report_title")}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="rounded-md border border-border/70 bg-muted/40 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
              {t("what_we_check_sample_badge")}
            </span>
            <span className="hidden sm:inline text-[10px] text-muted-foreground tabular-nums">{generatedDate}</span>
          </div>
        </div>

        {/* Vehicle header — stacked so photo never overlaps text */}
        <div className="px-4 sm:px-5 py-4 border-b border-border/50 space-y-4">
          <div className="flex gap-3 sm:gap-4 items-start">
            <div className="w-[7.25rem] sm:w-36 shrink-0 overflow-hidden rounded-xl border border-border/60 bg-muted/40 aspect-[4/3]">
              <DemoCarPhoto src={demo.photoUrl} alt={demo.vehicleTitle} eager className="object-cover" />
            </div>
            <div className="min-w-0 flex-1 flex gap-2.5 items-start">
              <div className="min-w-0 flex-1 space-y-1.5">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground sm:hidden">
                  {t("what_we_check_report_title")}
                </p>
                <h3 className="text-lg sm:text-xl font-extrabold tracking-tight leading-tight text-foreground">
                  {demo.vehicleTitle}
                </h3>
                <p className="text-[11px] text-muted-foreground truncate">{demo.trim}</p>
                <div className="inline-flex max-w-full items-center gap-1.5 rounded-md border border-border/70 bg-muted/25 px-2 py-1">
                  <span className="text-[8px] font-bold uppercase tracking-wider text-muted-foreground shrink-0">
                    {t("what_we_check_vin_label")}
                  </span>
                  <span className="font-mono text-[10px] sm:text-[11px] font-semibold tracking-wide text-foreground truncate">
                    {demo.vin}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">{t(demo.originKey)}</p>
              </div>
              <ScoreBadge
                score={scoreNum}
                label={scoreStyle.label}
                textColor={scoreStyle.textColor}
                bgColor={scoreStyle.bgColor}
                borderColor={scoreStyle.borderColor}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px rounded-xl border border-border/55 overflow-hidden bg-border/55">
            {specs.map((spec) => (
              <div key={spec.label} className="bg-card px-2.5 py-2 min-w-0">
                <p className="text-[8px] font-bold uppercase tracking-[0.1em] text-muted-foreground truncate">{spec.label}</p>
                <p className="text-[11px] font-semibold text-foreground truncate mt-0.5">{spec.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Findings */}
        <div className="px-4 sm:px-5 py-3.5 border-b border-border/50 bg-muted/15">
          <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-muted-foreground mb-2.5">
            {t("print_summary_findings")}
          </p>
          <div className="grid grid-cols-2 gap-2" role="group" aria-label={t("print_summary_findings")}>
            {(Object.keys(demo.findings) as Array<keyof typeof demo.findings>).map((id) => {
              const item = demo.findings[id];
              const Icon = FEATURE_THEME[id].icon;
              const active = feature.id === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => onSelectFeature?.(id)}
                  aria-pressed={active}
                  className={cn(
                    "rounded-xl border px-2.5 py-2.5 flex items-start gap-2 text-left transition-shadow",
                    onSelectFeature && "cursor-pointer",
                    findingToneClass(item.tone),
                    active ? cn("ring-2 ring-offset-1 ring-offset-background shadow-sm", FEATURE_THEME[id].active) : "opacity-75",
                  )}
                >
                  {item.tone === "negative" ? (
                    <XCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
                  ) : item.tone === "positive" ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Icon className={cn("h-4 w-4 shrink-0 mt-0.5", FEATURE_THEME[id].accent)} />
                  )}
                  <div className="min-w-0">
                    <p className="text-[9px] font-semibold uppercase tracking-wide opacity-70 leading-none truncate">
                      {t(item.labelKey)}
                    </p>
                    <p className="text-xs font-bold mt-1 leading-snug line-clamp-2">{t(item.valueKey)}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={feature.id}
            initial={reduced ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? undefined : { opacity: 0 }}
            transition={{ duration: 0.2, ease: EASE }}
            className="px-4 sm:px-5 py-3.5 border-b border-border/50"
          >
            <div className="flex items-center gap-2 mb-2.5">
              <span className={cn("h-3.5 w-0.5 rounded-full shrink-0", theme.bar)} />
              <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-foreground">{historyTitle}</p>
            </div>
            <FeatureDemonstration featureId={feature.id} demo={demo} t={t} />
          </motion.div>
        </AnimatePresence>

        <div className="px-4 sm:px-5 py-3.5">
          <DocTable columns={tableColumns} rows={tableRows} />
        </div>

        <footer className="px-4 sm:px-5 py-3 border-t border-border/50 bg-muted/20">
          <p className="text-[10px] text-muted-foreground text-center leading-snug">{t("what_we_check_disclaimer")}</p>
        </footer>
      </article>
    </motion.div>
  );
}
