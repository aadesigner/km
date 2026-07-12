import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import { useTranslation } from "@/i18n/context";
import { flagUrl } from "@/components/flag-img";
import { cn } from "@/lib/utils";
import { useCoverageMapLivePings } from "@/hooks/use-coverage-map-live-pings";
import { CoverageMapLiveMarkers } from "@/components/coverage-map-live-markers";
import type { MapLivePingRegion } from "@/lib/coverage-live-events";
import {
  ComposableMap,
  Geographies,
  Geography,
  Line,
  Marker,
} from "react-simple-maps";
import worldTopo from "../../public/world-countries-110m.json";

const COVERAGE_NAMES = new Set([
  "United States of America",
  "Canada",
  "South Korea",
  "China",
  "United Arab Emirates",
]);

const MARKERS = [
  { code: "ca" as const, coordinates: [-96, 62] as [number, number], side: "left" as const },
  { code: "us" as const, coordinates: [-98, 39] as [number, number], side: "left" as const },
  { code: "kr" as const, coordinates: [127.5, 36.5] as [number, number], side: "right" as const },
  { code: "cn" as const, coordinates: [104, 35] as [number, number], side: "right" as const },
  { code: "ae" as const, coordinates: [55.3, 25.2] as [number, number], side: "right" as const },
];

const DATA_PULSE_COORDS: [number, number][] = [
  [-122, 38],
  [-95, 33],
  [-108, 44],
  [-112, 54],
  [-78, 48],
  [126, 37],
  [129, 35],
  [125, 39],
  [105, 34],
  [56, 25],
];

const MAP_WIDTH = 1200;
const MAP_HEIGHT = 560;

const SIDE_PROJECTION = {
  left: { scale: 468, center: [-104, 41] as [number, number] },
  right: { scale: 442, center: [102, 34] as [number, number] },
} as const;

function geographyStyle(covered: boolean): Record<string, CSSProperties> {
  return {
    default: {
      fill: covered ? "hsl(var(--primary) / 0.68)" : "hsl(var(--muted-foreground) / 0.14)",
      stroke: covered ? "hsl(var(--primary) / 0.9)" : "hsl(var(--border) / 0.48)",
      strokeWidth: covered ? 1.2 : 0.5,
      outline: "none",
    },
    hover: {
      fill: covered ? "hsl(var(--primary) / 0.68)" : "hsl(var(--muted-foreground) / 0.12)",
      stroke: covered ? "hsl(var(--primary) / 0.9)" : "hsl(var(--border) / 0.48)",
      outline: "none",
    },
    pressed: { outline: "none" },
  };
}

type Props = {
  className?: string;
  side: "left" | "right";
  /** Decorative city pings with event labels — desktop wing maps only */
  showLivePings?: boolean;
};

function liveRegionForSide(side: Props["side"]): MapLivePingRegion {
  return side === "left" ? "americas" : "asia";
}

function loadFlag(code: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = flagUrl(code);
  });
}

function waitForPaint(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

function useCoverageMapReady(side: Props["side"]) {
  const [ready, setReady] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    if (ready) return;

    let cancelled = false;
    const flagCodes = MARKERS.filter((m) => m.side === side).map((m) => m.code);

    Promise.all([waitForPaint(), ...flagCodes.map(loadFlag)]).then(() => {
      if (!cancelled) setReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, [side, ready]);

  return ready;
}

export function CoverageMapVisual({ className, side, showLivePings = false }: Props) {
  const { t } = useTranslation();
  const isLeft = side === "left";
  const glowId = `coverage-glow-${side}`;
  const projection = SIDE_PROJECTION[side];
  const visibleMarkers = MARKERS.filter((m) => m.side === side);
  const livePings = useCoverageMapLivePings({
    region: liveRegionForSide(side),
    maxPings: 10,
    maxLabels: 3,
    enabled: showLivePings,
  });
  const pulseCoords = showLivePings ? [] : DATA_PULSE_COORDS;
  const mapReady = useCoverageMapReady(side);

  const coverageLabel = [
    t("country_usa_name"),
    t("country_canada_name"),
    t("country_korea_name"),
    t("country_china_name"),
    t("country_uae_name"),
  ].join(", ");

  return (
    <>
      <span className="sr-only">{coverageLabel}</span>
      <div
        className={cn(
          "coverage-map-edge-panel relative h-full w-full overflow-hidden select-none pointer-events-none transition-opacity duration-700 ease-out",
          mapReady ? "opacity-100" : "opacity-0",
          isLeft ? "coverage-map-edge-left" : "coverage-map-edge-right",
          className,
        )}
        aria-hidden
      >
        <div
          className={cn(
            "flex h-full w-full justify-center",
            isLeft ? "items-center -translate-y-[12%]" : "items-center translate-x-[8%] -translate-y-[10%]",
          )}
        >
          <ComposableMap
            projection="geoEqualEarth"
            projectionConfig={projection}
            width={MAP_WIDTH}
            height={MAP_HEIGHT}
            preserveAspectRatio="xMidYMid meet"
            className="coverage-map-svg-edge"
          >
            <defs>
              <radialGradient
                id={glowId}
                cx={isLeft ? "30%" : "70%"}
                cy="48%"
                r="55%"
              >
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.14" />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
              </radialGradient>
            </defs>
            <rect
              width={MAP_WIDTH}
              height={MAP_HEIGHT}
              fill={`url(#${glowId})`}
              opacity={0.8}
            />

            <Geographies geography={worldTopo}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const name = geo.properties.name ?? "";
                  const covered = COVERAGE_NAMES.has(name);

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      className={cn(covered && "coverage-region-pulse")}
                      style={geographyStyle(covered)}
                    />
                  );
                })
              }
            </Geographies>

            <Line
              from={[-98, 39]}
              to={[127.5, 36.5]}
              stroke="hsl(var(--primary) / 0.6)"
              strokeWidth={1.5}
              className="coverage-arc-flow"
            />
            {isLeft && (
              <Line
                from={[-98, 39]}
                to={[-96, 62]}
                stroke="hsl(var(--primary) / 0.6)"
                strokeWidth={1.5}
                className="coverage-arc-flow"
                style={{ animationDelay: "1.1s" }}
              />
            )}

            {pulseCoords.map((coordinates, i) => (
              <Marker key={i} coordinates={coordinates}>
                <circle
                  r={3}
                  fill="hsl(var(--primary))"
                  className="coverage-data-rise"
                  style={{ animationDelay: `${i * 0.45}s` }}
                />
              </Marker>
            ))}

            {visibleMarkers.map((marker) => {
              const flagW = marker.code === "kr" || marker.code === "cn" ? 18 : 17;
              const flagH = Math.round((flagW * 3) / 4);

              return (
                <Marker key={marker.code} coordinates={marker.coordinates}>
                  <circle
                    r={marker.code === "kr" || marker.code === "cn" ? 6.5 : 6}
                    fill="hsl(var(--primary) / 0.24)"
                    stroke="hsl(var(--primary) / 0.7)"
                    strokeWidth={1}
                  />
                  <image
                    href={flagUrl(marker.code)}
                    x={-flagW / 2}
                    y={-flagH - 8}
                    width={flagW}
                    height={flagH}
                  />
                </Marker>
              );
            })}

            {showLivePings && <CoverageMapLiveMarkers pings={livePings} />}
          </ComposableMap>
        </div>
      </div>
    </>
  );
}
