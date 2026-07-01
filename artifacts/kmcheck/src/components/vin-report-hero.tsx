import { useRef, useState, useCallback, useMemo, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Car, ChevronLeft, ChevronRight, Lock, MapPin,
  CheckCircle2, XCircle, Gauge, ShieldCheck, ShieldAlert,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n/context";
import { formatCountryName, countryLabelsFromT } from "@/lib/format-country-name";
import {
  isVinImageSessionLoaded,
  markVinImageSessionLoaded,
} from "@/lib/vin-image-cache";

export type VinHeroScore = {
  score: string;
  label: string;
  textColor: string;
  bgColor: string;
  borderColor: string;
  accentBar?: string;
  accentGlow?: string;
  /** Numeric score for accent intensity (risk tier animation). */
  riskTier?: "clean" | "caution" | "risk";
};

export type VinHeroSummaryItem = {
  kind: "accidents" | "mileage" | "salvage" | "theft";
  label: string;
  tone: "positive" | "negative" | "neutral" | "muted";
};

type VinReportHeroProps = {
  vehicleTitle: string;
  vin: string;
  country?: string | null;
  trim?: string | null;
  photos?: string[];
  /** @deprecated use photos */
  primaryPhoto?: string | null;
  locked?: boolean;
  lockedLabel?: string;
  unlockedLabel?: string;
  scoreData?: VinHeroScore | null;
  summaryItems?: VinHeroSummaryItem[];
  onPhotoClick?: (index: number) => void;
  photoPlaceholderLabel?: string;
  /** Animated radar placeholder while a manual report is being compiled. */
  pendingPhotoScan?: boolean;
  children: React.ReactNode;
  showStatsRow?: boolean;
};

const SUMMARY_ICON: Record<VinHeroSummaryItem["kind"], typeof CheckCircle2> = {
  accidents: CheckCircle2,
  mileage: Gauge,
  salvage: ShieldCheck,
  theft: ShieldAlert,
};

function summaryToneClasses(tone: VinHeroSummaryItem["tone"], kind: VinHeroSummaryItem["kind"]) {
  if (tone === "positive") {
    return {
      row: "text-green-700 dark:text-green-400",
      icon: "text-green-600 dark:text-green-500",
      Icon: CheckCircle2,
    };
  }
  if (tone === "negative") {
    return {
      row: "text-red-700 dark:text-red-400",
      icon: "text-red-600 dark:text-red-500",
      Icon: XCircle,
    };
  }
  if (tone === "muted") {
    return {
      row: "text-muted-foreground",
      icon: "text-muted-foreground/70",
      Icon: SUMMARY_ICON[kind],
    };
  }
  return {
    row: "text-foreground",
    icon: "text-primary",
    Icon: SUMMARY_ICON[kind],
  };
}

function HeroSummaryList({ items }: { items: VinHeroSummaryItem[] }) {
  return (
    <ul className="hidden sm:flex flex-col gap-2.5 pt-3 print:flex">
      {items.map((item) => {
        const tone = summaryToneClasses(item.tone, item.kind);
        const Icon = item.tone === "positive" || item.tone === "negative" ? tone.Icon : SUMMARY_ICON[item.kind];
        return (
          <li key={item.kind} className={cn("flex items-center gap-2.5 text-sm font-medium", tone.row)}>
            <Icon className={cn("h-4 w-4 shrink-0", tone.icon)} aria-hidden />
            <span className="leading-snug">{item.label}</span>
          </li>
        );
      })}
    </ul>
  );
}

function HeroPhotoPlaceholder({
  vehicleTitle,
  className,
  label,
  pendingScan = false,
}: {
  vehicleTitle: string;
  className?: string;
  label?: string;
  pendingScan?: boolean;
}) {
  const reduceMotion = useReducedMotion();

  if (pendingScan) {
    return (
      <div
        className={cn(
          "relative w-full flex flex-col items-center justify-center gap-3 overflow-hidden",
          "bg-gradient-to-br from-primary/[0.08] via-muted/50 to-muted/30 px-4",
          "aspect-[4/3] max-h-[240px] sm:max-h-none sm:min-h-[260px] sm:h-full",
          className,
        )}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,197,94,0.12),transparent_65%)]" />
        <div className="relative h-16 w-16 sm:h-20 sm:w-20">
          <div className="absolute inset-0 rounded-full border border-primary/25" />
          <div className="absolute inset-2 rounded-full border border-primary/15" />
          {!reduceMotion && (
          <motion.div
            className="absolute inset-0 rounded-full origin-center"
            style={{
              background: "conic-gradient(from 0deg, transparent 0deg, rgba(34,197,94,0.4) 50deg, transparent 100deg)",
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
          />
          )}
          <div className="absolute inset-0 flex items-center justify-center">
            <Car className="h-7 w-7 sm:h-8 sm:w-8 text-primary/80" aria-hidden />
          </div>
        </div>
        {label ? (
          <p className="relative text-xs sm:text-sm font-semibold text-primary text-center">{label}</p>
        ) : null}
        <span className="sr-only">{vehicleTitle}</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "w-full flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-muted to-muted/50 px-4",
        "aspect-[4/3] max-h-[240px] sm:max-h-none sm:min-h-[260px] sm:h-full",
        className,
      )}
    >
      <Car className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground/25" aria-hidden />
      {label ? (
        <p className="text-xs sm:text-sm font-medium text-muted-foreground/80 text-center">{label}</p>
      ) : null}
      <span className="sr-only">{vehicleTitle}</span>
    </div>
  );
}

