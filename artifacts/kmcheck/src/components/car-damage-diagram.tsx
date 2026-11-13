import { useEffect, useId, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  DAMAGE_SEVERITY_META,
  normalizeDamagePartLabel,
  parseCarDamageFromRepairExtras,
  type CarDamageHit,
  type CarDamageZoneId,
  type DamageSeverity,
} from "@/lib/car-damage-zones";

type ExtraLike = {
  key?: string | null;
  label?: string | null;
  value?: string | null;
};

type Props = {
  extras: ExtraLike[];
  t: (key: string) => string;
  className?: string;
  /** Tighter layout for homepage / marketing report previews. */
  compact?: boolean;
};

/** Panel ids from the Car History / KIDI multi-view body map. */
const ZONE_PANELS: Record<CarDamageZoneId, string[]> = {
  front_bumper: ["p01"],
  grille: ["p20"],
  hood: ["p03"],
  front_fender_l: ["p10"],
  front_fender_r: ["p11"],
  front_door_l: ["p06"],
  front_door_r: ["p07"],
  rear_door_l: ["p08"],
  rear_door_r: ["p09"],
  rear_fender_l: ["p12"],
  rear_fender_r: ["p13"],
  side_sill_l: ["p25"],
  side_sill_r: ["p26"],
  rear_bumper: ["p02"],
  trunk: ["p04", "p05"],
  roof: ["p16", "p15"],
  glass: ["p14", "p19"],
};

const PANEL_TO_ZONE: Record<string, CarDamageZoneId> = Object.fromEntries(
  (Object.entries(ZONE_PANELS) as [CarDamageZoneId, string[]][]).flatMap(([zone, ids]) =>
    ids.map((id) => [id, zone]),
  ),
) as Record<string, CarDamageZoneId>;

function hatchClass(sev: DamageSeverity): string {
  if (sev === "paint") return "st4";
  if (sev === "repair") return "st3"; // red
  if (sev === "replace") return "st2"; // blue
  return "st6"; // sheet_metal
}

function severityLabelKey(sev: DamageSeverity): string {
  return DAMAGE_SEVERITY_META[sev].titleKey;
}

