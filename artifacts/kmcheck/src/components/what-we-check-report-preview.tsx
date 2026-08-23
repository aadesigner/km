import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Gauge, Lock, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n/context";
import { KmcheckLogo } from "@/components/logo";
import { Badge } from "@/components/ui/badge";
import { DemoCarPhoto } from "@/components/demo-car-photo";
import { AnimatedMileageKm } from "@/components/vin-mileage-animated";
import type { WhatWeCheckFeature, WhatWeCheckMarket } from "@/lib/what-we-check-features";
import { getWhatWeCheckDemoReport, type WwcDemoFinding } from "@/lib/what-we-check-demo";
import { scoreStylesForDisplay } from "@/lib/vin-condition-score";
import { localizeProviderDate } from "@/lib/korean-provider-text";
import type { Language } from "@/lib/languages";

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
const TILT_MAX_X = 9;
const TILT_MAX_Y = 11;

function useDesktopTiltEnabled(reduced: boolean | null) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (reduced) {
      setEnabled(false);
      return;
    }
    const mq = window.matchMedia("(min-width: 1024px) and (pointer: fine)");
    const update = () => setEnabled(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [reduced]);

  return enabled;
}

function ReportTiltShell({
  children,
  reduced,
}: {
  children: React.ReactNode;
  reduced: boolean | null;
}) {
  const tiltEnabled = useDesktopTiltEnabled(reduced);
  const shellRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0, lift: 0 });
  const [glare, setGlare] = useState({ x: 50, y: 35 });
  const [hovering, setHovering] = useState(false);

  const resetTilt = useCallback(() => {
    setTilt({ rotateX: 0, rotateY: 0, lift: 0 });
    setGlare({ x: 50, y: 35 });
    setHovering(false);
  }, []);

  const handleMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!tiltEnabled || !shellRef.current) return;
      const rect = shellRef.current.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;
      setTilt({
        rotateX: (0.5 - py) * TILT_MAX_X,
        rotateY: (px - 0.5) * TILT_MAX_Y,
        lift: 10,
      });
      setGlare({ x: px * 100, y: py * 100 });
      setHovering(true);
    },
    [tiltEnabled],
  );

  return (
    <div
      ref={shellRef}
      className="relative w-full [perspective:1400px]"
      onMouseMove={tiltEnabled ? handleMove : undefined}
      onMouseLeave={tiltEnabled ? resetTilt : undefined}
    >
      <div
        className={cn(
          "pointer-events-none absolute -bottom-4 left-[10%] right-[10%] h-5 rounded-[100%] blur-2xl transition-opacity duration-300",
          hovering && tiltEnabled ? "opacity-100 bg-black/20 dark:bg-black/45" : "opacity-60 bg-black/10 dark:bg-black/30",
        )}
        style={
          tiltEnabled
            ? { transform: `translate3d(${tilt.rotateY * 0.6}px, 4px, 0) scale(${hovering ? 1.02 : 1})` }
            : undefined
        }
        aria-hidden
      />

      <motion.div
        className="relative [transform-style:preserve-3d] will-change-transform"
        animate={{
          rotateX: tilt.rotateX,
          rotateY: tilt.rotateY,
          translateZ: tilt.lift,
        }}
        transition={{ type: "spring", stiffness: 280, damping: 26, mass: 0.8 }}
      >
        {tiltEnabled && hovering && (
          <div
            className="pointer-events-none absolute inset-0 rounded-2xl z-30 mix-blend-soft-light"
            style={{
              background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255,255,255,0.22), transparent 52%)`,
            }}
            aria-hidden
          />
        )}
        {children}
      </motion.div>
    </div>
  );
}

const FEATURE_THEME = {
  mileage: {
    icon: Gauge,
    accent: "text-orange-600 dark:text-orange-400",
    bar: "from-orange-500 via-orange-400 to-amber-400",
    ring: "ring-orange-500/35",
    chipActive: "ring-orange-500/40 bg-orange-50/80 dark:bg-orange-950/30",
  },
  accidents: {
    icon: AlertTriangle,
    accent: "text-red-600 dark:text-red-400",
    bar: "from-red-500 via-red-400 to-rose-400",
    ring: "ring-red-500/35",
    chipActive: "ring-red-500/40 bg-red-50/80 dark:bg-red-950/30",
  },
  salvage: {
    icon: ShieldCheck,
    accent: "text-emerald-600 dark:text-emerald-400",
    bar: "from-emerald-500 via-emerald-400 to-teal-400",
    ring: "ring-emerald-500/35",
    chipActive: "ring-emerald-500/40 bg-emerald-50/80 dark:bg-emerald-950/30",
  },
  theft: {
    icon: Lock,
    accent: "text-emerald-600 dark:text-emerald-400",
    bar: "from-emerald-500 via-emerald-400 to-teal-400",
    ring: "ring-emerald-500/35",
    chipActive: "ring-emerald-500/40 bg-emerald-50/80 dark:bg-emerald-950/30",
  },
} as const;

function findingToneClass(tone: WwcDemoFinding["tone"]) {
  if (tone === "negative") {
    return "border-red-200/70 bg-red-50/60 text-red-950 dark:border-red-900/50 dark:bg-red-950/25 dark:text-red-100";
  }
  if (tone === "positive") {
    return "border-emerald-200/70 bg-emerald-50/60 text-emerald-950 dark:border-emerald-900/50 dark:bg-emerald-950/25 dark:text-emerald-100";
  }
  return "border-border/60 bg-muted/30 text-foreground";
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
    <div className={cn("shrink-0 rounded-xl border-2 px-3 py-2 text-center min-w-[4.25rem]", bgColor, borderColor)}>
      <p className={cn("text-xl font-black tabular-nums leading-none", textColor)}>{score.toFixed(1)}</p>
      <p className="text-[9px] font-semibold text-muted-foreground mt-0.5">/10</p>
      <p className={cn("text-[8px] font-bold mt-1 leading-tight line-clamp-2 max-w-[4.5rem] mx-auto", textColor)}>
        {label}
      </p>
    </div>
  );
}

function MileageDemo({ odometer, flaggedLabel }: { odometer: number; flaggedLabel: string }) {
  const reduced = useReducedMotion();
  const chartW = 100;
  const chartH = 44;
  const padX = 6;
  const padY = 8;
  const labelH = 11;
  const minKm = 35_000;
  const maxKm = 145_000;

  const toY = (km: number) =>
    padY + (1 - (km - minKm) / (maxKm - minKm)) * (chartH - padY * 2);

  const readings = [
    { x: padX, km: 42_100, label: "2019" },
    { x: 32, km: 89_200, label: "2021" },
    { x: 58, km: 64_500, label: "2022", rollback: true },
    { x: chartW - padX, km: 138_600, label: "2023" },
  ];

  const points = readings.map((r) => ({ ...r, y: toY(r.km) }));
  const seg = (from: number, to: number) =>
    `M ${points[from].x} ${points[from].y} L ${points[to].x} ${points[to].y}`;

  const fmtKm = (km: number) => (km >= 1000 ? `${Math.round(km / 1000)}k` : String(km));

  return (
    <div className="rounded-xl border border-border/50 bg-background/80 p-3">
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-baseline gap-1.5">
          <AnimatedMileageKm value={odometer} className="text-xl font-black tabular-nums text-foreground" />
          <span className="text-[10px] font-semibold text-muted-foreground">km</span>
        </div>
        <motion.span
          className="text-[9px] font-bold text-orange-900 dark:text-orange-100 bg-orange-100 dark:bg-orange-950/50 border border-orange-200/80 dark:border-orange-800/60 rounded-md px-2 py-0.5 leading-snug max-w-[55%] text-right"
          initial={reduced ? false : { opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.3 }}
        >
          {flaggedLabel}
        </motion.span>
      </div>
      <svg
        viewBox={`0 0 ${chartW} ${chartH + labelH}`}
        className="w-full h-[4rem]"
        aria-hidden
        preserveAspectRatio="xMidYMid meet"
      >
        {[0.25, 0.5, 0.75].map((t) => (
          <line
            key={t}
            x1={padX}
            x2={chartW - padX}
            y1={padY + t * (chartH - padY * 2)}
            y2={padY + t * (chartH - padY * 2)}
            stroke="currentColor"
            strokeOpacity="0.12"
            strokeWidth="0.75"
          />
        ))}
        <motion.path
          d={seg(0, 1)}
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.55"
          strokeWidth="2"
          strokeLinecap="round"
          initial={reduced ? { pathLength: 1 } : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.45, ease: EASE }}
        />
        <motion.path
          d={seg(1, 2)}
          fill="none"
          stroke="#ea580c"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray="3 2"
          initial={reduced ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.4, ease: EASE, delay: 0.3 }}
        />
        <motion.path
          d={seg(2, 3)}
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.55"
          strokeWidth="2"
          strokeLinecap="round"
          initial={reduced ? { pathLength: 1 } : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.45, ease: EASE, delay: 0.5 }}
        />
        {points.map((p, i) => (
          <g key={p.label}>
            <motion.circle
              cx={p.x}
              cy={p.y}
              r={p.rollback ? 3.5 : 2.75}
              fill={p.rollback ? "#ea580c" : "currentColor"}
              fillOpacity={p.rollback ? 1 : 0.65}
              stroke="hsl(var(--background))"
              strokeWidth="1.5"
              initial={reduced ? { scale: 1 } : { scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1 + i * 0.08, type: "spring", stiffness: 380, damping: 22 }}
            />
            <text
              x={p.x}
              y={p.y - (p.rollback ? 6 : 5)}
              textAnchor="middle"
              fontSize="5.5"
              fill={p.rollback ? "#c2410c" : "currentColor"}
              fillOpacity={p.rollback ? 1 : 0.55}
              fontWeight="700"
            >
              {fmtKm(p.km)}
            </text>
            <text
              x={p.x}
              y={chartH + 7}
              textAnchor="middle"
              fontSize="6"
              fill="currentColor"
              fillOpacity="0.45"
              fontWeight="600"
            >
              {p.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function AccidentDemo({ t }: { t: (k: string) => string }) {
  const reduced = useReducedMotion();

  /** Top-down car silhouette — body, glass, wheels, then panel damage overlays. */
  const bodyPath =
    "M 50 3 C 59 3 68 7 71 16 L 75 28 Q 78 38 78 48 L 79 64 L 78 80 Q 77 94 73 104 L 70 114 C 67 123 59 127 50 127 C 41 127 33 123 30 114 L 27 104 Q 23 94 22 80 L 21 64 L 22 48 Q 22 38 25 28 L 29 16 C 32 7 41 3 50 3 Z";
  const windshieldPath = "M 37 34 L 63 34 L 61 50 L 39 50 Z";
  const rearGlassPath = "M 39 72 L 61 72 L 59 84 L 41 84 Z";
  const wheels: Array<{ x: number; y: number }> = [
    { x: 16, y: 26 },
    { x: 74, y: 26 },
    { x: 16, y: 88 },
    { x: 74, y: 88 },
  ];

  const zones = [
    { id: "front", hot: true, d: "M 35 6 L 65 6 L 62 40 L 38 40 Z" },
    { id: "left", hot: true, d: "M 24 38 L 38 40 L 38 90 L 24 94 Z" },
    { id: "right", hot: true, d: "M 76 38 L 62 40 L 62 90 L 76 94 Z" },
    { id: "rear", hot: false, d: "M 38 96 L 62 96 L 64 118 L 36 118 Z" },
  ];

  return (
    <div className="rounded-xl border border-border/50 bg-background/80 p-3">
      <p className="text-[9px] font-bold uppercase tracking-wide text-muted-foreground mb-2">
        {t("wwc_demo_accident_map")}
      </p>
      <svg viewBox="0 0 100 132" className="w-full h-[5.25rem] text-foreground" aria-hidden>
        {/* Ground shadow */}
        <ellipse cx="50" cy="124" rx="26" ry="3.5" fill="currentColor" fillOpacity="0.07" />

        {/* Wheels */}
        {wheels.map((w) => (
          <rect
            key={`${w.x}-${w.y}`}
            x={w.x}
            y={w.y}
            width="10"
            height="18"
            rx="3"
            fill="currentColor"
            fillOpacity="0.22"
            stroke="currentColor"
            strokeOpacity="0.35"
            strokeWidth="0.75"
          />
        ))}

        {/* Body shell */}
        <path
          d={bodyPath}
          fill="currentColor"
          fillOpacity="0.07"
          stroke="currentColor"
          strokeOpacity="0.22"
          strokeWidth="1.25"
          strokeLinejoin="round"
        />

        {/* Glass */}
        <path d={windshieldPath} fill="#60a5fa" fillOpacity="0.28" stroke="currentColor" strokeOpacity="0.12" strokeWidth="0.5" />
        <path d={rearGlassPath} fill="#60a5fa" fillOpacity="0.2" stroke="currentColor" strokeOpacity="0.1" strokeWidth="0.5" />

        {/* Side mirrors */}
        <ellipse cx="19" cy="54" rx="3.2" ry="2" fill="currentColor" fillOpacity="0.18" />
        <ellipse cx="81" cy="54" rx="3.2" ry="2" fill="currentColor" fillOpacity="0.18" />

        {/* Headlights / taillights */}
        <circle cx="35" cy="12" r="2.2" fill="#fde047" fillOpacity="0.75" />
        <circle cx="65" cy="12" r="2.2" fill="#fde047" fillOpacity="0.75" />
        <circle cx="37" cy="118" r="1.8" fill="#f87171" fillOpacity="0.55" />
        <circle cx="63" cy="118" r="1.8" fill="#f87171" fillOpacity="0.55" />

        {/* Damage panel overlays */}
        {zones.map((z, i) => (
          <motion.g key={z.id}>
            <motion.path
              d={z.d}
              fill={z.hot ? "#ef4444" : "currentColor"}
              fillOpacity={z.hot ? 0.38 : 0.04}
              stroke={z.hot ? "#dc2626" : "currentColor"}
              strokeOpacity={z.hot ? 0.9 : 0.1}
              strokeWidth="1"
              strokeLinejoin="round"
              initial={reduced ? { opacity: 1 } : { opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.07, duration: 0.32, ease: EASE }}
              style={{ transformOrigin: "50px 65px" }}
            />
            {z.hot && !reduced && (
              <motion.path
                d={z.d}
                fill="#ef4444"
                fillOpacity={0.2}
                stroke="none"
                animate={{ fillOpacity: [0.28, 0.1, 0.28] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut", delay: i * 0.12 }}
              />
            )}
          </motion.g>
        ))}

        {/* Center axis hint — reads as top-down car direction */}
        <line x1="50" y1="8" x2="50" y2="122" stroke="currentColor" strokeOpacity="0.06" strokeWidth="0.75" strokeDasharray="2 2" />
      </svg>

      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
        <span className="inline-flex items-center gap-1 text-[9px] text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />
          {t("wwc_demo_event_front")}
        </span>
        <span className="inline-flex items-center gap-1 text-[9px] text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />
          {t("damage_val_side")} ×2
        </span>
        <span className="inline-flex items-center gap-1 text-[9px] text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30 shrink-0" />
          {t("wwc_demo_event_rear")}
        </span>
      </div>
    </div>
  );
}

function SalvageDemo({ clearLabel, note }: { clearLabel: string; note: string }) {
  return (
    <div className="rounded-xl border border-emerald-200/60 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/20 p-3 flex items-center gap-3 min-h-[4.5rem]">
      <div className="shrink-0 w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
        <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-bold text-emerald-900 dark:text-emerald-100">{clearLabel}</p>
        <p className="text-[10px] text-emerald-800/75 dark:text-emerald-300/70 mt-0.5 leading-snug">{note}</p>
      </div>
    </div>
  );
}

function TheftDemo({ clearLabel, note }: { clearLabel: string; note: string }) {
  return (
    <div className="rounded-xl border border-emerald-200/60 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/20 p-3 flex items-center gap-3 min-h-[4.5rem]">
      <div className="shrink-0 w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
        <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-bold text-emerald-900 dark:text-emerald-100">{clearLabel}</p>
        <p className="text-[10px] text-emerald-800/75 dark:text-emerald-300/70 mt-0.5 leading-snug">{note}</p>
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
    return <MileageDemo odometer={demo.odometer} flaggedLabel={t(demo.findings.mileage.valueKey)} />;
  }
  if (featureId === "accidents") {
    return <AccidentDemo t={t} />;
  }
  if (featureId === "salvage") {
    return <SalvageDemo clearLabel={t(demo.findings.salvage.valueKey)} note={t("wwc_demo_salvage_note")} />;
  }
  return <TheftDemo clearLabel={t(demo.findings.theft.valueKey)} note={t("wwc_demo_theft_note")} />;
}

function DocTable({
  columns,
  rows,
}: {
  columns: [string, string];
  rows: Array<{ date: string; primary: string; detail: string }>;
}) {
  const reduced = useReducedMotion();
  return (
    <table className="w-full border-collapse text-[9px] sm:text-[10px]">
      <thead>
        <tr className="border-b border-border/40">
          {columns.map((col) => (
            <th key={col} className="py-1 pr-2 text-left text-[8px] font-bold uppercase tracking-wide text-muted-foreground">
              {col}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <motion.tr
            key={`${row.date}-${row.primary}`}
            className="border-b border-border/25 last:border-0"
            initial={reduced ? false : { opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.06 + i * 0.08, duration: 0.3, ease: EASE }}
          >
            <td className="py-1.5 pr-2 text-muted-foreground whitespace-nowrap align-top font-medium tabular-nums w-[3.25rem]">
              {row.date}
            </td>
            <td className="py-1.5 text-foreground align-top leading-snug line-clamp-2">
              <span className="font-semibold">{row.primary}</span>
              {row.detail ? <span className="text-muted-foreground"> · {row.detail}</span> : null}
            </td>
          </motion.tr>
        ))}
      </tbody>
    </table>
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
  const reduced = useReducedMotion();
  const demo = getWhatWeCheckDemoReport(market);
  const theme = FEATURE_THEME[feature.id];
  const scoreNum = parseFloat(demo.score);
  const scoreStyle = scoreStylesForDisplay(scoreNum, t);
  const isRiskAccent = scoreNum < 6;

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
          ? [{ date: "—", primary: t(demo.findings.salvage.valueKey), detailKey: "wwc_demo_salvage_note" }]
          : [{ date: "—", primary: t(demo.findings.theft.valueKey), detailKey: "wwc_demo_theft_note" }];

  const tableRows = historyRows.slice(0, 2).map((row) => ({
    date: formatWwcDemoDate(row.date, language),
    primary: row.primaryKey ? t(row.primaryKey) : row.primary,
    detail: t(row.detailKey),
  }));

  const tableColumns: [string, string] =
    feature.id === "salvage" || feature.id === "theft"
      ? [t("wwc_demo_col_date"), t("wwc_demo_col_status")]
      : [t("wwc_demo_col_date"), feature.id === "mileage" ? t("mock_label_mileage") : t("wwc_demo_col_event")];

  const generatedDate = formatReportGeneratedDate(language);

  return (
    <motion.div
      className="relative h-full w-full flex flex-col justify-center"
      initial={reduced ? false : { opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, ease: EASE }}
    >
      <div className="relative mx-auto w-full max-w-[468px] lg:max-w-[500px]">
        <ReportTiltShell reduced={reduced}>
        <article className="relative overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm transition-shadow duration-300 lg:hover:shadow-lg">
          {/* Score accent — fixed for this car, does not change when switching sections */}
          <div
            className={cn(
              "absolute inset-x-0 top-0 z-20 h-[2px] bg-gradient-to-r",
              scoreStyle.accentBar,
              isRiskAccent && "vin-hero-accent-risk",
            )}
            aria-hidden
          />
          <div
            className={cn("pointer-events-none absolute inset-x-0 top-0 z-10 h-10 bg-gradient-to-b", scoreStyle.accentGlow)}
            aria-hidden
          />

          <header className="relative px-4 sm:px-5 pt-4 pb-3 border-b border-border/50">
            <div className="flex items-center justify-between gap-2 mb-3">
              <KmcheckLogo className="h-4" />
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant="outline" className="text-[9px] font-semibold border-primary/25 text-primary bg-primary/5">
                  {t("what_we_check_sample_badge")}
                </Badge>
                <span className="text-[9px] text-muted-foreground tabular-nums hidden sm:inline">{generatedDate}</span>
              </div>
            </div>

            <div className="grid grid-cols-[6rem_minmax(0,1fr)] sm:grid-cols-[7rem_minmax(0,1fr)] gap-3.5 items-start">
              <motion.div
                key={demo.photoUrl}
                className="rounded-xl border border-border/50 overflow-hidden aspect-[4/3] bg-muted/40 shadow-sm"
                initial={reduced ? false : { opacity: 0.7, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: EASE }}
              >
                <DemoCarPhoto src={demo.photoUrl} alt={demo.vehicleTitle} eager />
              </motion.div>

              <div className="min-w-0 flex gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                    {t("print_summary_title")}
                  </p>
                  <h3 className="text-base sm:text-lg font-bold tracking-tight leading-tight mt-0.5 line-clamp-1 text-foreground">
                    {demo.vehicleTitle}
                  </h3>
                  <Badge variant="outline" className="mt-1.5 font-mono text-[9px] tracking-wide px-2 py-0.5 bg-muted/30 border-border/60">
                    {demo.vin}
                  </Badge>
                  <p className="text-[10px] text-muted-foreground mt-1.5 line-clamp-1">
                    {t(demo.originKey)} · {demo.trim}
                  </p>
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
          </header>

          <div className="relative px-4 py-3 border-b border-border/50 bg-muted/15">
            <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-muted-foreground mb-2">
              {t("print_summary_findings")}
            </p>
            <div className="grid grid-cols-2 gap-2 lg:gap-2.5" role="group" aria-label={t("print_summary_findings")}>
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
                      "rounded-lg border px-2 py-1.5 lg:px-3 lg:py-2 flex items-start gap-1.5 lg:gap-2 text-left transition-all duration-200",
                      onSelectFeature && "cursor-pointer hover:opacity-90 active:scale-[0.98]",
                      findingToneClass(item.tone),
                      active
                        ? cn("ring-2 ring-offset-1 ring-offset-background shadow-sm opacity-100 scale-[1.02]", FEATURE_THEME[id].chipActive, FEATURE_THEME[id].ring)
                        : cn(
                            "opacity-55 scale-[0.98]",
                            onSelectFeature && "hover:opacity-75 hover:scale-[1]",
                          ),
                    )}
                  >
                    <Icon className={cn("h-3.5 w-3.5 lg:h-4 lg:w-4 shrink-0 mt-0.5", FEATURE_THEME[id].accent)} />
                    <div className="min-w-0">
                      <p className="text-[8px] lg:text-[9px] font-semibold uppercase tracking-wide opacity-75 leading-none truncate">
                        {t(item.labelKey)}
                      </p>
                      <p className="text-[10px] lg:text-[11px] font-bold mt-0.5 leading-snug line-clamp-2">{t(item.valueKey)}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={feature.id}
              initial={reduced ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? undefined : { opacity: 0, y: -4 }}
              transition={{ duration: 0.25, ease: EASE }}
              className="relative px-4 py-3 border-b border-border/50"
            >
              <div className="flex items-center gap-2 mb-2.5">
                <span className={cn("h-3.5 w-0.5 rounded-full shrink-0 bg-gradient-to-b", theme.bar)} />
                <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-foreground">{historyTitle}</p>
              </div>
              <FeatureDemonstration featureId={feature.id} demo={demo} t={t} />
            </motion.div>
          </AnimatePresence>

          <div className="px-4 py-3">
            <DocTable columns={tableColumns} rows={tableRows} />
          </div>

          <footer className="px-4 py-2 border-t border-border/40 bg-muted/10">
            <p className="text-[9px] text-muted-foreground text-center leading-snug line-clamp-2">
              {t("what_we_check_disclaimer")}
            </p>
          </footer>
        </article>
        </ReportTiltShell>
      </div>
    </motion.div>
  );
}
