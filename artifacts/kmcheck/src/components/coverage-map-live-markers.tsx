import { useTranslation } from "@/i18n/context";
import type { ActiveMapLivePing } from "@/lib/coverage-live-events";
import { Marker } from "react-simple-maps";

type Props = {
  pings: ActiveMapLivePing[];
};

const CARD_W_LTR = 88;
const CARD_W_RTL = 92;
const CARD_H = 22;
const CARET_H = 7;
const GAP = 5;

function LiveFeedLabel({ eventKey }: { eventKey: string }) {
  const { t, dir } = useTranslation();

  return (
    <div
      // foreignObject HTML namespace
      xmlns="http://www.w3.org/1999/xhtml"
      dir={dir}
      className="coverage-map-live-label-chip"
    >
      <span className="coverage-map-live-label-dot" aria-hidden />
      <span className="coverage-map-live-label-text">{t(eventKey)}</span>
    </div>
  );
}

export function CoverageMapLiveMarkers({ pings }: Props) {
  const { dir } = useTranslation();
  const cardW = dir === "rtl" ? CARD_W_RTL : CARD_W_LTR;
  const labelOffsetY = -(CARD_H + CARET_H + GAP);

  return (
    <>
      {pings.map((ping, i) => {
        const { city, eventKey, showLabel, pingId } = ping;
        const delay = `${i * 0.3}s`;

        return (
          <Marker key={pingId} coordinates={city.coordinates}>
            <g className="coverage-map-live-marker" style={{ animationDelay: delay }}>
              <circle
                r={16}
                fill="hsl(var(--primary) / 0.2)"
                className="coverage-map-live-ring"
              />
              <circle
                r={4.25}
                fill="hsl(var(--primary))"
                stroke="hsl(var(--background))"
                strokeWidth={1.5}
              />

              {showLabel && (
                <g transform={`translate(${-cardW / 2}, ${labelOffsetY})`} className="coverage-map-live-label-layer">
                  <g className="coverage-map-live-label">
                    <foreignObject x={0} y={0} width={cardW} height={CARD_H}>
                      <LiveFeedLabel eventKey={eventKey} />
                    </foreignObject>
                    <path
                      d={`M ${cardW / 2 - 7} ${CARD_H} L ${cardW / 2} ${CARD_H + CARET_H} L ${cardW / 2 + 7} ${CARD_H} Z`}
                      fill="hsl(var(--background) / 0.96)"
                      stroke="hsl(var(--primary) / 0.35)"
                      strokeWidth={0.85}
                      strokeLinejoin="round"
                    />
                    <path
                      d={`M ${cardW / 2 - 6} ${CARD_H + 0.5} L ${cardW / 2} ${CARD_H + CARET_H - 0.5} L ${cardW / 2 + 6} ${CARD_H + 0.5} Z`}
                      fill="hsl(var(--background) / 0.96)"
                    />
                  </g>
                </g>
              )}
            </g>
          </Marker>
        );
      })}
    </>
  );
}
