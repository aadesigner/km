import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RotateCcw, View } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n/context";
import { markVinImageSessionLoaded, isVinImageSessionLoaded } from "@/lib/vin-image-cache";

const MIN_SPIN_FRAMES = 8;
const PIXELS_PER_FRAME = 14;

type SpinKind = "exterior" | "interior";

type Props = {
  exterior?: string[] | null;
  interior?: string[] | null;
  className?: string;
};

function cleanFrames(urls: string[] | null | undefined): string[] {
  if (!Array.isArray(urls)) return [];
  return urls.filter((u): u is string => typeof u === "string" && u.length > 0);
}

export function VinPhoto360Viewer({ exterior, interior, className }: Props) {
  const { t } = useTranslation();
  const exteriorFrames = useMemo(() => cleanFrames(exterior), [exterior]);
  const interiorFrames = useMemo(() => cleanFrames(interior), [interior]);

  const hasExterior = exteriorFrames.length >= MIN_SPIN_FRAMES;
  const hasInterior = interiorFrames.length >= MIN_SPIN_FRAMES;

  const [kind, setKind] = useState<SpinKind>(hasExterior ? "exterior" : "interior");
  const frames = kind === "exterior" ? exteriorFrames : interiorFrames;

  const [index, setIndex] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [imgReady, setImgReady] = useState(false);
  const dragRef = useRef<{ x: number; startIndex: number } | null>(null);
  const preloadRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (hasExterior) setKind("exterior");
    else if (hasInterior) setKind("interior");
  }, [hasExterior, hasInterior]);

  useEffect(() => {
    setIndex(0);
  }, [kind, frames.length]);

  useEffect(() => {
    if (frames.length === 0) return;
    for (const url of frames) {
      if (preloadRef.current.has(url)) continue;
      preloadRef.current.add(url);
      const img = new Image();
      img.decoding = "async";
      img.src = url;
    }
  }, [frames]);

  const currentUrl = frames[index] ?? frames[0];
  useEffect(() => {
    if (!currentUrl) {
      setImgReady(false);
      return;
    }
    setImgReady(isVinImageSessionLoaded(currentUrl));
  }, [currentUrl]);

  const scrubByDelta = useCallback(
    (deltaX: number) => {
      if (frames.length < 2 || !dragRef.current) return;
      const frameDelta = Math.round(deltaX / PIXELS_PER_FRAME);
      const next = ((dragRef.current.startIndex + frameDelta) % frames.length + frames.length) % frames.length;
      setIndex(next);
    },
    [frames.length],
  );

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (frames.length < 2) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { x: e.clientX, startIndex: index };
    setDragging(true);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    scrubByDelta(e.clientX - dragRef.current.x);
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
    dragRef.current = null;
    setDragging(false);
  };

  if (!hasExterior && !hasInterior) return null;

  const showSwitcher = hasExterior && hasInterior;

  return (
    <section className={cn("rounded-2xl border bg-background overflow-hidden", className)}>
      <div className="px-4 sm:px-5 py-3 border-b bg-muted/30 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-6 w-6 rounded-md bg-sky-500/10 flex items-center justify-center shrink-0">
            <View className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
          </div>
          <h2 className="font-bold text-sm truncate">{t("vin_360_title")}</h2>
        </div>
        {showSwitcher ? (
          <div className="inline-flex rounded-lg border border-border/70 bg-background p-0.5 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setKind("exterior")}
              className={cn(
                "rounded-md px-2.5 py-1 transition-colors",
                kind === "exterior"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t("vin_360_exterior")}
            </button>
            <button
              type="button"
              onClick={() => setKind("interior")}
              className={cn(
                "rounded-md px-2.5 py-1 transition-colors",
                kind === "interior"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t("vin_360_interior")}
            </button>
          </div>
        ) : null}
      </div>

      <div
        className={cn(
          "relative aspect-[16/10] bg-muted/40 select-none touch-none",
          frames.length > 1 && (dragging ? "cursor-grabbing" : "cursor-grab"),
        )}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        role="img"
        aria-label={kind === "exterior" ? t("vin_360_exterior") : t("vin_360_interior")}
      >
        {currentUrl ? (
          <img
            key={currentUrl}
            src={currentUrl}
            alt=""
            draggable={false}
            className={cn(
              "absolute inset-0 h-full w-full object-contain transition-opacity duration-150",
              imgReady ? "opacity-100" : "opacity-0",
            )}
            onLoad={() => {
              markVinImageSessionLoaded(currentUrl);
              setImgReady(true);
            }}
          />
        ) : null}
        {!imgReady && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-8 w-8 rounded-full border-2 border-muted-foreground/25 border-t-muted-foreground/70 animate-spin" />
          </div>
        )}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3 bg-gradient-to-t from-black/55 via-black/20 to-transparent">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-black/45 px-2 py-1 text-[11px] font-medium text-white/95">
            <RotateCcw className="h-3 w-3 opacity-90" />
            {t("vin_360_hint")}
          </span>
          <span className="rounded-md bg-black/45 px-2 py-1 text-[11px] font-semibold tabular-nums text-white/95">
            {index + 1}/{frames.length}
          </span>
        </div>
      </div>
    </section>
  );
}
