import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { Minus, Plus, RotateCcw } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { localizeProviderDate, translateKoreanProviderText, translateProviderDateInText } from "@/lib/korean-provider-text";
import { formatMilesInParens } from "@/lib/format-km-with-miles";
import { ACCIDENT_SEVERITY_I18N_KEYS, formatAccidentDescription } from "@/lib/accident-display";
import { translateMappedValue } from "@/lib/vehicle-attr-options";
import { translateDamageLabel } from "@/lib/translate-damage-label";
import {
  translateInsuranceClaimType,
  translateInsuranceClaimDescription,
  formatInsuranceAmount,
} from "@/lib/insurance-claims";
import { translateLotStatus } from "@/lib/translate-lot-status";
import { translateTitleStatus } from "@/lib/translate-title-status";
import { cleanDisplayText } from "@/lib/report-display";
import { formatLocationLabel, countryLabelsFromT } from "@/lib/format-country-name";
import type { Language } from "@/i18n/context";
import {
  TIMELINE_EVENT_TYPES,
  type TimelineEvent,
  type TimelineEventType,
} from "@/lib/report-history-timeline";
import { historyDateSortKey } from "@/lib/history-sort";

const TYPE_LABEL_KEY: Record<TimelineEventType, string> = {
  production: "report_timeline_production",
  accident: "report_timeline_accident",
  insurance: "report_timeline_insurance",
  mileage: "report_timeline_mileage",
  service: "report_timeline_service",
  auction: "report_timeline_auction",
  owner: "report_timeline_owner",
  registry: "report_timeline_registry",
};

const TYPE_DOT: Record<TimelineEventType, string> = {
  production: "bg-slate-500 dark:bg-slate-300",
  accident: "bg-red-500",
  insurance: "bg-amber-500",
  mileage: "bg-primary",
  service: "bg-emerald-500",
  auction: "bg-violet-500",
  owner: "bg-sky-500",
  registry: "bg-teal-500",
};

const VIEW_W = 1000;
const VIEW_H = 240;
const PAD = { l: 22, r: 22, t: 30, b: 16 };
const MIN_ZOOM = 1;
const MAX_ZOOM = 5;
const ZOOM_FACTOR = 1.25;
const DOUBLE_TAP_ZOOM = 2;

type ChartZoom = { scale: number; x: number; y: number };

function clampZoom(scale: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, scale));
}

function clampPan(x: number, y: number, scale: number, vw: number, vh: number): { x: number; y: number } {
  const cw = vw * scale;
  const ch = vh * scale;
  if (cw <= vw) x = (vw - cw) / 2;
  else x = Math.min(0, Math.max(vw - cw, x));
  if (ch <= vh) y = (vh - ch) / 2;
  else y = Math.min(0, Math.max(vh - ch, y));
  return { x, y };
}

function touchDistance(a: Touch, b: Touch): number {
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
}

function touchMidpoint(a: Touch, b: Touch): { x: number; y: number } {
  return { x: (a.clientX + b.clientX) / 2, y: (a.clientY + b.clientY) / 2 };
}

function pickYears(startYear: number, endYear: number, maxTicks: number): number[] {
  if (!Number.isFinite(startYear) || !Number.isFinite(endYear) || endYear < startYear) return [];
  if (endYear === startYear) return [startYear];
  const span = endYear - startYear;
  const count = Math.min(Math.max(2, maxTicks), span + 1);
  const years: number[] = [];
  for (let i = 0; i < count; i++) {
    years.push(Math.round(startYear + (i / (count - 1)) * span));
  }
  return [...new Set(years)];
}

type Props = {
  events: TimelineEvent[];
  t: (key: string) => string;
  language: Language;
  vehicleYear?: number | null;
  vehicleCountry?: string | null;
  krwPerUsd?: number | null;
  className?: string;
};

type MileagePoint = { sortKey: number; km: number };

function niceMax(n: number): number {
  if (n <= 0) return 10_000;
  const exp = 10 ** Math.floor(Math.log10(n));
  const f = n / exp;
  const nice = f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10;
  return nice * exp;
}

function formatKmAxis(km: number): string {
  if (km >= 1000) return `${Math.round(km / 1000)}k`;
  return String(Math.round(km));
}

function xOf(sortKey: number, min: number, span: number): number {
  if (span <= 0) return (PAD.l + VIEW_W - PAD.r) / 2;
  return PAD.l + ((sortKey - min) / span) * (VIEW_W - PAD.l - PAD.r);
}