function HeroPhotoFrame({
  src,
  alt,
  className,
  priority = false,
  onLoaded,
  onFailed,
}: {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  onLoaded?: () => void;
  onFailed?: () => void;
}) {
  const imgRef = useRef<HTMLImageElement>(null);

  const notifyLoaded = useCallback(() => {
    markVinImageSessionLoaded(src);
    onLoaded?.();
  }, [src, onLoaded]);

  useEffect(() => {
    const img = imgRef.current;
    if (img?.complete && img.naturalWidth > 0) {
      notifyLoaded();
    }
  }, [src, notifyLoaded]);

  return (
    <img
      ref={imgRef}
      src={src}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={priority ? "high" : "auto"}
      className={cn(
        "w-full object-cover object-center",
        "aspect-[4/3] max-h-[200px] sm:min-h-[260px] sm:max-h-[320px] sm:h-full",
        className,
      )}
      onLoad={notifyLoaded}
      onError={() => onFailed?.()}
    />
  );
}

type HeroPhotoGalleryProps = {
  photos: string[];
  photoIdx: number;
  onIndexChange: (next: number) => void;
  vehicleTitle: string;
  locked: boolean;
  lockedLabel?: string;
  photoClickable: boolean;
  onPhotoClick?: (index: number) => void;
  className?: string;
  photoPlaceholderLabel?: string;
  pendingPhotoScan?: boolean;
};

