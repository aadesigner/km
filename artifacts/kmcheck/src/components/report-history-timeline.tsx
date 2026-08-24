import { useCallback, useEffect, useId, useMemo, useRef, useState, type CSSProperties, type RefObject } from "react";
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
  shouldShowTimelineMarkerGroup,
} from "@/lib/report-history-timeline";
import { historyDateSortKey } from "@/lib/history-sort";
import { VIN_REPORT_SECTION_SURFACE } from "@/components/vin-report-section";

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
/** Tight plot inset — left room for in-chart mileage labels. */
const PAD = { l: 44, r: 18, t: 28, b: 16 };
const MIN_ZOOM = 1;
const MAX_ZOOM = 6;
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

function useChartZoom(enabled: boolean) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef<ChartZoom>({ scale: 1, x: 0, y: 0 });
  const pinchRef = useRef<{
    distance: number;
    scale: number;
    contentX: number;
    contentY: number;
  } | null>(null);
  const panRef = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null);
  const panActiveRef = useRef(false);
  const lastTapRef = useRef(0);
  const [zoom, setZoom] = useState<ChartZoom>({ scale: 1, x: 0, y: 0 });
  const [gesturing, setGesturing] = useState(false);

  const resetZoom = useCallback(() => {
    zoomRef.current = { scale: 1, x: 0, y: 0 };
    setZoom({ scale: 1, x: 0, y: 0 });
  }, []);

  useEffect(() => {
    if (!enabled) resetZoom();
  }, [enabled, resetZoom]);

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

  useEffect(() => {
    if (!enabled) return;
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
      const target = e.target as HTMLElement | null;
      if (target?.closest("button")) return;

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
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && pinchRef.current) {
        e.preventDefault();
        const a = e.touches[0]!;
        const b = e.touches[1]!;
        const mid = localPoint(touchMidpoint(a, b).x, touchMidpoint(a, b).y);
        const dist = touchDistance(a, b);
        const p = pinchRef.current;
        const scale = clampZoom(p.scale * (dist / p.distance));
        applyZoom(
          {
            scale,
            x: mid.x - p.contentX * scale,
            y: mid.y - p.contentY * scale,
          },
        );
        return;
      }

      if (e.touches.length === 1 && panRef.current && zoomRef.current.scale > 1.02) {
        const t = e.touches[0]!;
        const dx = t.clientX - panRef.current.x;
        const dy = t.clientY - panRef.current.y;
        if (!panActiveRef.current && Math.hypot(dx, dy) < 8) return;
        e.preventDefault();
        if (!panActiveRef.current) {
          panActiveRef.current = true;
          setGesturing(true);
        }
        applyZoom({
          scale: zoomRef.current.scale,
          x: panRef.current.tx + dx,
          y: panRef.current.ty + dy,
        });
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      const didPan = panActiveRef.current;
      pinchRef.current = null;
      panRef.current = null;
      panActiveRef.current = false;
      setGesturing(false);

      if (e.touches.length > 0 || didPan) return;
      const now = Date.now();
      if (now - lastTapRef.current < 320) {
        if (zoomRef.current.scale > 1.05) resetZoom();
        else {
          const t = e.changedTouches[0];
          if (t) {
            const pt = localPoint(t.clientX, t.clientY);
            applyZoom(
              { ...zoomRef.current, scale: DOUBLE_TAP_ZOOM },
              pt,
            );
          }
        }
        lastTapRef.current = 0;
      } else {
        lastTapRef.current = now;
      }
    };

    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0 || zoomRef.current.scale <= 1.02) return;
      e.preventDefault();
      panRef.current = {
        x: e.clientX,
        y: e.clientY,
        tx: zoomRef.current.x,
        ty: zoomRef.current.y,
      };
      panActiveRef.current = false;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!panRef.current || zoomRef.current.scale <= 1.02) return;
      const dx = e.clientX - panRef.current.x;
      const dy = e.clientY - panRef.current.y;
      if (!panActiveRef.current && Math.hypot(dx, dy) < 6) return;
      e.preventDefault();
      if (!panActiveRef.current) {
        panActiveRef.current = true;
        setGesturing(true);
      }
      applyZoom({
        scale: zoomRef.current.scale,
        x: panRef.current.tx + dx,
        y: panRef.current.ty + dy,
      });
    };

    const onMouseUp = () => {
      panRef.current = null;
      panActiveRef.current = false;
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
  }, [enabled, applyZoom, resetZoom]);

  return {
    viewportRef,
    zoom,
    gesturing,
    zoomAtCenter,
    resetZoom,
    zoomed: zoom.scale > 1.02,
  };
}