function yOf(km: number, maxKm: number): number {
  const t = maxKm <= 0 ? 0 : Math.min(1, Math.max(0, km / maxKm));
  return PAD.t + (1 - t) * (VIEW_H - PAD.t - PAD.b);
}

function smoothLinePath(pts: { x: number; y: number }[]): string {
  if (pts.length === 0) return "";
  if (pts.length === 1) return `M ${pts[0]!.x.toFixed(1)} ${pts[0]!.y.toFixed(1)}`;
  if (pts.length === 2) {
    return `M ${pts[0]!.x.toFixed(1)} ${pts[0]!.y.toFixed(1)} L ${pts[1]!.x.toFixed(1)} ${pts[1]!.y.toFixed(1)}`;
  }
  const d = [`M ${pts[0]!.x.toFixed(1)} ${pts[0]!.y.toFixed(1)}`];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i]!;
    const p1 = pts[i]!;
    const p2 = pts[i + 1]!;
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d.push(
      `C ${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`,
    );
  }
  return d.join(" ");
}

function interpolateKm(sortKey: number, series: MileagePoint[]): number {
  if (series.length === 0) return 0;
  if (sortKey <= series[0]!.sortKey) return series[0]!.km;
  const last = series[series.length - 1]!;
  if (sortKey >= last.sortKey) return last.km;
  for (let i = 0; i < series.length - 1; i++) {
    const a = series[i]!;
    const b = series[i + 1]!;
    if (sortKey >= a.sortKey && sortKey <= b.sortKey) {
      const s = b.sortKey - a.sortKey;
      if (s <= 0) return b.km;
      return a.km + ((sortKey - a.sortKey) / s) * (b.km - a.km);
    }
  }
  return last.km;
}

function buildMileageSeries(events: TimelineEvent[]): MileagePoint[] {
  const points: MileagePoint[] = [];
  for (const event of events) {
    if (event.type === "production") {
      points.push({ sortKey: event.sortKey, km: 0 });
      continue;
    }
    if (event.mileage != null && event.mileage > 0) {
      points.push({ sortKey: event.sortKey, km: event.mileage });
    }
  }
  points.sort((a, b) => a.sortKey - b.sortKey || a.km - b.km);
  const out: MileagePoint[] = [];
  for (const p of points) {
    const prev = out[out.length - 1];
    if (prev && prev.sortKey === p.sortKey) {
      prev.km = p.km;
      continue;
    }
    out.push({ ...p });
  }
  return out;
}

const MARKER_TYPE_ORDER: TimelineEventType[] = [
  "accident",
  "insurance",
  "auction",
  "mileage",
  "service",
  "owner",
  "registry",
  "production",
];

function clusterTimelineEvents(events: TimelineEvent[]): TimelineEvent[][] {
  const grouped = new Map<string, TimelineEvent[]>();
  for (const event of events) {
    const list = grouped.get(event.dayKey);
    if (list) list.push(event);
    else grouped.set(event.dayKey, [event]);
  }
  return [...grouped.values()].map((group) =>
    [...group].sort(
      (a, b) =>
        MARKER_TYPE_ORDER.indexOf(a.type) - MARKER_TYPE_ORDER.indexOf(b.type) ||
        a.id.localeCompare(b.id),
    ),
  );
}

function clusterTypes(events: TimelineEvent[]): TimelineEventType[] {
  const seen = new Set<TimelineEventType>();
  const types: TimelineEventType[] = [];
  for (const type of MARKER_TYPE_ORDER) {
    if (events.some((e) => e.type === type) && !seen.has(type)) {
      seen.add(type);
      types.push(type);
    }
  }
  for (const event of events) {
    if (!seen.has(event.type)) {
      seen.add(event.type);
      types.push(event.type);
    }
  }
  return types;
}

/** Only known claim-type slugs (e.g. insurance_third_party_own_damage). */
function translateKnownClaimType(
  t: (key: string) => string,
  value: string | null | undefined,
): string | null {
  const raw = value?.trim();
  if (!raw) return null;
  const claimLabel = translateInsuranceClaimType(t, raw);
  if (claimLabel && claimLabel !== raw.replace(/_/g, " ")) return claimLabel;
  return null;
}