function HeroPhotoGallery({
  photos,
  photoIdx,
  onIndexChange,
  vehicleTitle,
  locked,
  lockedLabel,
  photoClickable,
  onPhotoClick,
  className,
  photoPlaceholderLabel,
  pendingPhotoScan = false,
}: HeroPhotoGalleryProps) {
  const { t } = useTranslation();
  const touchX = useRef(0);
  const currentPhoto = photos[photoIdx] ?? photos[0] ?? null;
  const showNav = photos.length > 1 && !locked;
  const [loaded, setLoaded] = useState<Record<number, boolean>>(() => {
    const init: Record<number, boolean> = {};
    photos.forEach((url, i) => {
      if (isVinImageSessionLoaded(url)) init[i] = true;
    });
    return init;
  });
  const [failed, setFailed] = useState<Record<number, boolean>>({});

  const visibleIndices = useMemo(() => {
    if (photos.length === 0) return [];
    const set = new Set<number>([photoIdx]);
    if (photos.length > 1) {
      set.add((photoIdx - 1 + photos.length) % photos.length);
      set.add((photoIdx + 1) % photos.length);
    }
    return [...set];
  }, [photoIdx, photos.length]);

  const markLoaded = useCallback((i: number) => {
    setLoaded((prev) => (prev[i] ? prev : { ...prev, [i]: true }));
    setFailed((prev) => {
      if (!prev[i]) return prev;
      const next = { ...prev };
      delete next[i];
      return next;
    });
  }, []);

  const markFailed = useCallback((i: number) => {
    setFailed((prev) => (prev[i] ? prev : { ...prev, [i]: true }));
  }, []);

  const go = useCallback(
    (next: number) => {
      if (photos.length === 0) return;
      onIndexChange((next + photos.length) % photos.length);
    },
    [photos.length, onIndexChange],
  );

  const navBtnClass =
    "absolute top-1/2 -translate-y-1/2 flex h-9 w-9 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-black/55 sm:bg-background/90 backdrop-blur-sm border border-white/25 sm:border shadow-sm text-white sm:text-foreground hover:bg-black/70 sm:hover:bg-background active:scale-95 z-10 print:hidden";

  if (locked) {
    const previewSrc = photos[0] ?? null;
    const previewReady = previewSrc
      ? (loaded[0] || isVinImageSessionLoaded(previewSrc)) && !failed[0]
      : false;

    return (
      <div
        className={cn(
          "relative w-full rounded-xl overflow-hidden bg-muted/40 print-vin-hero-photo",
          "aspect-[4/3] max-h-[200px] sm:min-h-[260px] sm:max-h-[320px] sm:h-full",
          className,
        )}
      >
        {previewSrc && !failed[0] ? (
          <HeroPhotoFrame
            src={previewSrc}
            alt={vehicleTitle}
            priority
            onLoaded={() => markLoaded(0)}
            onFailed={() => markFailed(0)}
            className="relative sm:rounded-xl"
          />
        ) : (
          <HeroPhotoPlaceholder
            vehicleTitle={vehicleTitle}
            label={photoPlaceholderLabel}
            pendingScan={pendingPhotoScan}
          />
        )}

        {previewSrc && !previewReady && !failed[0] && (
          <div className="absolute inset-0 z-[2] flex items-center justify-center bg-muted/30 pointer-events-none">
            <div className="h-7 w-7 rounded-full border-2 border-muted-foreground/25 border-t-muted-foreground/70 animate-spin" />
          </div>
        )}

        {lockedLabel && (
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 rounded-full bg-background/95 border shadow-sm px-2.5 py-1 print:hidden z-10">
            <Lock className="h-3 w-3 text-muted-foreground" />
            <span className="text-[10px] font-medium text-muted-foreground">{lockedLabel}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative w-full rounded-xl overflow-hidden bg-muted/40 print-vin-hero-photo group/gallery",
        "aspect-[4/3] max-h-[200px] sm:min-h-[260px] sm:max-h-[320px] sm:h-full",
        photoClickable && "cursor-zoom-in",
        className,
      )}
      onClick={photoClickable ? () => onPhotoClick?.(photoIdx) : undefined}
      onTouchStart={showNav ? (e) => { touchX.current = e.touches[0].clientX; } : undefined}
      onTouchEnd={showNav ? (e) => {
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 40) go(photoIdx + (dx < 0 ? 1 : -1));
      } : undefined}
    >
      {currentPhoto && !failed[photoIdx] ? (
        <>
          {visibleIndices.map((i) => (
            <HeroPhotoFrame
              key={i}
              src={photos[i]!}
              alt={vehicleTitle}
              priority={i === photoIdx}
              onLoaded={() => markLoaded(i)}
              onFailed={() => markFailed(i)}
              className={cn(
                "absolute inset-0 max-sm:transition-none transition-opacity duration-200",
                i === photoIdx ? "opacity-100 z-[1]" : "opacity-0 z-0 pointer-events-none",
                "group-hover/gallery:scale-[1.02] sm:rounded-xl",
              )}
            />
          ))}
          {!loaded[photoIdx] && !isVinImageSessionLoaded(currentPhoto) && (
            <div className="absolute inset-0 z-[2] flex items-center justify-center bg-black/5 pointer-events-none">
              <div className="h-7 w-7 rounded-full border-2 border-white/40 border-t-white/90 animate-spin" />
            </div>
          )}
        </>
      ) : (
        <HeroPhotoPlaceholder
          vehicleTitle={vehicleTitle}
          label={photoPlaceholderLabel}
          pendingScan={pendingPhotoScan}
        />
      )}

      {locked && lockedLabel && (
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 rounded-full bg-background/95 border shadow-sm px-2.5 py-1 print:hidden z-10">
          <Lock className="h-3 w-3 text-muted-foreground" />
          <span className="text-[10px] font-medium text-muted-foreground">{lockedLabel}</span>
        </div>
      )}

      {photos.length > 0 && (
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 pointer-events-none z-10 print:hidden">
          <div className="rounded-full bg-black/50 backdrop-blur-sm px-2.5 py-1 text-[10px] font-medium text-white/95 tabular-nums">
            {showNav ? `${photoIdx + 1} / ${photos.length}` : `1 / 1`}
          </div>
          {showNav && (
            <div className="rounded-full bg-black/40 backdrop-blur-sm px-2 py-0.5 text-[9px] text-white/80 w-fit">
              {photos.length} {t("photos_count_suffix")}
            </div>
          )}
        </div>
      )}

      {showNav && (
        <>
          <button
            type="button"
            aria-label={t("vin_hero_prev_photo")}
            className={cn(navBtnClass, "left-2")}
            onClick={(e) => { e.stopPropagation(); go(photoIdx - 1); }}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label={t("vin_hero_next_photo")}
            className={cn(navBtnClass, "right-2")}
            onClick={(e) => { e.stopPropagation(); go(photoIdx + 1); }}
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          <div className="absolute bottom-2.5 inset-x-0 flex justify-center gap-1.5 pointer-events-none z-10 print:hidden">
            {photos.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`${t("vin_hero_go_to_photo")} ${i + 1}`}
                aria-current={i === photoIdx ? "true" : undefined}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-200 pointer-events-auto",
                  i === photoIdx ? "w-5 bg-white shadow-sm" : "w-1.5 bg-white/50 hover:bg-white/70",
                )}
                onClick={(e) => { e.stopPropagation(); onIndexChange(i); }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function VinReportHero({
  vehicleTitle,
  vin,
  country,
  trim,
  photos: photosProp,
  primaryPhoto,
  locked = false,
  lockedLabel,
  unlockedLabel,
  scoreData,
  summaryItems,
  onPhotoClick,
  photoPlaceholderLabel,
  pendingPhotoScan = false,
  showStatsRow = true,
  children,
}: VinReportHeroProps) {
  const { t, language } = useTranslation();
  const photos = (photosProp?.length ? photosProp : primaryPhoto ? [primaryPhoto] : []).filter(Boolean);
  const [photoIdx, setPhotoIdx] = useState(0);
  const photoClickable = !!onPhotoClick && photos.length > 0 && !locked;
  const displayCountry = country
    ? formatCountryName(country, language, countryLabelsFromT(t))
    : null;
  const showDesktopSummary = !!summaryItems?.length;
  const showScoreAccent = !locked && scoreData?.accentBar;
  const isRiskAccent = scoreData?.riskTier === "risk" || (scoreData && parseFloat(scoreData.score) < 6);

  return (
    <div className="vin-report-hero rounded-2xl border bg-card overflow-hidden shadow-sm relative">
      {showScoreAccent && (
        <>
          <div
            className={cn(
              "absolute inset-x-0 top-0 z-20 h-[2px] bg-gradient-to-r",
              scoreData.accentBar,
              isRiskAccent && "vin-hero-accent-risk",
            )}
            aria-hidden
          />
          <div
            className={cn(
              "pointer-events-none absolute inset-x-0 top-0 z-10 h-8 bg-gradient-to-b",
              scoreData.accentGlow,
            )}
            aria-hidden
          />
        </>
      )}
      <div className="sm:grid sm:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] sm:items-stretch">
        {/* Left — photo gallery */}
        <div className="p-2.5 sm:p-5 bg-muted/30 sm:border-r border-border/60 print:p-2">
          <HeroPhotoGallery
            photos={photos}
            photoIdx={photoIdx}
            onIndexChange={setPhotoIdx}
            vehicleTitle={vehicleTitle}
            locked={locked}
            lockedLabel={lockedLabel}
            photoClickable={photoClickable}
            onPhotoClick={onPhotoClick}
            photoPlaceholderLabel={photoPlaceholderLabel}
            pendingPhotoScan={pendingPhotoScan}
          />
        </div>

        {/* Right — vehicle details + status badges */}
        <div className="flex flex-col min-w-0">
          <div className="px-3 sm:px-5 py-3 sm:py-5 flex-1 print:py-2 print:px-3">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="min-w-0 flex-1">
                {unlockedLabel && !locked && (
                  <Badge
                    variant="outline"
                    className="mb-2 text-[10px] font-semibold border-primary/30 text-primary bg-primary/5 print:hidden"
                  >
                    {unlockedLabel}
                  </Badge>
                )}
                <h1 className="text-lg sm:text-2xl lg:text-[1.65rem] font-bold tracking-tight text-foreground leading-tight">
                  {vehicleTitle}
                </h1>
                {trim && (
                  <div className="mt-1.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                      {t("trim_generation")}
                    </p>
                    <p className="text-sm text-muted-foreground mt-0.5">{trim}</p>
                  </div>
                )}
                <Badge
                  variant="outline"
                  className={cn(
                    "font-mono text-[11px] sm:text-xs tracking-wider px-2.5 py-1 bg-muted/40 border-border/80 text-foreground/90 select-all w-fit",
                    trim ? "mt-3" : "mt-2",
                  )}
                >
                  {vin}
                </Badge>
              </div>
              {scoreData && (
                <div
                  className={cn(
                    "shrink-0 rounded-xl border px-3 py-2 text-center min-w-[4.25rem]",
                    scoreData.bgColor,
                    scoreData.borderColor,
                  )}
                >
                  <p className={cn("text-xl sm:text-2xl font-black tabular-nums leading-none", scoreData.textColor)}>
                    {scoreData.score}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-medium">/10</p>
                  <p className={cn("text-[9px] font-semibold mt-0.5 leading-tight max-w-[4rem]", scoreData.textColor)}>
                    {scoreData.label}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2 pt-1 border-t border-border/50">
              {displayCountry && (
                <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1.5 pt-2">
                  <MapPin className="h-3.5 w-3.5 shrink-0 opacity-70" />
                  {displayCountry}
                </p>
              )}
              {showDesktopSummary && <HeroSummaryList items={summaryItems!} />}
            </div>
          </div>

          {showStatsRow && (
          <div className={cn(
            "px-2.5 sm:px-5 pb-3 sm:pb-5 pt-0 grid gap-1.5 sm:gap-2.5 bg-muted/15 sm:bg-muted/10 border-t border-border/40 vin-hero-stats [&>*]:flex [&>*]:w-full [&>*]:justify-center print:grid-cols-4 print:gap-1 print:py-1.5 print:px-2",
            locked ? "grid-cols-1" : "grid-cols-2",
            showDesktopSummary && !locked && "sm:hidden print:grid",
          )}>
            {children}
          </div>
          )}
        </div>
      </div>
    </div>
  );
}