function shortPartLabel(label: string): string {
  return normalizeDamagePartLabel(label)
    .replace(/\s*\([^)]*\)\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function markerFill(sev: DamageSeverity): string {
  return DAMAGE_SEVERITY_META[sev].hatch;
}

function setPanelHatch(el: Element, sev: DamageSeverity | null, active: boolean) {
  const cls = el.getAttribute("class") ?? "";
  const rest = cls
    .replace(/\bst[2-6]\b/g, "")
    .replace(/\bkm-active\b/g, "")
    .trim();
  const hatch = sev ? hatchClass(sev) : "st5";
  const activeCls = active ? "km-active" : "";
  el.setAttribute("class", `${hatch} ${activeCls} ${rest}`.trim());
  if (el instanceof SVGElement) {
    el.style.cursor = sev ? "pointer" : "";
    // Clear any prior inline stroke so CSS .km-active can win
    el.style.stroke = "";
    el.style.strokeWidth = "";
    el.style.filter = "";
  }
}

function elementCenter(el: SVGGraphicsElement): { x: number; y: number } | null {
  try {
    const box = el.getBBox();
    if (!box.width && !box.height) return null;
    return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  } catch {
    return null;
  }
}

export function CarDamageDiagram({ extras, t, className, compact = false }: Props) {
  const uid = useId().replace(/:/g, "");
  const hostRef = useRef<HTMLDivElement>(null);
  const [svgLoaded, setSvgLoaded] = useState(false);

  const hits = useMemo(() => parseCarDamageFromRepairExtras(extras), [extras]);
  const byZone = useMemo(() => {
    const map = new Map<CarDamageZoneId, CarDamageHit>();
    for (const hit of hits) map.set(hit.zone, hit);
    return map;
  }, [hits]);

  const [active, setActive] = useState<CarDamageZoneId | null>(null);
  const activeZone = active && byZone.has(active) ? active : (hits[0]?.zone ?? null);
  const activeHit = activeZone ? byZone.get(activeZone) ?? null : null;

  // Load the multi-view body map once
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/damage-diagram/body-map.svg");
        if (!res.ok) return;
        let markup = await res.text();
        // Scope pattern ids so multiple instances don't clash
        markup = markup
          .replace(/\bid="(redHatch|blueHatch|YellowHatch|sheetHatch)"/g, `id="${uid}-$1"`)
          .replace(/url\(#(redHatch|blueHatch|YellowHatch|sheetHatch)\)/g, `url(#${uid}-$1)`);
        if (cancelled || !hostRef.current) return;
        hostRef.current.innerHTML = markup;
        const svg = hostRef.current.querySelector("svg");
        if (svg) {
          svg.setAttribute("role", "img");
          svg.setAttribute("aria-label", t("damage_diagram_aria"));
          svg.classList.add("w-full", "h-auto", "block");
        }
        setSvgLoaded(true);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [uid, t]);

  // Apply hatch fills, markers, and click handlers when hits / active change
  useEffect(() => {
    if (!svgLoaded || !hostRef.current) return;
    const root = hostRef.current;
    const svg = root.querySelector("svg");
    if (!svg) return;

    // Reset all known panels to transparent (outline only)
    for (const ids of Object.values(ZONE_PANELS)) {
      for (const id of ids) {
        const el = svg.querySelector(`#${id}`);
        if (el) setPanelHatch(el, null, false);
      }
    }

    // Apply damage
    for (const hit of hits) {
      for (const id of ZONE_PANELS[hit.zone]) {
        const el = svg.querySelector(`#${id}`);
        if (el) setPanelHatch(el, hit.severity, activeZone === hit.zone);
      }
    }

    // Markers layer
    let markers = svg.querySelector("#km-damage-markers") as SVGGElement | null;
    if (!markers) {
      markers = document.createElementNS("http://www.w3.org/2000/svg", "g");
      markers.setAttribute("id", "km-damage-markers");
      markers.setAttribute("pointer-events", "none");
      svg.appendChild(markers);
    }
    markers.replaceChildren();

    for (const hit of hits) {
      const primaryId = ZONE_PANELS[hit.zone][0];
      const el = svg.querySelector(`#${primaryId}`);
      if (!(el instanceof SVGGraphicsElement)) continue;
      const pt = elementCenter(el);
      if (!pt) continue;
      const selected = activeZone === hit.zone;
      const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
      if (selected) {
        const ring = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        ring.setAttribute("cx", String(pt.x));
        ring.setAttribute("cy", String(pt.y));
        ring.setAttribute("r", "18");
        ring.setAttribute("fill", "none");
        ring.setAttribute("stroke", markerFill(hit.severity));
        ring.setAttribute("stroke-width", "3");
        ring.setAttribute("opacity", "0.9");
        g.appendChild(ring);
      }
      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("cx", String(pt.x));
      circle.setAttribute("cy", String(pt.y));
      circle.setAttribute("r", selected ? "14" : "12");
      circle.setAttribute("fill", markerFill(hit.severity));
      circle.setAttribute("stroke", "#fff");
      circle.setAttribute("stroke-width", selected ? "2.2" : "1.5");
      g.appendChild(circle);

      if (hit.severity === "paint") {
        const brush = document.createElementNS("http://www.w3.org/2000/svg", "path");
        brush.setAttribute(
          "d",
          `M${pt.x - 4} ${pt.y + 3} l3 -8 2 1 -3 8 z M${pt.x - 1} ${pt.y - 5} l4 -2`,
        );
        brush.setAttribute("fill", "#fff");
        brush.setAttribute("stroke", "#fff");
        brush.setAttribute("stroke-width", "0.8");
        g.appendChild(brush);
      } else {
        const wrench = document.createElementNS("http://www.w3.org/2000/svg", "path");
        wrench.setAttribute(
          "d",
          `M${pt.x - 5} ${pt.y + 4} L${pt.x + 4} ${pt.y - 5} M${pt.x + 2} ${pt.y - 6} l3 3 M${pt.x - 6} ${pt.y + 2} l3 3`,
        );
        wrench.setAttribute("fill", "none");
        wrench.setAttribute("stroke", "#fff");
        wrench.setAttribute("stroke-width", "1.6");
        wrench.setAttribute("stroke-linecap", "round");
        g.appendChild(wrench);
      }
      markers.appendChild(g);
    }

    const onClick = (e: Event) => {
      const target = e.target as Element | null;
      if (!target) return;
      const panel = target.closest("[id^='p']");
      if (!panel) return;
      const zone = PANEL_TO_ZONE[panel.id];
      if (zone && byZone.has(zone)) setActive(zone);
    };
    const onMove = (e: Event) => {
      const target = e.target as Element | null;
      if (!target) return;
      const panel = target.closest("[id^='p']");
      if (!panel) return;
      const zone = PANEL_TO_ZONE[panel.id];
      if (zone && byZone.has(zone)) setActive(zone);
    };

    svg.addEventListener("click", onClick);
    svg.addEventListener("mousemove", onMove);
    return () => {
      svg.removeEventListener("click", onClick);
      svg.removeEventListener("mousemove", onMove);
    };
  }, [svgLoaded, hits, byZone, activeZone]);

  if (!hits.length) return null;

  const usedSeverities = [...new Set(hits.map((h) => h.severity))];

  return (
    <div
      className={cn(
        "rounded-xl border border-border/70 bg-white dark:bg-transparent",
        compact ? "p-2.5 sm:p-3" : "p-3 sm:p-4",
        className,
      )}
    >
      <div className={cn("flex flex-col", compact ? "gap-2.5" : "gap-4")}>
        <div>
          <p className={cn("font-semibold text-foreground", compact ? "text-xs" : "text-sm")}>
            {compact ? t("wwc_demo_accident_map") : t("damage_diagram_title")}
          </p>
          {!compact ? (
            <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{t("damage_diagram_note")}</p>
          ) : null}
        </div>

        <div className="w-full">
          <div
            ref={hostRef}
            className={cn(
              "w-full [&_svg]:w-full [&_svg]:h-auto",
              compact && "max-h-[220px] overflow-hidden [&_svg]:max-h-[220px] [&_svg]:object-contain",
              // Night mode: car skeleton outline light grey/white (SVG defaults to black).
              "dark:[&_svg_.st1]:![stroke:#e2e8f0]",
              "dark:[&_svg_.km-active]:![stroke:#f8fafc]",
              "dark:[&_svg_.km-active]:![filter:drop-shadow(0_0_3px_rgba(248,250,252,0.45))]",
            )}
          />
          {!svgLoaded ? (
            <div
              className={cn(
                "w-full animate-pulse rounded-md bg-slate-100 dark:bg-slate-800",
                compact ? "h-[180px]" : "aspect-[706/889]",
              )}
            />
          ) : null}

          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 justify-center px-1">
            {usedSeverities.map((sev) => {
              const meta = DAMAGE_SEVERITY_META[sev];
              const angle = sev === "repair" || sev === "sheet_metal" ? 45 : -45;
              return (
                <div key={sev} className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300">
                  <svg width="34" height="14" className="border border-slate-300 dark:border-slate-600 overflow-hidden">
                    <defs>
                      <pattern
                        id={`${uid}-leg-${sev}`}
                        patternUnits="userSpaceOnUse"
                        width="9"
                        height="9"
                        patternTransform={`rotate(${angle})`}
                      >
                        <rect width="9" height="9" fill={sev === "replace" ? "#f0f9ff" : sev === "repair" ? "#fff5f5" : sev === "paint" ? "#fefce8" : "#fff1f2"} />
                        <path d="M0 4.5 H9" stroke={meta.hatch} strokeWidth="2.4" />
                      </pattern>
                    </defs>
                    <rect width="34" height="14" fill={`url(#${uid}-leg-${sev})`} />
                  </svg>
                  <span>{t(severityLabelKey(sev))}</span>
                </div>
              );
            })}
          </div>
        </div>

        {!compact ? (
          <div className="w-full space-y-2.5">
            <div className="rounded-lg border border-border/60 overflow-hidden">
              <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border-b border-border/50 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                {t("damage_diagram_repair_zones")}
              </div>
              <ul className="divide-y divide-border/40 max-h-[280px] sm:max-h-none overflow-y-auto">
                {hits.map((hit) => {
                  const selected = activeZone === hit.zone;
                  const meta = DAMAGE_SEVERITY_META[hit.severity];
                  const angle = hit.severity === "repair" || hit.severity === "sheet_metal" ? 45 : -45;
                  return (
                    <li key={hit.zone}>
                      <button
                        type="button"
                        onClick={() => setActive(hit.zone)}
                        onMouseEnter={() => setActive(hit.zone)}
                        className={cn(
                          "w-full flex items-center gap-2.5 px-3 py-2 text-left border-l-[3px] transition-colors",
                          selected
                            ? "bg-slate-100 dark:bg-slate-800 border-l-slate-900 dark:border-l-white"
                            : "border-l-transparent hover:bg-muted/30",
                        )}
                        style={selected ? { boxShadow: `inset 0 0 0 1px ${meta.stroke}33` } : undefined}
                      >
                        <svg width="28" height="12" className="shrink-0 border border-slate-300 dark:border-slate-600 overflow-hidden">
                          <defs>
                            <pattern
                              id={`${uid}-row-${hit.zone}`}
                              patternUnits="userSpaceOnUse"
                              width="9"
                              height="9"
                              patternTransform={`rotate(${angle})`}
                            >
                              <rect
                                width="9"
                                height="9"
                                fill={
                                  hit.severity === "replace"
                                    ? "#f0f9ff"
                                    : hit.severity === "repair"
                                      ? "#fff5f5"
                                      : hit.severity === "paint"
                                        ? "#fefce8"
                                        : "#fff1f2"
                                }
                              />
                              <path d="M0 4.5 H9" stroke={meta.hatch} strokeWidth="2.4" />
                            </pattern>
                          </defs>
                          <rect width="28" height="12" fill={`url(#${uid}-row-${hit.zone})`} />
                        </svg>
                        <span className="text-[11px] font-medium flex-1 truncate">
                          {t(`damage_zone_${hit.zone}`)}
                        </span>
                        <span
                          className="text-[10px] font-medium shrink-0"
                          style={{ color: meta.stroke }}
                        >
                          {t(severityLabelKey(hit.severity))}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="rounded-lg border border-border/60 px-3 py-2.5 min-h-[5rem] bg-slate-50/80 dark:bg-slate-900/50">
              {activeHit ? (
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold">
                    {t(`damage_zone_${activeHit.zone}`)}
                    <span className="ml-2 text-[10px] font-normal text-muted-foreground">
                      {t(severityLabelKey(activeHit.severity))}
                    </span>
                  </p>
                  <ul className="space-y-0.5">
                    {activeHit.labels.slice(0, 6).map((label) => (
                      <li key={label} className="text-[11px] text-muted-foreground leading-snug">
                        {shortPartLabel(label)}
                      </li>
                    ))}
                    {activeHit.labels.length > 6 ? (
                      <li className="text-[11px] text-muted-foreground/80">
                        +{activeHit.labels.length - 6} {t("damage_diagram_more")}
                      </li>
                    ) : null}
                  </ul>
                </div>
              ) : (
                <p className="text-[11px] text-muted-foreground">{t("damage_diagram_hover")}</p>
              )}
            </div>
          </div>
        ) : (
          <ul className="flex flex-wrap gap-x-3 gap-y-1 px-0.5">
            {hits.map((hit) => (
              <li key={hit.zone} className="text-[10px] font-medium text-muted-foreground">
                <span className="text-foreground">{t(`damage_zone_${hit.zone}`)}</span>
                {" · "}
                {t(severityLabelKey(hit.severity))}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