/** Only known lot/condition slugs (e.g. run_and_drives). */
function translateKnownLotToken(
  t: (key: string) => string,
  value: string | null | undefined,
): string | null {
  const raw = value?.trim();
  if (!raw) return null;
  const translated = translateLotStatus(t, raw);
  if (!translated) return null;
  const fallback = raw.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  if (translated !== fallback && translated !== raw) return translated;
  return null;
}

function humanizeLeftoverSlug(value: string): string {
  const trimmed = value.trim();
  if (!/^[a-z0-9]+(_[a-z0-9]+)+$/i.test(trimmed)) return trimmed;
  return trimmed.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatKmFact(km: number, t: (key: string) => string): string {
  return `${km.toLocaleString()} km ${formatMilesInParens(km, t)}`.trim();
}

function formatDamageFacts(
  event: Pick<TimelineEvent, "damage" | "primaryDamage" | "secondaryDamage">,
  t: (key: string) => string,
): string[] {
  const facts: string[] = [];
  const translateParts = (raw: string | null | undefined): string[] =>
    (raw ?? "")
      .split(/[;,]/)
      .map((part) => translateDamageLabel(t, part.trim()))
      .filter((part): part is string => Boolean(part));

  const primaryRaw = event.primaryDamage?.trim();
  const secondaryRaw = event.secondaryDamage?.trim();

  if (primaryRaw && /[;,]/.test(primaryRaw)) {
    const parts = translateParts(primaryRaw);
    if (parts.length) facts.push(`${t("damage_location")}: ${parts.join(" · ")}`);
    return facts;
  }

  const primary = translateDamageLabel(t, primaryRaw);
  const secondary = translateDamageLabel(t, secondaryRaw);
  if (primary) facts.push(`${t("primary_damage")}: ${primary}`);
  if (secondary) facts.push(`${t("secondary_damage")}: ${secondary}`);

  if (!primary && !secondary && event.damage) {
    const parts = translateParts(event.damage);
    if (parts.length === 1) facts.push(`${t("damage_location")}: ${parts[0]}`);
    else if (parts.length > 1) facts.push(`${t("damage_location")}: ${parts.join(" · ")}`);
  }

  return facts;
}

function clusterRecordedKm(events: TimelineEvent[]): number {
  return Math.max(0, ...events.map((e) => (e.mileage != null && e.mileage > 0 ? e.mileage : 0)));
}

function localizeTimelineText(
  t: (key: string) => string,
  language: Language,
  value: string | null | undefined,
): string | null {
  const raw = cleanDisplayText(value);
  if (!raw) return null;
  const claim = translateKnownClaimType(t, raw);
  if (claim) return claim;
  const lot = translateKnownLotToken(t, raw);
  if (lot) return lot;
  const withCosts = translateInsuranceClaimDescription(t, raw) ?? raw;
  const withPhrases = translateKoreanProviderText(t, withCosts) ?? withCosts;
  const withDates = translateProviderDateInText(withPhrases, language) ?? withPhrases;
  const withTitle = translateTitleStatus(t, withDates);
  return humanizeLeftoverSlug(withTitle || withDates);
}

function eventFacts(
  event: TimelineEvent,
  t: (key: string) => string,
  language: Language,
  vehicleCountry?: string | null,
  krwPerUsd?: number | null,
): string[] {
  // Insurance claims: section title is enough — popup shows total payout only (no parts/labor/paint).
  if (event.type === "insurance") {
    if (event.lossAmount != null && event.lossAmount > 0) {
      return [
        formatInsuranceAmount(event.lossAmount, vehicleCountry, krwPerUsd, {
          hasKoreanInsuranceClaims: true,
        }),
      ];
    }
    return [];
  }

  const facts: string[] = [];
  if (event.mileage != null && event.mileage > 0) {
    facts.push(
      `${event.mileage.toLocaleString()} km ${formatMilesInParens(event.mileage, t)}`.trim(),
    );
  }
  if (event.severity) {
    const sev = translateMappedValue(event.severity, ACCIDENT_SEVERITY_I18N_KEYS, t) ?? event.severity;
    if (sev) facts.push(sev);
  }
  if (event.title) {
    const title = localizeTimelineText(t, language, event.title);
    if (title) facts.push(title);
  }
  if (event.subtitle) {
    const sub = localizeTimelineText(t, language, event.subtitle);
    if (sub) facts.push(sub);
  }
  if (event.location) {
    const loc = formatLocationLabel(event.location, language, countryLabelsFromT(t))
      || localizeTimelineText(t, language, event.location);
    if (loc) facts.push(loc);
  }
  if (event.condition) {
    const cond = translateLotStatus(t, event.condition)
      ?? localizeTimelineText(t, language, event.condition);
    if (cond) facts.push(cond);
  }
  facts.push(...formatDamageFacts(event, t));
  if (event.lotStatus) {
    const lot = translateLotStatus(t, event.lotStatus)
      ?? localizeTimelineText(t, language, event.lotStatus);
    if (lot) facts.push(lot);
  }
  if (event.lossAmount != null && event.lossAmount > 0) {
    facts.push(
      formatInsuranceAmount(event.lossAmount, vehicleCountry, krwPerUsd, {
        hasKoreanInsuranceClaims: false,
      }),
    );
  }
  const price = event.finalPrice ?? event.auctionPrice;
  if (price != null && price > 0) {
    facts.push(`$${price.toLocaleString()}`);
  }
  if (event.description) {
    const desc = event.type === "accident"
      ? formatAccidentDescription(t, language, event.description)
      : localizeTimelineText(t, language, event.description);
    if (desc) facts.push(desc);
  }
  return [...new Set(facts)]
    .map((fact) => translateInsuranceClaimDescription(t, fact) ?? fact)
    .map(humanizeLeftoverSlug)
    .filter(Boolean)
    .slice(0, 6);
}

function TimelineMarker({
  events,
  leftPct,
  topPct,
  t,
  language,
  vehicleYear,
  vehicleCountry,
  krwPerUsd,
  interactive,
  zoomScale,
}: {
  events: TimelineEvent[];
  leftPct: number;
  topPct: number;
  t: (key: string) => string;
  language: Language;
  vehicleYear?: number | null;
  vehicleCountry?: string | null;
  krwPerUsd?: number | null;
  interactive: boolean;
  zoomScale: number;
}) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const primary = events[0];
  if (!primary) return null;

  const openNow = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    setOpen(true);
  };

  const closeSoon = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpen(false), 140);
  };

  const types = clusterTypes(events);
  const clustered = types.length > 1;
  const recordedKm = clusterRecordedKm(events);
  const kmFact = recordedKm > 0 ? formatKmFact(recordedKm, t) : null;
  const dateLabel =
    primary.type === "production" && primary.productionYear
      ? String(primary.productionYear)
      : localizeProviderDate(primary.date, language, vehicleYear, vehicleCountry) ?? primary.dayKey;
  const typeLabels = types.map((type) => t(TYPE_LABEL_KEY[type]));
  const seenFacts = new Set<string>();
  const sections = types.flatMap((type) => {
    if (clustered && type === "mileage") return [];
    const group = events.filter((e) => e.type === type);
    let facts = [...new Set(group.flatMap((e) => eventFacts(e, t, language, vehicleCountry, krwPerUsd)))];
    if (kmFact) facts = facts.filter((fact) => fact !== kmFact);
    if (type !== "owner") {
      facts = facts.filter((fact) => {
        if (seenFacts.has(fact)) return false;
        seenFacts.add(fact);
        return true;
      });
    }
    facts = facts.slice(0, 8);
    if (clustered && facts.length === 0) return [];
    return [{ type, label: t(TYPE_LABEL_KEY[type]), facts }];
  });
  const markerType = types[0] ?? primary.type;
  const inverse = 1 / Math.max(zoomScale, 0.01);
  const accident = !clustered && types.includes("accident");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`${typeLabels.join(", ")}, ${dateLabel}`}
          className={cn(
            "absolute z-[1] group flex h-9 w-9 items-center justify-center rounded-full",
            "outline-none focus-visible:ring-2 focus-visible:ring-primary/45 focus-visible:ring-offset-1",
            !interactive && "pointer-events-none",
          )}
          style={{
            left: `${leftPct}%`,
            top: `${topPct}%`,
            transform: `translate(-50%, -50%) scale(${inverse})`,
          }}
          onPointerEnter={(e) => {
            if (e.pointerType === "mouse") openNow();
          }}
          onPointerLeave={(e) => {
            if (e.pointerType === "mouse") closeSoon();
          }}
        >
          <span
            className={cn(
              "relative block rounded-full shadow-[0_1px_3px_rgba(15,23,42,0.22)]",
              "ring-[2.5px] ring-background transition-transform duration-150",
              open ? "scale-110" : "group-hover:scale-105",
              accident || clustered ? "h-4 w-4" : "h-3.5 w-3.5",
              markerType === "production" && !clustered && "h-3 w-3 ring-slate-400/80 dark:ring-slate-500",
              clustered ? "bg-primary" : TYPE_DOT[markerType],
            )}
          />
          {clustered ? (
            <span className="absolute right-0.5 top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-foreground px-0.5 text-[8px] font-bold leading-none text-background shadow-sm">
              {types.length}
            </span>
          ) : null}
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="center"
        sideOffset={10}
        collisionPadding={16}
        className="w-[min(17rem,calc(100vw-1.5rem))] max-h-[min(20rem,70vh)] overflow-y-auto rounded-xl p-0 shadow-lg"
        onPointerEnter={(e) => {
          if (e.pointerType === "mouse") openNow();
        }}
        onPointerLeave={(e) => {
          if (e.pointerType === "mouse") closeSoon();
        }}
      >
        <div className="border-b border-border/60 px-3 py-2">
          <p className="text-sm font-semibold leading-tight text-foreground">{dateLabel}</p>
          {kmFact ? (
            <p className="mt-0.5 text-[12px] tabular-nums text-muted-foreground">{kmFact}</p>
          ) : null}
          {clustered ? (
            <p className="mt-0.5 text-[11px] text-muted-foreground">{typeLabels.join(" · ")}</p>
          ) : null}
        </div>
        <div className={cn("px-3 py-2", sections.length > 1 ? "space-y-2.5" : "")}>
          {sections.map((section) => (
            <div key={section.type}>
              <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                <span className={cn("h-2 w-2 rounded-full ring-2 ring-background shadow-sm", TYPE_DOT[section.type])} />
                {section.label}
              </p>
              {section.facts.length > 0 ? (
                <ul className="mt-1 space-y-0.5 text-[13px] leading-snug text-foreground/80">
                  {section.facts.map((fact) => (
                    <li key={fact}>{fact}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function ReportHistoryTimeline({
  events,
  t,
  language,
  vehicleYear,
  vehicleCountry,
  krwPerUsd,
  className,
}: Props) {
  const fillId = useId().replace(/:/g, "");
  const viewportRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef<ChartZoom>({ scale: 1, x: 0, y: 0 });
  const pinchRef = useRef<{
    distance: number;
    scale: number;
    contentX: number;
    contentY: number;
  } | null>(null);
  const panRef = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null);
  const lastTapRef = useRef(0);
  const [zoom, setZoom] = useState<ChartZoom>({ scale: 1, x: 0, y: 0 });
  const [gesturing, setGesturing] = useState(false);

  const applyZoom = useCallback((next: ChartZoom, origin?: { x: number; y: number }) => {
    const viewport = viewportRef.current;
    const vw = viewport?.clientWidth ?? 0;
    const vh = viewport?.clientHeight ?? 0;
    const scale = clampZoom(next.scale);
    let x = next.x;
    let y = next.y;
    if (origin && vw > 0) {
      const current = zoomRef.current;
      const cx = (origin.x - current.x) / current.scale;
      const cy = (origin.y - current.y) / current.scale;
      x = origin.x - cx * scale;
      y = origin.y - cy * scale;
    }
    const clamped = scale <= 1.001
      ? { scale: 1, x: 0, y: 0 }
      : { scale, ...clampPan(x, y, scale, vw, vh) };
    zoomRef.current = clamped;
    setZoom(clamped);
  }, []);

  const zoomAtCenter = useCallback((factor: number) => {
    const viewport = viewportRef.current;
    if (!viewport) {
      applyZoom({ ...zoomRef.current, scale: zoomRef.current.scale * factor });
      return;
    }
    const rect = viewport.getBoundingClientRect();
    applyZoom(
      { ...zoomRef.current, scale: zoomRef.current.scale * factor },
      { x: rect.width / 2, y: rect.height / 2 },
    );
  }, [applyZoom]);

  const resetZoom = useCallback(() => {
    zoomRef.current = { scale: 1, x: 0, y: 0 };
    setZoom({ scale: 1, x: 0, y: 0 });
  }, []);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const localPoint = (clientX: number, clientY: number) => {
      const rect = viewport.getBoundingClientRect();
      return { x: clientX - rect.left, y: clientY - rect.top };
    };

    const onWheel = (e: WheelEvent) => {
      const zoomingIn = e.deltaY < 0;
      const scale = zoomRef.current.scale;
      if ((zoomingIn && scale >= MAX_ZOOM - 0.001) || (!zoomingIn && scale <= MIN_ZOOM + 0.001)) {
        return;
      }
      e.preventDefault();
      const factor = zoomingIn ? ZOOM_FACTOR : 1 / ZOOM_FACTOR;
      applyZoom(
        { ...zoomRef.current, scale: zoomRef.current.scale * factor },
        localPoint(e.clientX, e.clientY),
      );
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const a = e.touches[0]!;
        const b = e.touches[1]!;
        const mid = localPoint(touchMidpoint(a, b).x, touchMidpoint(a, b).y);
        const z = zoomRef.current;
        const dist = touchDistance(a, b);
        if (dist < 1) return;
        pinchRef.current = {
          distance: dist,
          scale: z.scale,
          contentX: (mid.x - z.x) / z.scale,
          contentY: (mid.y - z.y) / z.scale,
        };
        panRef.current = null;
        setGesturing(true);
        return;
      }
      if (e.touches.length === 1 && zoomRef.current.scale > 1.02) {
        const t = e.touches[0]!;
        panRef.current = {
          x: t.clientX,
          y: t.clientY,
          tx: zoomRef.current.x,
          ty: zoomRef.current.y,
        };
        pinchRef.current = null;
        setGesturing(true);
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && pinchRef.current) {
        e.preventDefault();
        const a = e.touches[0]!;
        const b = e.touches[1]!;
        const mid = localPoint(touchMidpoint(a, b).x, touchMidpoint(a, b).y);
        const scale = pinchRef.current.scale * (touchDistance(a, b) / pinchRef.current.distance);
        applyZoom({
          scale,
          x: mid.x - pinchRef.current.contentX * scale,
          y: mid.y - pinchRef.current.contentY * scale,
        });
        return;
      }
      if (e.touches.length === 1 && panRef.current && zoomRef.current.scale > 1.02) {
        e.preventDefault();
        const t = e.touches[0]!;
        applyZoom({
          scale: zoomRef.current.scale,
          x: panRef.current.tx + (t.clientX - panRef.current.x),
          y: panRef.current.ty + (t.clientY - panRef.current.y),
        });
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length > 0) return;
      const wasPinch = Boolean(pinchRef.current);
      pinchRef.current = null;
      panRef.current = null;
      setGesturing(false);

      if (wasPinch) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest("button")) return;
      const touch = e.changedTouches[0];
      if (!touch) return;
      const now = Date.now();
      if (now - lastTapRef.current < 280) {
        lastTapRef.current = 0;
        if (zoomRef.current.scale > 1.05) resetZoom();
        else {
          applyZoom(
            { ...zoomRef.current, scale: DOUBLE_TAP_ZOOM },
            localPoint(touch.clientX, touch.clientY),
          );
        }
        return;
      }
      lastTapRef.current = now;
    };

    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0 || zoomRef.current.scale <= 1.02) return;
      if ((e.target as HTMLElement).closest("button")) return;
      panRef.current = {
        x: e.clientX,
        y: e.clientY,
        tx: zoomRef.current.x,
        ty: zoomRef.current.y,
      };
      setGesturing(true);
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!panRef.current || zoomRef.current.scale <= 1.02) return;
      e.preventDefault();
      applyZoom({
        scale: zoomRef.current.scale,
        x: panRef.current.tx + (e.clientX - panRef.current.x),
        y: panRef.current.ty + (e.clientY - panRef.current.y),
      });
    };

    const onMouseUp = () => {
      panRef.current = null;
      setGesturing(false);
    };

    viewport.addEventListener("wheel", onWheel, { passive: false });
    viewport.addEventListener("touchstart", onTouchStart, { passive: true });
    viewport.addEventListener("touchmove", onTouchMove, { passive: false });
    viewport.addEventListener("touchend", onTouchEnd, { passive: true });
    viewport.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      viewport.removeEventListener("wheel", onWheel);
      viewport.removeEventListener("touchstart", onTouchStart);
      viewport.removeEventListener("touchmove", onTouchMove);
      viewport.removeEventListener("touchend", onTouchEnd);
      viewport.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [applyZoom, resetZoom, events.length]);

  const layout = useMemo(() => {
    if (events.length === 0) return null;
    const min = events[0]!.sortKey;
    const max = events[events.length - 1]!.sortKey;
    const span = Math.max(0, max - min);
    const series = buildMileageSeries(events);
    const rawMax = Math.max(0, ...series.map((p) => p.km), ...events.map((e) => e.mileage ?? 0));
    const maxKm = niceMax(rawMax);

    const startYear = Number(events[0]!.dayKey.slice(0, 4));
    const endYear = Number(events[events.length - 1]!.dayKey.slice(0, 4));
    const years = pickYears(startYear, endYear, 5).map((year) => ({
      year,
      leftPct: Math.min(
        98,
        Math.max(2, (xOf(historyDateSortKey(`${year}-01-01`), min, span) / VIEW_W) * 100),
      ),
    }));

    const yTicks = [0, maxKm / 2, maxKm].map((km) => ({
      km,
      topPct: (yOf(km, maxKm) / VIEW_H) * 100,
    }));
    const baselineY = yOf(0, maxKm);

    const linePts = series.map((p) => ({
      x: xOf(p.sortKey, min, span),
      y: yOf(p.km, maxKm),
      km: p.km,
    }));
    if (linePts.length === 1) {
      linePts.push({ x: xOf(max, min, span), y: linePts[0]!.y, km: linePts[0]!.km });
    }

    const lineD = smoothLinePath(linePts);
    const areaD =
      linePts.length >= 2
        ? `${lineD} L ${linePts[linePts.length - 1]!.x.toFixed(1)} ${baselineY} L ${linePts[0]!.x.toFixed(1)} ${baselineY} Z`
        : "";

    const markers = clusterTimelineEvents(events)
      .filter((group) => clusterTypes(group).some((type) => type !== "mileage"))
      .map((group) => {
        const lead = group[0]!;
        const km =
          Math.max(0, ...group.map((e) => (e.mileage != null && e.mileage > 0 ? e.mileage : 0)))
          || interpolateKm(lead.sortKey, series);
        const x = Math.min(VIEW_W - PAD.r, Math.max(PAD.l, xOf(lead.sortKey, min, span)));
        const y = yOf(km, maxKm);
        return {
          id: group.map((e) => e.id).join("+"),
          events: group,
          leftPct: (x / VIEW_W) * 100,
          topPct: (y / VIEW_H) * 100,
        };
      });

    const last = linePts[linePts.length - 1];

    return {
      min,
      span,
      maxKm,
      years,
      yTicks,
      baselineY,
      lineD,
      areaD,
      markers,
      last,
    };
  }, [events]);

  if (!layout || events.length === 0) return null;

  const presentTypes = TIMELINE_EVENT_TYPES.filter(
    (type) => type !== "mileage" && events.some((e) => e.type === type),
  );
  const zoomed = zoom.scale > 1.02;

  return (
    <section
      className={cn(
        "print:hidden max-w-full min-w-0 overflow-x-hidden rounded-2xl border bg-background",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3 px-3 pt-3 sm:px-5 sm:pt-4">
        <h2 className="text-sm font-semibold tracking-tight text-foreground">
          {t("report_timeline_title")}
        </h2>
        <div className="flex shrink-0 items-center gap-1.5">
          <div className="inline-flex items-center rounded-md border border-border/70 bg-muted/40">
            <button
              type="button"
              className="flex h-7 w-7 items-center justify-center text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
              aria-label={t("report_timeline_zoom_out")}
              disabled={zoom.scale <= MIN_ZOOM}
              onClick={() => zoomAtCenter(1 / ZOOM_FACTOR)}
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="min-w-[2.25rem] px-0.5 text-center text-[10px] font-medium tabular-nums text-muted-foreground">
              {`${Number.isInteger(zoom.scale) ? zoom.scale.toFixed(0) : zoom.scale.toFixed(1)}×`}
            </span>
            <button
              type="button"
              className="flex h-7 w-7 items-center justify-center text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
              aria-label={t("report_timeline_zoom_in")}
              disabled={zoom.scale >= MAX_ZOOM}
              onClick={() => zoomAtCenter(ZOOM_FACTOR)}
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              className="flex h-7 w-7 items-center justify-center text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
              aria-label={t("report_timeline_zoom_reset")}
              disabled={!zoomed}
              onClick={resetZoom}
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      <div className="mt-1 w-full min-w-0 px-2 pb-1 sm:px-3">
      <div
        ref={viewportRef}
        className={cn(
          "overflow-hidden overscroll-contain select-none",
          zoomed ? "touch-none cursor-grab" : "touch-pan-y",
          gesturing && zoomed && "cursor-grabbing",
        )}
      >
        <div
          className="origin-top-left will-change-transform"
          style={{
            transform: `translate(${zoom.x}px, ${zoom.y}px) scale(${zoom.scale})`,
            transition: gesturing ? "none" : "transform 140ms ease-out",
          }}
        >
        <div className="flex min-w-0 items-stretch">
          <div className="relative w-7 shrink-0 sm:w-8">
            {layout.yTicks.map((tick) => (
              <span
                key={tick.km}
                className="absolute right-1 -translate-y-1/2 text-[10px] tabular-nums leading-none text-muted-foreground sm:text-[11px]"
                style={{ top: `${tick.topPct}%` }}
              >
                {formatKmAxis(tick.km)}
              </span>
            ))}
          </div>

          <div className="relative min-w-0 flex-1 overflow-hidden">
            <svg
              viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
              className="block h-[10.5rem] w-full max-w-full sm:h-[13.5rem] lg:h-[15.5rem]"
              preserveAspectRatio="none"
              role="img"
              aria-hidden
            >
              <defs>
                <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.02" />
                </linearGradient>
              </defs>
              {layout.yTicks.map((tick, i) => (
                <line
                  key={tick.km}
                  x1={PAD.l}
                  x2={VIEW_W - PAD.r}
                  y1={(tick.topPct / 100) * VIEW_H}
                  y2={(tick.topPct / 100) * VIEW_H}
                  className="stroke-border/70"
                  strokeWidth="1"
                  strokeDasharray={i === 0 || i === layout.yTicks.length - 1 ? undefined : "4 6"}
                  vectorEffect="non-scaling-stroke"
                />
              ))}

              <line
                x1={PAD.l}
                x2={VIEW_W - PAD.r}
                y1={layout.baselineY}
                y2={layout.baselineY}
                className="stroke-foreground/20"
                strokeWidth="1.5"
                vectorEffect="non-scaling-stroke"
              />

              {layout.years.map(({ year, leftPct }) => {
                const x = (leftPct / 100) * VIEW_W;
                return (
                  <line
                    key={year}
                    x1={x}
                    x2={x}
                    y1={layout.baselineY}
                    y2={layout.baselineY + 7}
                    className="stroke-foreground/25"
                    strokeWidth="1"
                    vectorEffect="non-scaling-stroke"
                  />
                );
              })}

              {layout.areaD ? (
                <path d={layout.areaD} fill={`url(#${fillId})`} />
              ) : null}
              {layout.lineD ? (
                <path
                  d={layout.lineD}
                  className="stroke-primary"
                  fill="none"
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                />
              ) : null}
            </svg>

            {layout.markers.map((m) => (
              <TimelineMarker
                key={m.id}
                events={m.events}
                leftPct={m.leftPct}
                topPct={m.topPct}
                t={t}
                language={language}
                vehicleYear={vehicleYear}
                vehicleCountry={vehicleCountry}
                krwPerUsd={krwPerUsd}
                interactive={!gesturing}
                zoomScale={zoom.scale}
              />
            ))}
          </div>
        </div>

        <div className="flex min-w-0">
          <div className="w-7 shrink-0 sm:w-8" />
          <div className="relative h-5 min-w-0 flex-1 overflow-hidden sm:h-6">
            {layout.years.map(({ year, leftPct }, i) => {
              const align =
                i === 0 ? "translate-x-0" : i === layout.years.length - 1 ? "-translate-x-full" : "-translate-x-1/2";
              return (
                <span
                  key={year}
                  className={cn(
                    "absolute top-0.5 text-[10px] tabular-nums leading-none text-muted-foreground sm:text-[11px]",
                    align,
                  )}
                  style={{ left: `${leftPct}%` }}
                >
                  <span className="sm:hidden">{String(year).slice(2)}</span>
                  <span className="hidden sm:inline">{year}</span>
                </span>
              );
            })}
          </div>
        </div>
        </div>
      </div>
      </div>

      {presentTypes.length > 0 ? (
      <ul className="flex flex-wrap gap-x-3 gap-y-1.5 border-t border-border/60 px-3 py-2.5 sm:gap-x-4 sm:px-5 sm:py-3">
        {presentTypes.map((type) => (
          <li key={type} className="inline-flex items-center gap-1.5 text-[10px] text-muted-foreground sm:text-[11px]">
            <span className={cn("h-2 w-2 rounded-full ring-2 ring-background shadow-sm", TYPE_DOT[type])} />
            {t(TYPE_LABEL_KEY[type])}
          </li>
        ))}
      </ul>
      ) : null}
    </section>
  );
}