function ChartZoomControls({
  t,
  zoom,
  zoomed,
  onZoomIn,
  onZoomOut,
  onReset,
}: {
  t: (key: string) => string;
  zoom: ChartZoom;
  zoomed: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}) {
  return (
    <div className="inline-flex items-center overflow-hidden rounded-lg border border-border/80 bg-muted/30 shadow-sm">
      <button
        type="button"
        className="flex h-8 w-8 items-center justify-center text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground disabled:opacity-40"
        aria-label={t("report_timeline_zoom_out")}
        disabled={zoom.scale <= MIN_ZOOM}
        onClick={onZoomOut}
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <span className="min-w-[2.5rem] border-x border-border/60 px-1 text-center text-[11px] font-semibold tabular-nums text-foreground/80">
        {`${Number.isInteger(zoom.scale) ? zoom.scale.toFixed(0) : zoom.scale.toFixed(1)}×`}
      </span>
      <button
        type="button"
        className="flex h-8 w-8 items-center justify-center text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground disabled:opacity-40"
        aria-label={t("report_timeline_zoom_in")}
        disabled={zoom.scale >= MAX_ZOOM}
        onClick={onZoomIn}
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        className="flex h-8 w-8 items-center justify-center border-l border-border/60 text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground disabled:opacity-40"
        aria-label={t("report_timeline_zoom_reset")}
        disabled={!zoomed}
        onClick={onReset}
      >
        <RotateCcw className="h-3.5 w-3.5" />
      </button>
    </div>
  );
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

function formatKmAxis(km: number): string {
  if (km <= 0) return "0 km";
  if (km >= 1_000_000) {
    const m = km / 1_000_000;
    const value = Number.isInteger(m) ? `${m}M` : `${m.toFixed(1)}M`;
    return `${value} km`;
  }
  // Only use "Nk" when the value is an exact thousand — never invent a higher ceiling.
  if (km >= 1000 && km % 1000 === 0) return `${km / 1000}k km`;
  if (km >= 1000) return `${Math.round(km).toLocaleString()} km`;
  return `${Math.round(km)} km`;
}

/** Keep axis labels inside the column (avoid top/bottom crop from -50% translate). */
function yAxisLabelStyle(topPct: number, index: number, total: number): CSSProperties {
  if (index === total - 1) {
    // max km — top of chart
    return { top: `${Math.max(topPct, 0)}%`, transform: "translateY(0)" };
  }
  if (index === 0) {
    // 0 km — baseline
    return { top: `${Math.min(topPct, 100)}%`, transform: "translateY(-100%)" };
  }
  return { top: `${topPct}%`, transform: "translateY(-50%)" };
}

function xOf(sortKey: number, min: number, span: number): number {
  if (span <= 0) return (PAD.l + VIEW_W - PAD.r) / 2;
  return PAD.l + ((sortKey - min) / span) * (VIEW_W - PAD.l - PAD.r);
}

function yOf(km: number, maxKm: number): number {
  const t = maxKm <= 0 ? 0 : Math.min(1, Math.max(0, km / maxKm));
  return PAD.t + (1 - t) * (VIEW_H - PAD.t - PAD.b);
}

/** Straight segments between mileage points. */
function smoothLinePath(pts: { x: number; y: number }[]): string {
  if (pts.length === 0) return "";
  if (pts.length === 1) return `M ${pts[0]!.x.toFixed(1)} ${pts[0]!.y.toFixed(1)}`;
  return pts
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");
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

/**
 * Merge day-markers only when their dates sit almost on top of each other on the
 * time axis (visual overlap at default zoom). Zooming in shrinks the gap so they split.
 */
const PROXIMITY_X_THRESHOLD = 18;

type PlotMarker = {
  id: string;
  events: TimelineEvent[];
  leftPct: number;
  topPct: number;
  x: number;
  y: number;
};

function mergeMarkersByProximity(markers: PlotMarker[], zoomScale: number): PlotMarker[] {
  if (markers.length <= 1) return markers;
  const threshold = PROXIMITY_X_THRESHOLD / Math.max(zoomScale, 0.01);
  const sorted = [...markers].sort((a, b) => a.x - b.x || a.y - b.y || a.id.localeCompare(b.id));
  const groups: PlotMarker[][] = [[sorted[0]!]];

  for (let i = 1; i < sorted.length; i++) {
    const marker = sorted[i]!;
    const group = groups[groups.length - 1]!;
    const prev = group[group.length - 1]!;
    if (marker.x - prev.x < threshold) group.push(marker);
    else groups.push([marker]);
  }

  return groups.map((group) => {
    if (group.length === 1) return group[0]!;

    const events = group
      .flatMap((g) => g.events)
      .sort(
        (a, b) =>
          a.sortKey - b.sortKey ||
          MARKER_TYPE_ORDER.indexOf(a.type) - MARKER_TYPE_ORDER.indexOf(b.type) ||
          a.id.localeCompare(b.id),
      );
    const x = group.reduce((sum, g) => sum + g.x, 0) / group.length;
    const y = group.reduce((sum, g) => sum + g.y, 0) / group.length;
    return {
      id: group
        .map((g) => g.id)
        .sort()
        .join("~"),
      events,
      x,
      y,
      leftPct: (x / VIEW_W) * 100,
      topPct: (y / VIEW_H) * 100,
    };
  });
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
  zoomScale = 1,
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
  zoomScale?: number;
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

  const dayGroups = (() => {
    const map = new Map<string, TimelineEvent[]>();
    for (const event of events) {
      const list = map.get(event.dayKey);
      if (list) list.push(event);
      else map.set(event.dayKey, [event]);
    }
    return [...map.entries()]
      .map(([dayKey, dayEvents]) => ({
        dayKey,
        events: dayEvents,
        sortKey: Math.min(...dayEvents.map((e) => e.sortKey)),
      }))
      .sort((a, b) => a.sortKey - b.sortKey);
  })();

  const types = clusterTypes(events);
  const multiDay = dayGroups.length > 1;
  const clustered = multiDay || types.length > 1;
  const bubbleCount = multiDay ? dayGroups.length : types.length;
  const recordedKm = clusterRecordedKm(events);
  const markerType = types[0] ?? primary.type;

  const formatDayLabel = (dayEvents: TimelineEvent[]) => {
    const lead = dayEvents[0]!;
    if (lead.type === "production" && lead.productionYear) return String(lead.productionYear);
    return localizeProviderDate(lead.date, language, vehicleYear, vehicleCountry) ?? lead.dayKey;
  };

  const resolveMileageTitle = (dayEvents: TimelineEvent[]): string | null => {
    for (const event of dayEvents) {
      if (event.type !== "mileage") continue;
      const raw = event.titleStatus?.trim() || event.title?.trim();
      if (!raw) continue;
      return translateTitleStatus(t, raw) ?? raw;
    }
    return null;
  };

  const dateLabel = multiDay
    ? t("registry_events_count").replace("{count}", String(dayGroups.length))
    : formatDayLabel(dayGroups[0]?.events ?? events);

  const mileageTitleLabel = multiDay ? null : resolveMileageTitle(events);
  const headline =
    mileageTitleLabel
    || (!multiDay && !clustered ? t(TYPE_LABEL_KEY[markerType]) : null)
    || (!multiDay && types.length === 1 ? t(TYPE_LABEL_KEY[types[0]!]) : null);

  const kmShort = recordedKm > 0 ? `${recordedKm.toLocaleString()} km` : null;
  const typeLabels = types.map((type) => t(TYPE_LABEL_KEY[type]));

  const buildSections = (dayEvents: TimelineEvent[], hideMileageType: boolean) => {
    const dayTypes = clusterTypes(dayEvents);
    const seenFacts = new Set<string>();
    const dayKm = clusterRecordedKm(dayEvents);
    const dayKmFact = dayKm > 0 ? formatKmFact(dayKm, t) : null;
    const dayTitle = resolveMileageTitle(dayEvents);
    return dayTypes.flatMap((type) => {
      if (hideMileageType && type === "mileage") return [];
      const group = dayEvents.filter((e) => e.type === type);
      let facts = [...new Set(group.flatMap((e) => eventFacts(e, t, language, vehicleCountry, krwPerUsd)))];
      if (dayKmFact) facts = facts.filter((fact) => fact !== dayKmFact);
      if (dayKm > 0) {
        const prefix = `${dayKm.toLocaleString()} km`;
        facts = facts.filter((fact) => fact !== prefix && !fact.startsWith(`${prefix} `));
      }
      if (dayTitle) facts = facts.filter((fact) => fact !== dayTitle);
      if (type !== "owner") {
        facts = facts.filter((fact) => {
          if (seenFacts.has(fact)) return false;
          seenFacts.add(fact);
          return true;
        });
      }
      facts = facts.slice(0, 8);
      if (hideMileageType && facts.length === 0) return [];
      return [{ type, label: t(TYPE_LABEL_KEY[type]), facts }];
    });
  };

  const singleDaySections = !multiDay ? buildSections(events, false) : [];
  const showSectionLabels = multiDay || singleDaySections.length > 1;
  const bodySections = !multiDay
    ? singleDaySections
        .map((section) => {
          if (section.type === "mileage" && mileageTitleLabel) {
            return {
              ...section,
              facts: section.facts.filter((fact) => fact !== mileageTitleLabel),
            };
          }
          return section;
        })
        .filter((section) => section.facts.length > 0 || (showSectionLabels && section.type !== "mileage"))
    : [];

  const accident = !clustered && types.includes("accident");
  const inverse = 1 / Math.max(zoomScale, 0.01);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={[headline, dateLabel, kmShort].filter(Boolean).join(", ")}
          className={cn(
            "absolute z-[1] group flex h-12 w-12 items-center justify-center rounded-full sm:h-10 sm:w-10",
            "touch-manipulation outline-none focus-visible:ring-2 focus-visible:ring-primary/45 focus-visible:ring-offset-1",
            open && "z-[5]",
            !interactive && "pointer-events-none",
          )}
          style={{
            left: `${leftPct}%`,
            top: `${topPct}%`,
            transform: `translate(-50%, -50%) scale(${inverse})`,
          }}
          onPointerDown={(e) => {
            e.stopPropagation();
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
              "relative flex items-center justify-center rounded-full shadow-[0_1px_2px_rgba(15,23,42,0.2)]",
              "ring-2 ring-background transition-transform duration-150 sm:ring-[2.5px]",
              open ? "scale-110" : "group-hover:scale-105",
              clustered
                ? "h-5 w-5 sm:h-6 sm:w-6 bg-primary"
                : accident
                  ? "h-3 w-3 sm:h-4 sm:w-4"
                  : markerType === "production"
                    ? "h-2 w-2 sm:h-3 sm:w-3 ring-slate-400/80 dark:ring-slate-500"
                    : "h-2.5 w-2.5 sm:h-3.5 sm:w-3.5",
              !clustered && TYPE_DOT[markerType],
            )}
          >
            {clustered ? (
              <span className="text-[9px] font-bold leading-none tabular-nums text-primary-foreground sm:text-[10px]">
                {bubbleCount}
              </span>
            ) : null}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="center"
        sideOffset={10}
        collisionPadding={16}
        className="z-[80] w-[min(20rem,calc(100vw-1.25rem))] max-h-[min(22rem,72vh)] overflow-y-auto rounded-xl border border-border/70 p-0 pb-1 shadow-lg"
        onPointerEnter={(e) => {
          if (e.pointerType === "mouse") openNow();
        }}
        onPointerLeave={(e) => {
          if (e.pointerType === "mouse") closeSoon();
        }}
      >
        <div className="space-y-2.5 border-b border-border/50 bg-muted/25 px-4 py-3.5">
          <span className="inline-flex items-center rounded-full bg-background px-2.5 py-0.5 text-[11px] font-semibold tabular-nums tracking-wide text-foreground/80 shadow-sm ring-1 ring-border/70">
            {dateLabel}
          </span>
          {headline ? (
            <p className="text-[15px] font-semibold leading-snug text-foreground">{headline}</p>
          ) : clustered ? (
            <p className="text-[13px] font-medium leading-snug text-foreground/85">{typeLabels.join(" · ")}</p>
          ) : null}
          {kmShort && !multiDay ? (
            <p className="inline-flex items-center rounded-md bg-background/90 px-2 py-0.5 text-[12px] font-semibold tabular-nums text-foreground shadow-sm ring-1 ring-border/60">
              {kmShort}
            </p>
          ) : null}
        </div>

        {multiDay ? (
          <div className="divide-y divide-border/50 pb-2">
            {dayGroups.map((day) => {
              const sections = buildSections(day.events, false)
                .map((section) => {
                  const dayTitle = resolveMileageTitle(day.events);
                  if (section.type === "mileage" && dayTitle) {
                    return { ...section, facts: section.facts.filter((fact) => fact !== dayTitle) };
                  }
                  return section;
                })
                .filter((section) => section.facts.length > 0 || section.type !== "mileage");
              const dayKm = clusterRecordedKm(day.events);
              const dayKmShort = dayKm > 0 ? `${dayKm.toLocaleString()} km` : null;
              const dayTitle = resolveMileageTitle(day.events);
              const dayHeadline = dayTitle
                || (sections.length === 1 ? sections[0]!.label : null);
              return (
                <div key={day.dayKey} className="space-y-2.5 px-4 py-3.5 last:pb-5">
                  <div className="space-y-1.5">
                    <span className="inline-flex items-center rounded-full bg-muted/70 px-2.5 py-0.5 text-[11px] font-semibold tabular-nums tracking-wide text-foreground/80 ring-1 ring-border/60">
                      {formatDayLabel(day.events)}
                    </span>
                    {dayHeadline ? (
                      <p className="text-[13px] font-semibold leading-snug text-foreground">{dayHeadline}</p>
                    ) : null}
                    {dayKmShort ? (
                      <p className="inline-flex rounded-md bg-muted/60 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-foreground/90">
                        {dayKmShort}
                      </p>
                    ) : null}
                  </div>
                  {sections.length > 0 ? (
                    <div className={cn(sections.length > 1 ? "space-y-2.5" : "")}>
                      {sections.map((section) => (
                        <div key={`${day.dayKey}-${section.type}`}>
                          {(sections.length > 1 || !dayHeadline) ? (
                            <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
                              <span className={cn("h-1.5 w-1.5 rounded-full", TYPE_DOT[section.type])} />
                              {section.label}
                            </p>
                          ) : null}
                          {section.facts.length > 0 ? (
                            <ul className={cn("space-y-1 text-[13px] leading-snug text-foreground/85", (sections.length > 1 || !dayHeadline) && "mt-1")}>
                              {section.facts.map((fact) => (
                                <li key={fact}>{fact}</li>
                              ))}
                            </ul>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : bodySections.length > 0 ? (
          <div className={cn("px-4 pt-3.5 pb-5", bodySections.length > 1 ? "space-y-3" : "")}>
            {bodySections.map((section) => (
              <div key={section.type}>
                {showSectionLabels ? (
                  <p className="mb-1 inline-flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
                    <span className={cn("h-1.5 w-1.5 rounded-full", TYPE_DOT[section.type])} />
                    {section.label}
                  </p>
                ) : null}
                {section.facts.length > 0 ? (
                  <ul className="space-y-1 text-[13px] leading-snug text-foreground/85">
                    {section.facts.map((fact) => (
                      <li key={fact}>{fact}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <div className="pb-3" aria-hidden />
        )}
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
  const chartZoom = useChartZoom(true);
  const { resetZoom, ...chartZoomUi } = chartZoom;

  const layout = useMemo(() => {
    if (events.length === 0) return null;
    const min = events[0]!.sortKey;
    const max = events[events.length - 1]!.sortKey;
    const span = Math.max(0, max - min);
    const series = buildMileageSeries(events);
    const maxKm = Math.max(0, ...series.map((p) => p.km), ...events.map((e) => e.mileage ?? 0));
    const axisMax = maxKm > 0 ? maxKm : 1;

    const startYear = Number(events[0]!.dayKey.slice(0, 4));
    const endYear = Number(events[events.length - 1]!.dayKey.slice(0, 4));
    const years = pickYears(startYear, endYear, 5).map((year) => ({
      year,
      leftPct: (xOf(historyDateSortKey(`${year}-01-01`), min, span) / VIEW_W) * 100,
    }));

    const yTicks = [0, axisMax / 2, axisMax].map((km) => ({
      km,
      topPct: (yOf(km, axisMax) / VIEW_H) * 100,
    }));
    const baselineY = yOf(0, axisMax);

    const linePts = series.map((p) => ({
      x: xOf(p.sortKey, min, span),
      y: yOf(p.km, axisMax),
      km: p.km,
    }));

    const lineD = smoothLinePath(linePts);
    const areaD =
      linePts.length >= 2
        ? `${lineD} L ${linePts[linePts.length - 1]!.x.toFixed(1)} ${baselineY} L ${linePts[0]!.x.toFixed(1)} ${baselineY} Z`
        : "";

    const markers: PlotMarker[] = clusterTimelineEvents(events)
      .filter(shouldShowTimelineMarkerGroup)
      .map((group) => {
        const lead = group[0]!;
        const km =
          Math.max(0, ...group.map((e) => (e.mileage != null && e.mileage > 0 ? e.mileage : 0)))
          || interpolateKm(lead.sortKey, series);
        const x = Math.min(VIEW_W - PAD.r, Math.max(PAD.l, xOf(lead.sortKey, min, span)));
        const y = yOf(km, axisMax);
        return {
          id: group.map((e) => e.id).join("+"),
          events: group,
          x,
          y,
          leftPct: (x / VIEW_W) * 100,
          topPct: (y / VIEW_H) * 100,
        };
      });

    return {
      maxKm: axisMax,
      years,
      yTicks,
      baselineY,
      lineD,
      areaD,
      markers,
    };
  }, [events]);

  const displayMarkers = useMemo(
    () => (layout ? mergeMarkersByProximity(layout.markers, chartZoomUi.zoom.scale) : []),
    [layout, chartZoomUi.zoom.scale],
  );

  if (!layout || events.length === 0) return null;

  const presentTypes = TIMELINE_EVENT_TYPES.filter(
    (type) => type !== "mileage" && type !== "production" && events.some((e) => e.type === type),
  );

  const renderChart = (opts: {
    gradientId: string;
    heightClass: string;
    labelClass?: string;
    fillHeight?: boolean;
    zoom?: {
      viewportRef: RefObject<HTMLDivElement | null>;
      zoom: ChartZoom;
      gesturing: boolean;
      interactive: boolean;
    };
  }) => {
    const zoomScale = opts.zoom?.zoom.scale ?? 1;
    const chartBody = (
      <>
        <div className={cn("relative min-w-0 w-full overflow-visible", opts.fillHeight && "h-full min-h-0")}>
          <svg
            viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
            className={cn("block w-full max-w-full", opts.heightClass)}
            preserveAspectRatio="none"
            role="img"
            aria-hidden
          >
            <defs>
              <linearGradient id={opts.gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.22" />
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
                className="stroke-border/80"
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
              className="stroke-foreground/25"
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
                  className="stroke-foreground/30"
                  strokeWidth="1"
                  vectorEffect="non-scaling-stroke"
                />
              );
            })}

            {layout.areaD ? <path d={layout.areaD} fill={`url(#${opts.gradientId})`} /> : null}
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

          <div className="pointer-events-none absolute inset-0" aria-hidden>
            {layout.yTicks.map((tick, i) => (
              <span
                key={tick.km}
                className={cn(
                  "absolute left-1 rounded-sm bg-background/85 px-1 py-0.5 text-[10px] font-semibold tabular-nums leading-none tracking-tight text-foreground/80 shadow-sm backdrop-blur-[2px] sm:left-2 sm:px-1.5 sm:text-xs sm:text-foreground/85",
                  opts.labelClass,
                )}
                style={yAxisLabelStyle(tick.topPct, i, layout.yTicks.length)}
              >
                {formatKmAxis(tick.km)}
              </span>
            ))}
          </div>

          {displayMarkers.map((m) => (
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
              interactive={opts.zoom?.interactive ?? true}
              zoomScale={zoomScale}
            />
          ))}
        </div>

        <div className="relative h-6 min-w-0 w-full shrink-0 overflow-visible sm:h-6">
          {layout.years.map(({ year, leftPct }, i) => {
            const align =
              i === 0
                ? "translate-x-0"
                : i === layout.years.length - 1
                  ? "-translate-x-full"
                  : "-translate-x-1/2";
            return (
              <span
                key={year}
                className={cn(
                  "absolute top-1 text-[10px] font-medium tabular-nums leading-none text-foreground/65 sm:text-xs",
                  align,
                )}
                style={{ left: `${leftPct}%` }}
              >
                {year}
              </span>
            );
          })}
        </div>
      </>
    );

    if (!opts.zoom) return chartBody;

    const zoomed = opts.zoom.zoom.scale > 1.02;
    return (
      <div
        ref={opts.zoom.viewportRef}
        className={cn(
          "min-h-0 overflow-hidden overscroll-contain select-none rounded-md",
          opts.fillHeight ? "h-full flex-1" : "",
          opts.zoom.gesturing || zoomed ? "touch-none" : "touch-pan-y",
          zoomed && "cursor-grab",
          opts.zoom.gesturing && zoomed && "cursor-grabbing",
        )}
      >
        <div
          className={cn("origin-top-left will-change-transform", opts.fillHeight && "h-full min-h-0 flex flex-col")}
          style={{
            transform: `translate(${opts.zoom.zoom.x}px, ${opts.zoom.zoom.y}px) scale(${opts.zoom.zoom.scale})`,
            transition: opts.zoom.gesturing ? "none" : "transform 140ms ease-out",
          }}
        >
          {chartBody}
        </div>
      </div>
    );
  };

  const legend = presentTypes.length > 0 ? (
    <ul className="flex flex-wrap gap-x-3.5 gap-y-2 border-t border-border/60 bg-muted/20 px-3 py-2.5 sm:gap-x-5 sm:px-5 sm:py-3">
      {presentTypes.map((type) => (
        <li
          key={type}
          className="inline-flex items-center gap-1.5 text-[11px] font-medium text-foreground/70 sm:text-xs"
        >
          <span className={cn("h-2 w-2 shrink-0 rounded-full ring-2 ring-background shadow-sm", TYPE_DOT[type])} />
          {t(TYPE_LABEL_KEY[type])}
        </li>
      ))}
    </ul>
  ) : null;

  return (
    <section
      className={cn(
        "print:hidden max-w-full min-w-0 overflow-x-hidden vin-report-section--decorated",
        VIN_REPORT_SECTION_SURFACE,
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3 border-b border-border/50 px-3 py-2.5 sm:px-5 sm:py-3 bg-primary/[0.03]">
        <h2 className="text-sm font-semibold tracking-tight text-foreground">
          {t("report_timeline_title")}
        </h2>
        <ChartZoomControls
          t={t}
          zoom={chartZoomUi.zoom}
          zoomed={chartZoomUi.zoomed}
          onZoomIn={() => chartZoomUi.zoomAtCenter(ZOOM_FACTOR)}
          onZoomOut={() => chartZoomUi.zoomAtCenter(1 / ZOOM_FACTOR)}
          onReset={resetZoom}
        />
      </div>

      <div className="w-full min-w-0 px-1.5 pb-2 pt-2 sm:px-3 sm:pb-3 sm:pt-3">
        {renderChart({
          gradientId: fillId,
          heightClass: "h-[14rem] sm:h-[17rem] lg:h-[19rem]",
          zoom: {
            viewportRef: chartZoomUi.viewportRef,
            zoom: chartZoomUi.zoom,
            gesturing: chartZoomUi.gesturing,
            interactive: !chartZoomUi.gesturing,
          },
        })}
      </div>

      {legend}
    </section>
  );
}
