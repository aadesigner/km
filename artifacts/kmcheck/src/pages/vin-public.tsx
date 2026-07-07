import { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslation } from "@/i18n/context";
import { useAuth } from "@/lib/auth-context";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock, Car, ArrowLeft,
  CheckCircle2, XCircle, Users, Gauge,
  Wrench, Palette, MapPin, Calendar,
  ShieldCheck, ShieldAlert, ChevronRight, AlertTriangle,
  Zap, Settings2, TrendingUp, DollarSign, Fuel, Box,
  X, ChevronLeft, ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { translateDamageLabel } from "@/lib/translate-damage-label";
import { translateTitleStatus } from "@/lib/translate-title-status";
import { translateLotStatus } from "@/lib/translate-lot-status";
import { SEOHead } from "@/components/seo";
import { SITE_ORIGIN } from "@/lib/seo-config";
import { buildVinPageSeo, type VinSeoLang } from "@workspace/vin-page-seo";
import { PrintReportBranding } from "@/components/print-report-branding";
import { VinPrintSummary } from "@/components/vin-print-summary";
import { VinReportShareCard } from "@/components/vin-report-share-card";
import { buildAccidentPrintHighlights, buildInsurancePrintHighlights, buildMileagePrintRows, buildOwnerPrintRows, buildRegistryPrintRows, buildAuctionPrintRows } from "@/lib/build-print-summary";
import { VinReportHero } from "@/components/vin-report-hero";
import { PhotoLightbox } from "@/components/photo-lightbox";
import { mileageColor } from "@/lib/mileage-color";
import {
  AnimatedMileageBadge,
  AnimatedMileageKm,
  VinMileageGauge,
} from "@/components/vin-mileage-animated";
import { createVinReportFetchError } from "@/lib/api-error";
import { VinReportErrorView, resolveVinReportErrorKind } from "@/components/vin-report-error";
import { useQueryRecovery } from "@/hooks/use-query-recovery";
import { resolveLatestOdometerRecordedYear, resolveLatestRecordedOdometer } from "@/lib/resolve-latest-odometer";
import { translateFuelType } from "@/lib/translate-fuel-type";
import { sortHistoryNewestFirst } from "@/lib/history-sort";
import { translateKoreanProviderPhrase, localizeProviderDate } from "@/lib/korean-provider-text";
import { formatMarketAuctionDate } from "@/lib/market-chart-data";
import {
  formatAccidentDescription,
  formatAccidentType,
  localizeAccidentDate,
  resolveAccidentSeverityForDisplay,
  accidentSeverityStyle,
  ACCIDENT_SEVERITY_I18N_KEYS,
} from "@/lib/accident-display";
import { buildUnlockCheckoutTarget } from "@/lib/checkout-vin-flow";
import { VinLookupDisabledBanner } from "@/components/vin-lookup-disabled-banner";
import { repairDatedRecords } from "@/lib/encar-date-repair";
import { formatCountryName, countryLabelsFromT } from "@/lib/format-country-name";
import { computeVinConditionScore, scoreInputFromPublic } from "@/lib/vin-condition-score";
import { buildVinHeroSummaryItems } from "@/lib/vin-hero-summary";
import { countAccidentSignals } from "@/lib/accident-signals";
import { formatAccidentCount } from "@/lib/format-accident-count";
import { VIN_REPORT_QUERY_OPTIONS } from "@/lib/vin-report-cache";
import { prefetchVinImages } from "@/lib/vin-image-cache";
import { LazyMarketValueChart as MarketValueChart } from "@/components/lazy-market-value-chart";
import { KoreanWonAmount } from "@/components/korean-won-amount";
import { shouldFormatAccidentLossAsKrw } from "@/lib/korean-currency";
import { InsuranceClaimsSection } from "@/components/insurance-claims-section";
import { useReportKrwPerUsd } from "@/hooks/use-report-krw-per-usd";
import { useDisplayPrice } from "@/hooks/use-display-price";
import { RegistryHistorySection } from "@/components/registry-history-section";
import { VehicleSpecsGrid } from "@/components/vehicle-specs-grid";
import { OwnerHistoryTimeline } from "@/components/owner-history-timeline";
import { AuctionHistoryTimeline } from "@/components/auction-history-timeline";
import type { InsuranceClaimEntry } from "@/lib/insurance-claims";
import type { RegistryHistoryEntry } from "@/lib/registry-history";
import {
  VinLockedHeroStat,
  VinLockedSectionCard,
} from "@/components/vin-locked-preview";
import {
  cleanDisplayStr,
  hasMeaningfulMarketData,
  hasMileageData,
  hasOwnershipData,
  hasSafetyData,
  sanitizeAccidents,
  sanitizeAuctionHistory,
  sanitizeInsuranceClaims,
  sanitizeMileageHistory,
  sanitizeOwnerHistory,
  enrichRegistryHistoryDates,
  sanitizeRegistryHistory,
} from "@/lib/report-display";

type Accident = {
  date?: string | null;
  severity?: string | null;
  description?: string | null;
  country?: string | null;
  type?: string | null;
  primaryDamage?: string | null;
  secondaryDamage?: string | null;
  airbagDeployed?: boolean | null;
  odometerAtLoss?: number | null;
  lossAmount?: number | null;
};

type MileageEntry = {
  date?: string | null;
  odometer?: number | null;
  unit?: string | null;
  condition?: string | null;
  damage?: string | null;
  primaryDamage?: string | null;
  secondaryDamage?: string | null;
  titleStatus?: string | null;
  auctionPrice?: number | null;
  lotStatus?: string | null;
};

type OwnerEntry = {
  date?: string | null;
  location?: string | null;
  mileage?: number | null;
  auctionPrice?: number | null;
  lotStatus?: string | null;
  condition?: string | null;
};

type AuctionEntry = {
  date?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  condition?: string | null;
  damage?: string | null;
  primaryDamage?: string | null;
  secondaryDamage?: string | null;
  titleStatus?: string | null;
  openingBid?: number | null;
  buyNowPrice?: number | null;
  finalPrice?: number | null;
  lotStatus?: string | null;
};

type VinPublicReport = {
  vin: string;
  make: string | null;
  model: string | null;
  year: number | null;
  trim?: string | null;
  engine: string | null;
  transmission: string | null;
  color: string | null;
  country: string | null;
  thumbnailUrl: string | null;
  providerName: string | null;
  inCatalog: boolean;
  isUnlocked: boolean;
  price?: number | null;
  currency?: string | null;
  odometer?: number | null;
  odometerLocked?: boolean;
  accidents?: Accident[];
  accidentCount?: number | null;
  ownerCount?: number | null;
  salvage?: boolean | null;
  stolen?: boolean | null;
  titleStatus?: string | null;
  photos?: string[] | null;
  hp?: number | null;
  cylinders?: number | null;
  bodyType?: string | null;
  fuelType?: string | null;
  mileageHistory?: MileageEntry[] | null;
  ownerHistory?: OwnerEntry[] | null;
  marketData?: {
    estimatedValue?: number | null;
    currency?: string | null;
    lastAuctionPrice?: number | null;
    lastAuctionDate?: string | null;
  } | null;
  insuranceClaims?: InsuranceClaimEntry[] | null;
  registryHistory?: RegistryHistoryEntry[] | null;
  auctionHistory?: AuctionEntry[] | null;
  krwPerUsd?: number | null;
};

interface Props {
  params: { id: string; lang: string };
}

const TRANSMISSION_KEYS: Record<string, string> = {
  automatic: "trans_automatic", manual: "trans_manual", cvt: "trans_cvt",
  "dual-clutch": "trans_dct", dct: "trans_dct", amt: "trans_amt",
};
const BODY_KEYS: Record<string, string> = {
  sedan: "body_sedan", saloon: "body_sedan", suv: "body_suv",
  hatchback: "body_hatchback", coupe: "body_coupe", convertible: "body_convertible",
  cabriolet: "body_convertible", wagon: "body_wagon", estate: "body_wagon",
  van: "body_van", minivan: "body_minivan", pickup: "body_pickup",
  truck: "body_truck", crossover: "body_crossover",
};
const SEVERITY_KEYS = ACCIDENT_SEVERITY_I18N_KEYS;

function translateValue(raw: string | null | undefined, map: Record<string, string>, t: (k: string) => string): string | null {
  if (!raw) return null;
  const key = map[raw.toLowerCase().trim()];
  if (key) {
    const translated = t(key);
    return translated !== key ? translated : raw;
  }
  return raw;
}


function PassPill({ ok, labelOk, labelFail }: { ok: boolean; labelOk: string; labelFail: string }) {
  return ok ? (
    <div className="inline-flex items-center gap-1 sm:gap-1.5 rounded-full bg-green-50 dark:bg-green-950/60 border border-green-200 dark:border-green-800 px-2.5 py-0.5 sm:px-3 sm:py-1">
      <CheckCircle2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-green-600 shrink-0" />
      <span className="text-[11px] sm:text-xs font-semibold text-green-700 dark:text-green-400">{labelOk}</span>
    </div>
  ) : (
    <div className="inline-flex items-center gap-1 sm:gap-1.5 rounded-full bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 px-2.5 py-0.5 sm:px-3 sm:py-1">
      <XCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-red-600 shrink-0" />
      <span className="text-[11px] sm:text-xs font-semibold text-red-700 dark:text-red-400">{labelFail}</span>
    </div>
  );
}


function SpecRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string | null | undefined;
}) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-3">
      <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-muted-foreground uppercase tracking-wide leading-tight">{label}</p>
        <p className="text-sm font-semibold truncate">{value}</p>
      </div>
    </div>
  );
}

// ── Sanitize display strings — reject empty / placeholder provider values ──
function cleanStr(v: string | null | undefined): string | null {
  return cleanDisplayStr(v);
}

// ── Clean raw API labels: snake_case → Title Case with special-case lookup ──
const CLEAN_LABEL_MAP: Record<string, string> = {
  suv: "SUV",
  sport_car: "Sports Car",
  sports_car: "Sports Car",
  pickup_truck: "Pickup Truck",
  pickup: "Pickup Truck",
  ev: "EV",
  phev: "PHEV",
  lpg: "LPG",
  atv: "ATV",
  utv: "UTV",
};
function cleanLabel(v: string | null | undefined, tMap?: Record<string, string>): string | null {
  if (!v || v === "[object Object]") return null;
  const key = v.toLowerCase().replace(/\s+/g, "_");
  if (tMap?.[key]) return tMap[key];
  if (CLEAN_LABEL_MAP[key]) return CLEAN_LABEL_MAP[key];
  return v.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

// ── Mileage Timeline ───────────────────────────────────────────────────────────
function MileageTimeline({
  history,
  t,
  language,
  vehicleYear,
  vehicleCountry,
}: {
  history: MileageEntry[];
  t: (k: string) => string;
  language: import("@/i18n/context").Language;
  vehicleYear?: number | null;
  vehicleCountry?: string | null;
}) {
  const sorted = sortHistoryNewestFirst(
    history.filter((e) => e.odometer),
  );
  if (sorted.length === 0) return null;
  return (
    <div>
      {sorted.map((entry, i) => {
        const isFirst = i === 0;
        const isLast = i === sorted.length - 1;
        const km = entry.odometer!;
        const col = mileageColor(km);
        const cond = translateLotStatus(t, cleanStr(entry.condition));
        const primaryDmg = translateDamageLabel(t, cleanStr(entry.primaryDamage) ?? cleanStr(entry.damage));
        const secondaryDmg = translateDamageLabel(t, cleanStr(entry.secondaryDamage));
        const status = translateLotStatus(t, cleanStr(entry.lotStatus));
        const titleLabel = translateTitleStatus(t, cleanStr(entry.titleStatus));
        return (
          <div key={i} className="relative pl-7">
            <div className={cn("absolute left-0 top-1.5 h-3.5 w-3.5 rounded-full border-2 border-background ring-2", col.dot)} />
            {!isLast && <div className="absolute left-[6px] top-5 bottom-0 w-0.5 bg-border" />}
            <div className={cn("pb-5", isLast && "pb-0")}>
              <p className="text-xs text-muted-foreground mb-0.5">
                {entry.date ? localizeProviderDate(entry.date, language, vehicleYear, vehicleCountry) : null}
              </p>
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <span className={cn("font-black tabular-nums", col.text, isFirst ? "text-2xl" : "text-lg")}>
                  {isFirst ? (
                    <AnimatedMileageKm value={km} />
                  ) : (
                    km.toLocaleString()
                  )}
                </span>
                <span className="text-sm text-muted-foreground">{entry.unit ?? "km"}</span>
                {isFirst && <Badge variant="secondary" className="text-[10px] ml-1">{t("latest")}</Badge>}
              </div>
              {entry.auctionPrice != null && (
                <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 flex items-center gap-1 mt-1">
                  <DollarSign className="h-3 w-3 shrink-0" />
                  {entry.auctionPrice.toLocaleString()}
                </p>
              )}
              {(cond || primaryDmg || secondaryDmg || status || titleLabel) && (
                <div className="flex flex-wrap gap-2 mt-1.5">
                  {cond && (
                    <span className="text-xs bg-muted rounded-md px-2 py-0.5 text-muted-foreground">
                      {t("condition")}: {cond}
                    </span>
                  )}
                  {primaryDmg && (
                    <span className="text-xs bg-muted rounded-md px-2 py-0.5 text-muted-foreground">
                      {t("primary_damage")}: {primaryDmg}
                    </span>
                  )}
                  {secondaryDmg && (
                    <span className="text-xs bg-muted rounded-md px-2 py-0.5 text-muted-foreground">
                      {t("secondary_damage")}: {secondaryDmg}
                    </span>
                  )}
                  {titleLabel && (
                    <span className="text-xs bg-amber-500/10 text-amber-800 dark:text-amber-300 rounded-md px-2 py-0.5">
                      {t("title_status")}: {titleLabel}
                    </span>
                  )}
                  {status && (
                    <span className="text-xs bg-muted rounded-md px-2 py-0.5 text-muted-foreground">
                      {status}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Owner Timeline ─────────────────────────────────────────────────────────────
// (see components/owner-history-timeline.tsx)

export default function VinPublic({ params }: Props) {
  const { t, language } = useTranslation();
  const { isSignedIn, isLoaded, user } = useAuth();
  const [, setLocation] = useLocation();
  const [expandedAccidents, setExpandedAccidents] = useState<Set<number>>(new Set());
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const openLightbox = useCallback((i: number) => setLightboxIndex(i), []);
  const closeLightbox = useCallback(() => setLightboxIndex(null), []);
  const navLightbox = useCallback((i: number) => setLightboxIndex(i), []);

  const vin = params.id.toUpperCase();
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

  const buildShareUrl = useCallback(() => {
    const origin = window.location.origin;
    return `${origin}${basePath}/${language}/vin/${vin}`;
  }, [basePath, language, vin]);

  const handleUnlock = useCallback(() => {
    const target = buildUnlockCheckoutTarget(vin, language, !!isSignedIn);
    if (target) window.location.assign(target.href);
  }, [vin, language, isSignedIn]);

  const { displayPrice, fmtPrice } = useDisplayPrice();
  const priceStr = displayPrice != null ? fmtPrice(displayPrice) : null;

  const { data, isLoading, isError, error, isFetching, refetch } = useQuery<VinPublicReport>({
    queryKey: ["/api/vin/public", vin, user?.id ?? null],
    enabled: isLoaded,
    queryFn: async () => {
      const r = await fetch(`${basePath}/api/vin/public/${vin}`, {
        credentials: "include",
      });
      if (r.status === 404) {
        throw createVinReportFetchError(404);
      }
      if (r.status === 403) {
        throw createVinReportFetchError(403);
      }
      if (!r.ok) {
        throw createVinReportFetchError(r.status);
      }
      return r.json() as Promise<VinPublicReport>;
    },
    ...VIN_REPORT_QUERY_OPTIONS,
    retry: 2,
  });

  const krwPerUsd = useReportKrwPerUsd(data?.krwPerUsd);

  const notFound = isError && !data && !!(error as { notFound?: boolean })?.notFound;
  const forbidden = isError && !data && !!(error as { forbidden?: boolean })?.forbidden;
  useQueryRecovery(isError && !!data, isFetching, refetch);

  const seoLang = language as VinSeoLang;
  const seoOrigin = typeof window !== "undefined" ? window.location.origin : SITE_ORIGIN;

  const vinOnlySeo = useMemo(
    () => buildVinPageSeo(seoLang, { vin }, seoOrigin),
    [seoLang, vin, seoOrigin],
  );

  const pageSeo = useMemo(() => {
    if (!data) return vinOnlySeo;
    const photos = (data.photos ?? (data.thumbnailUrl ? [data.thumbnailUrl] : [])).filter(Boolean);
    const resolvedOdometer = data.isUnlocked
      ? resolveLatestRecordedOdometer({
          odometer: data.odometer,
          odometerLocked: data.odometerLocked === true,
          country: data.country,
          mileageHistory: data.mileageHistory,
          ownerHistory: data.ownerHistory,
          registryHistory: data.registryHistory,
        })
      : null;
    return buildVinPageSeo(
      seoLang,
      {
        vin,
        make: data.make,
        model: data.model,
        year: data.year,
        trim: data.trim,
        engine: data.engine,
        transmission: data.transmission,
        color: data.color,
        country: data.country,
        bodyType: data.bodyType,
        fuelType: data.fuelType,
        thumbnailUrl: photos[0] ?? data.thumbnailUrl,
      },
      seoOrigin,
      {
        isUnlocked: data.isUnlocked,
        odometer: resolvedOdometer,
      },
    );
  }, [data, seoLang, vin, seoOrigin, vinOnlySeo]);

  const seoBlock = (
    <SEOHead
      title={pageSeo.title}
      description={pageSeo.description}
      lang={seoLang}
      canonicalPath={pageSeo.canonicalPath}
      jsonLd={notFound ? undefined : pageSeo.jsonLd}
      ogImage={pageSeo.ogImage}
      ogImageAlt={pageSeo.ogImageAlt}
      noIndex={notFound || undefined}
    />
  );

  const vehicleTitle =
    data?.year && data?.make && data?.model
      ? `${data.year} ${data.make} ${data.model}`
      : data?.make && data?.model
      ? `${data.make} ${data.model}`
      : `VIN ${vin}`;

  useEffect(() => {
    if (forbidden) {
      setLocation(`/${language}`, { replace: true });
    }
  }, [forbidden, language, setLocation]);

  useEffect(() => {
    if (!data) return;
    const all = (data.photos ?? (data.thumbnailUrl ? [data.thumbnailUrl] : [])).filter(
      (p): p is string => typeof p === "string" && p.length > 0,
    );
    const urls = data.isUnlocked ? all : all.slice(0, 1);
    if (urls.length) void prefetchVinImages(urls);
  }, [data]);

  const toggleAccident = (i: number) => {
    setExpandedAccidents(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  if ((isLoading && !data) || !isLoaded) {
    return (
      <>
        {seoBlock}
        <div className="max-w-6xl mx-auto px-4 py-10 space-y-6">
        <Skeleton className="h-6 w-36" />
        <Skeleton className="h-52 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      </div>
      </>
    );
  }

  if (notFound) {
    return (
      <>
        {seoBlock}
        <div className="max-w-lg mx-auto px-4 py-16 text-center space-y-5">
        <div className="mx-auto h-14 w-14 rounded-2xl bg-muted flex items-center justify-center">
          <Car className="h-7 w-7 text-muted-foreground/50" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">{t("vin_public_not_found")}</h1>
          <p className="text-sm text-muted-foreground">{t("vin_public_not_found_desc")}</p>
        </div>
        <Button asChild className="mt-2">
          <Link href={`/${language}/checkout?vin=${vin}`}>{t("vin_public_check_cta")}</Link>
        </Button>
      </div>
      </>
    );
  }

  if (forbidden) {
    return null;
  }

  // ── Error (only when nothing was loaded yet) ───────────────────────────────
  if (isError && !data) {
    const kind = resolveVinReportErrorKind(error);
    return (
      <>
        {seoBlock}
        <VinReportErrorView
          kind={kind}
          language={language}
          showDashboardLink={kind !== "forbidden"}
          onRetry={kind === "server" || kind === "unknown" || kind === "rate_limit" ? () => void refetch() : undefined}
          isRetrying={isFetching}
        />
      </>
    );
  }

  if (!data) return null;

  const insuranceClaims = sortHistoryNewestFirst(
    sanitizeInsuranceClaims(repairDatedRecords(data.insuranceClaims, data.year), data.year),
  );
  const accidentSeverityCtx = {
    vehicleCountry: data.country,
    krwPerUsd,
    hasKoreanInsuranceClaims: insuranceClaims.length > 0,
  };
  const accidents = sortHistoryNewestFirst(
    sanitizeAccidents(repairDatedRecords(data.accidents, data.year), data.year).map((acc) => ({
      ...acc,
      severity: resolveAccidentSeverityForDisplay(acc, accidentSeverityCtx),
    })),
  );
  const accidentCount = accidents.length;
  const photos = (data.photos ?? (data.thumbnailUrl ? [data.thumbnailUrl] : [])).filter(Boolean);
  const heroPhotos = data.isUnlocked ? photos : photos.slice(0, 1);
  const mileageHistory = sortHistoryNewestFirst(sanitizeMileageHistory(data.mileageHistory, data.year));
  const ownerHistory = sortHistoryNewestFirst(sanitizeOwnerHistory(data.ownerHistory, data.year));
  const auctionHistory = sortHistoryNewestFirst(sanitizeAuctionHistory(data.auctionHistory, data.year));
  const marketData = data.marketData ?? null;
  const registryHistory = sortHistoryNewestFirst(
    sanitizeRegistryHistory(
      enrichRegistryHistoryDates(
        repairDatedRecords(data.registryHistory, data.year),
        [...(data.mileageHistory ?? []), ...(data.ownerHistory ?? [])],
        data.year,
      ),
      data.year,
      { listingOdometer: data.odometer },
    ),
  );
  const mileageSourceInput = {
    odometer: data.odometer,
    odometerLocked: data.odometerLocked === true,
    country: data.country,
    mileageHistory,
    ownerHistory,
    registryHistory,
  };
  const odometer = resolveLatestRecordedOdometer(mileageSourceInput);
  const mileageRecordedYear = resolveLatestOdometerRecordedYear(mileageSourceInput);
  const hasTheftData = data.stolen != null;
  const showAccidentsSection = data.isUnlocked && accidents.length > 0;
  const showMileageSection = data.isUnlocked && hasMileageData(odometer, mileageHistory);
  const showOwnershipSection = data.isUnlocked && hasOwnershipData(ownerHistory, data.ownerCount);
  const showAuctionSection = data.isUnlocked && auctionHistory.length > 0;
  const showSafetySection = data.isUnlocked && hasSafetyData(data.salvage, data.stolen);
  const showMarketDataSection = data.isUnlocked && hasMeaningfulMarketData(marketData);

  const odoMax = 300000;
  const odoPct = odometer ? Math.min(100, (odometer / odoMax) * 100) : 0;
  const odoCol = odometer ? mileageColor(odometer) : null;

  const accidentSignals = countAccidentSignals({
    accidents,
    accidentCount: data.accidentCount,
    insuranceClaims,
    registryHistory,
  });

  const scoreData = data.isUnlocked
    ? computeVinConditionScore(
        scoreInputFromPublic({ ...data, odometer, mileageHistory, insuranceClaims, registryHistory, accidents }),
        t,
      )
    : null;

  const countryLabels = countryLabelsFromT(t);
  const fmtCountry = (value?: string | null) =>
    value ? formatCountryName(value, language, countryLabels) : null;

  const heroSummary = buildVinHeroSummaryItems({
    t,
    locked: !data.isUnlocked,
    accidentsCount: accidentSignals,
    odometer,
    hasMileage: odometer != null && !!odoCol,
    hasSalvageData: data.salvage != null,
    isSalvage: data.salvage,
    hasTheftData: data.stolen != null,
    isStolen: data.stolen,
  });

  const lockedHint = t("vin_public_locked_hint");

  const vehicleSpecFields = [
    { icon: Car, label: t("free_decoder_field_make"), value: data.make },
    { icon: Car, label: t("free_decoder_field_model"), value: data.model },
    { icon: Calendar, label: t("free_decoder_field_year"), value: data.year ? String(data.year) : null },
    ...(data.isUnlocked && data.trim
      ? [{ icon: Car, label: t("free_decoder_field_trim"), value: data.trim }]
      : []),
    ...(data.isUnlocked
      ? [{ icon: Fuel, label: t("free_decoder_field_fuel_type"), value: translateFuelType(t, data.fuelType) ?? cleanLabel(data.fuelType) }]
      : []),
    { icon: Gauge, label: t("free_decoder_field_transmission"), value: translateValue(data.transmission, TRANSMISSION_KEYS, t) },
    { icon: Wrench, label: t("free_decoder_field_engine"), value: data.engine },
    { icon: Palette, label: t("color"), value: data.color },
    ...(data.isUnlocked
      ? [
          { icon: Box, label: t("free_decoder_field_body_type"), value: translateValue(data.bodyType, BODY_KEYS, t) ?? cleanLabel(data.bodyType) },
          { icon: Zap, label: t("hp"), value: data.hp ? `${data.hp} hp` : null },
          { icon: Settings2, label: t("cylinders"), value: data.cylinders ? String(data.cylinders) : null },
        ]
      : []),
  ].filter((field) => field.value);

  const printReportUrl = typeof window !== "undefined" ? buildShareUrl() : undefined;

  const accidentPrintHighlights = buildAccidentPrintHighlights(
    accidents, t, language, data.country, krwPerUsd, data.year, insuranceClaims.length > 0, countryLabels,
  );
  const insurancePrintHighlights = buildInsurancePrintHighlights(insuranceClaims, t, language, data.country, krwPerUsd, data.year);
  const mileagePrintRows = buildMileagePrintRows(mileageHistory, t, language, data.year, data.country);
  const ownerPrintRows = buildOwnerPrintRows(ownerHistory, language, data.year, countryLabels, data.country);
  const registryPrintRows = buildRegistryPrintRows(registryHistory, t, language, data.country, krwPerUsd, data.year);
  const auctionPrintRows = buildAuctionPrintRows(auctionHistory, t, language, data.year, countryLabels, data.country);
  const printMarketValue = marketData?.estimatedValue != null
    ? `${marketData.currency ?? "USD"} ${marketData.estimatedValue.toLocaleString()}`
    : null;
  const printLastAuction = marketData?.lastAuctionPrice != null
    ? [
        `$${marketData.lastAuctionPrice.toLocaleString()}`,
        marketData.lastAuctionDate
          ? formatMarketAuctionDate(marketData.lastAuctionDate, language, data.year, data.country)
          : null,
      ].filter(Boolean).join(" · ")
    : null;

  return (
    <>
      {seoBlock}

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIndex !== null && photos.length > 0 && (
          <PhotoLightbox
            photos={photos}
            index={lightboxIndex}
            onClose={closeLightbox}
            onNav={navLightbox}
          />
        )}
      </AnimatePresence>

      <div className={cn("max-w-6xl mx-auto px-3 sm:px-4 py-6 sm:py-10 print:py-0 print:px-0 space-y-4 sm:space-y-6 print:space-y-2 vin-report-print", !data.isUnlocked && "pb-28")}>

        {/* Back — signed-in users only */}
        {isSignedIn && (
          <Button variant="ghost" size="sm" asChild className="-ml-2 print:hidden">
            <Link href={`/${language}/dashboard`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("back_to_dashboard")}
            </Link>
          </Button>
        )}

        {!data.isUnlocked && <VinLookupDisabledBanner className="print:hidden" />}

        {data.isUnlocked && (
          <VinPrintSummary
            vehicleTitle={vehicleTitle}
            vin={vin}
            country={data.country}
            scoreValue={scoreData?.score}
            scoreLabel={scoreData?.label}
            make={data.make}
            model={data.model}
            year={data.year}
            engine={data.engine}
            transmission={translateValue(data.transmission, TRANSMISSION_KEYS, t) ?? data.transmission}
            fuelType={translateFuelType(t, data.fuelType) ?? undefined}
            color={data.color}
            bodyType={translateValue(data.bodyType, BODY_KEYS, t) ?? data.bodyType ?? undefined}
            hp={data.hp}
            odometer={odometer}
            titleStatus={data.titleStatus}
            photos={photos}
            accidentCount={accidentSignals}
            accidentHighlights={accidentPrintHighlights}
            insuranceCount={insuranceClaims.length}
            insuranceHighlights={insurancePrintHighlights}
            mileageRows={mileagePrintRows}
            ownerRows={ownerPrintRows}
            registryRows={registryPrintRows}
            auctionRows={auctionPrintRows}
            ownerCount={data.ownerCount}
            isSalvage={data.salvage}
            isStolen={data.stolen}
            hasSalvageData={data.salvage != null}
            hasTheftData={data.stolen != null}
            marketValue={printMarketValue}
            lastAuction={printLastAuction}
            reportUrl={printReportUrl}
          />
        )}

        <div className="vin-report-screen space-y-4 sm:space-y-6">
        <VinReportHero
          vehicleTitle={vehicleTitle}
          vin={vin}
          country={data.country}
          trim={data.trim}
          photos={heroPhotos}
          locked={!data.isUnlocked}
          lockedLabel={t("vin_public_locked_hint")}
          unlockedLabel={data.isUnlocked ? t("vin_public_unlocked_badge") : undefined}
          scoreData={scoreData}
          summaryItems={heroSummary}
          onPhotoClick={data.isUnlocked && heroPhotos.length > 0 ? (i) => openLightbox(i) : undefined}
        >
          {!data.isUnlocked ? (
            <>
              <VinLockedHeroStat label={t("vin_public_accidents_section")} />
              <VinLockedHeroStat label={t("vin_public_safety_section")} />
              <VinLockedHeroStat label={t("vin_public_mileage_section")} />
              <VinLockedHeroStat label={t("vin_result_owners_title")} />
            </>
          ) : (
            <>
          {showAccidentsSection && (
            <PassPill ok={false} labelOk="" labelFail={formatAccidentCount(t, accidentCount)} />
          )}
          {data.isUnlocked && odometer != null && odoCol ? (
            <div className="inline-flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground px-2 py-0.5 sm:px-2.5 sm:py-1 w-full justify-center shadow-sm">
              <Gauge className="h-3 w-3 shrink-0 opacity-90" />
              <span className="text-[11px] font-semibold tabular-nums truncate">
                {odometer.toLocaleString()} km
              </span>
            </div>
          ) : null}
          {data.isUnlocked && data.salvage != null ? (
            <PassPill ok={data.salvage === false} labelOk={t("report_no_salvage")} labelFail={t("salvage_flagged")} />
          ) : null}
          {data.isUnlocked && data.stolen != null ? (
            <PassPill ok={data.stolen === false} labelOk={t("report_not_stolen")} labelFail={t("theft_flagged")} />
          ) : null}
            </>
          )}
        </VinReportHero>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start print-two-col min-w-0">

          {/* RIGHT COLUMN — accidents, safety, mileage, owners */}
          <div className="space-y-4 sm:space-y-6 min-w-0 order-2 lg:order-2 print:order-2">
            {!data.isUnlocked ? (
              <>
                <VinLockedSectionCard
                  title={t("vin_public_accidents_section")}
                  icon={AlertTriangle}
                  delay={0.15}
                  hint={lockedHint}
                />
                <VinLockedSectionCard
                  title={t("vin_public_safety_section")}
                  icon={ShieldCheck}
                  delay={0.18}
                  hint={lockedHint}
                />
                <VinLockedSectionCard
                  title={t("vin_public_mileage_section")}
                  icon={Gauge}
                  delay={0.2}
                  hint={lockedHint}
                />
                <VinLockedSectionCard
                  title={t("vin_result_owners_title")}
                  icon={Users}
                  delay={0.22}
                  hint={lockedHint}
                />
              </>
            ) : (
              <>

            {/* Accident History */}
            {showAccidentsSection && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="rounded-2xl border bg-card overflow-hidden"
            >
              <div className="px-6 py-4 border-b">
                <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  {t("vin_public_accidents_section")}
                </h2>
              </div>
              <div className="px-6 py-5">
                <div className="space-y-3">
                  {accidents.map((acc, i) => {
                        const style = accidentSeverityStyle(acc.severity);
                        const isExpanded = expandedAccidents.has(i);
                        const hasExtra = acc.type || acc.primaryDamage || acc.secondaryDamage || acc.airbagDeployed != null || acc.odometerAtLoss != null || acc.lossAmount != null;
                        return (
                          <div key={i} className={`rounded-xl border ${style.card}`}>
                            <div className="p-4">
                              <div className="flex items-start gap-3">
                                <div className={`h-2.5 w-2.5 rounded-full mt-1.5 shrink-0 ${style.dot}`} />
                                <div className="flex-1 space-y-0.5 min-w-0">
                                  <div className="flex items-center justify-between gap-2 flex-wrap">
                                    <p className={style.text}>
                                      {translateValue(acc.severity, SEVERITY_KEYS, t) ?? t("sev_moderate")}
                                    </p>
                                    {hasExtra && (
                                      <button
                                        onClick={() => toggleAccident(i)}
                                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                                      >
                                        {t("report_details")}
                                        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", isExpanded && "rotate-180")} />
                                      </button>
                                    )}
                                  </div>
                                  {acc.date && (
                                    <p className="text-xs text-muted-foreground">
                                      {localizeAccidentDate(acc.date, language, data.year, data.country)}
                                    </p>
                                  )}
                                  {acc.country && (
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                      <MapPin className="h-3 w-3 shrink-0" />{fmtCountry(acc.country)}
                                    </p>
                                  )}
                                  {cleanStr(acc.description) && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {formatAccidentDescription(t, language, acc.description)}
                                  </p>
                                  )}
                                </div>
                              </div>
                              <AnimatePresence>
                                {isExpanded && hasExtra && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden"
                                  >
                                    <div className="mt-3 pt-3 border-t border-current/10 grid grid-cols-2 gap-x-6 gap-y-2">
                                      {acc.type && (
                                        <div>
                                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{t("accident_type")}</p>
                                          <p className="text-xs font-medium">
                                            {formatAccidentType(t, acc.type)}
                                          </p>
                                        </div>
                                      )}
                                      {acc.primaryDamage && (
                                        <div>
                                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{t("primary_damage")}</p>
                                          <p className="text-xs font-medium">{translateDamageLabel(t, acc.primaryDamage)}</p>
                                        </div>
                                      )}
                                      {acc.secondaryDamage && (
                                        <div>
                                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{t("secondary_damage")}</p>
                                          <p className="text-xs font-medium">{translateDamageLabel(t, acc.secondaryDamage)}</p>
                                        </div>
                                      )}
                                      {acc.odometerAtLoss != null && (
                                        <div>
                                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{t("odometer_at_loss")}</p>
                                          <p className="text-xs font-medium">{acc.odometerAtLoss.toLocaleString()} km</p>
                                        </div>
                                      )}
                                      {acc.lossAmount != null && (
                                        <div>
                                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{t("loss_amount")}</p>
                                          <p className="text-xs font-medium">
                                            {shouldFormatAccidentLossAsKrw({
                                              vehicleCountry: data.country,
                                              accidentType: acc.type,
                                              accidentCountry: acc.country,
                                              hasKoreanInsuranceClaims: insuranceClaims.length > 0,
                                            }) ? (
                                              <KoreanWonAmount krw={acc.lossAmount} krwPerUsd={krwPerUsd} />
                                            ) : (
                                              `$${acc.lossAmount.toLocaleString()}`
                                            )}
                                          </p>
                                        </div>
                                      )}
                                      {acc.airbagDeployed != null && (
                                        <div>
                                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{t("airbag_deployed")}</p>
                                          <Badge
                                            variant="outline"
                                            className={cn("text-[10px] mt-0.5", acc.airbagDeployed
                                              ? "border-red-300 text-red-700 dark:text-red-400"
                                              : "border-green-300 text-green-700 dark:text-green-400"
                                            )}
                                          >
                                            {acc.airbagDeployed ? t("airbag_yes") : t("airbag_no")}
                                          </Badge>
                                        </div>
                                      )}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </div>
                        );
                      })}
                    </div>
              </div>
            </motion.div>
            )}

            {/* Safety Status — Salvage & Theft */}
            {showSafetySection && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18 }}
              className="rounded-2xl border bg-card overflow-hidden"
            >
              <div className="px-6 py-4 border-b flex items-center justify-between gap-2">
                <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  {t("safety_status")}
                </h2>
                {data.isUnlocked && (data.salvage != null || data.stolen != null) && (
                  <PassPill
                    ok={data.salvage !== true && data.stolen !== true}
                    labelOk={t("all_clear")}
                    labelFail={t("issue_found")}
                  />
                )}
              </div>
              <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
                {data.salvage != null && (
                <div className="flex items-center gap-3">
                  {data.salvage === true
                    ? <ShieldAlert className="h-5 w-5 text-red-500 shrink-0" />
                    : <ShieldCheck className="h-5 w-5 text-green-500 shrink-0" />}
                  <div>
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wide">{t("report_salvage")}</p>
                    <p className={cn("text-sm font-semibold", data.salvage === true ? "text-red-600 dark:text-red-400" : "text-green-700 dark:text-green-400")}>
                      {data.salvage === true ? t("report_salvage_flag") : t("report_clean_flag")}
                    </p>
                  </div>
                </div>
                )}
                {data.stolen != null && (
                <div className="flex items-center gap-3">
                  {data.stolen === true
                    ? <ShieldAlert className="h-5 w-5 text-red-500 shrink-0" />
                    : <ShieldCheck className="h-5 w-5 text-green-500 shrink-0" />}
                  <div>
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wide">{t("report_theft")}</p>
                    <p className={cn("text-sm font-semibold", data.stolen === true ? "text-red-600 dark:text-red-400" : "text-green-700 dark:text-green-400")}>
                      {data.stolen === true ? t("report_stolen_flag") : t("report_not_stolen")}
                    </p>
                  </div>
                </div>
                )}
                {cleanStr(data.titleStatus) && (
                  <div className="sm:col-span-2 flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground uppercase tracking-wide">{t("title_status")}</p>
                      <p className="text-sm font-semibold">{translateTitleStatus(t, data.titleStatus)}</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
            )}

            {/* Auction History */}
            {showAuctionSection && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.19 }}
              className="rounded-2xl border bg-card overflow-hidden"
            >
              <div className="px-5 py-3 border-b flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-emerald-500 shrink-0" />
                <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  {t("auction_history")}
                </h2>
                <Badge variant="secondary" className="ml-auto text-xs">
                  {auctionHistory.length}
                </Badge>
              </div>
              <div className="px-4 py-3">
                <AuctionHistoryTimeline history={auctionHistory} t={t} language={language} vehicleYear={data.year} vehicleCountry={data.country} />
              </div>
            </motion.div>
            )}

            {/* Mileage Timeline */}
            {showMileageSection && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl border bg-card overflow-hidden"
            >
              <div className="px-5 py-3 border-b flex items-center justify-between gap-2">
                <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  {t("vin_public_mileage_section")}
                </h2>
                {odometer != null && odoCol && (
                  <div className="inline-flex flex-col items-end gap-0.5 rounded-full px-2.5 py-1 bg-primary text-primary-foreground shadow-sm shrink-0">
                    <div className="inline-flex items-center gap-1.5">
                      <Gauge className="h-3 w-3 shrink-0 opacity-90" />
                      <AnimatedMileageBadge
                        odometer={odometer}
                        className="text-[11px] font-semibold tabular-nums"
                      />
                    </div>
                    {mileageRecordedYear != null ? (
                      <span className="text-[9px] font-medium tabular-nums opacity-75 leading-none pr-0.5">
                        {mileageRecordedYear}
                      </span>
                    ) : null}
                  </div>
                )}
              </div>
              <div className="px-4 py-3">
                {odometer != null && odoCol ? (
                  <VinMileageGauge
                    odometer={odometer}
                    odoMax={odoMax}
                    t={t}
                    size="sm"
                    showScale={mileageHistory.length <= 1}
                    className={mileageHistory.length > 1 ? "mb-4 pb-3 border-b border-border/60" : "mb-4"}
                  />
                ) : null}
                <MileageTimeline history={mileageHistory} t={t} language={language} vehicleYear={data.year} vehicleCountry={data.country} />
              </div>
            </motion.div>
            )}

            {/* Owner History */}
            {showOwnershipSection && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22 }}
              className="rounded-2xl border bg-card overflow-hidden"
            >
              <div className="px-6 py-4 border-b">
                <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  {t("vin_result_owners_title")}
                </h2>
              </div>
              {ownerHistory.length > 0 ? (
                <div className="px-6 py-5">
                  <OwnerHistoryTimeline history={ownerHistory} t={t} language={language} vehicleYear={data.year} vehicleCountry={data.country} />
                </div>
              ) : data.ownerCount != null ? (
                <div className="px-6 py-5">
                  <p className="text-sm font-semibold">
                    {data.ownerCount === 1 ? t("owner_single") : `${data.ownerCount} ${t("owner_many_suffix")}`}
                  </p>
                </div>
              ) : null}
            </motion.div>
            )}

              </>
            )}

          </div>{/* END RIGHT COLUMN */}

          {/* LEFT COLUMN — photos, specs, market */}
          <div className="space-y-4 sm:space-y-6 min-w-0 order-1 lg:order-1 print:order-1 overflow-hidden">

            {/* Vehicle Specs */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl border bg-card px-6 py-5"
            >
              <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
                {t("report_specs")}
              </h2>
              <VehicleSpecsGrid>
                {vehicleSpecFields.map(({ icon, label, value }) => (
                  <SpecRow key={label} icon={icon} label={label} value={value} />
                ))}
              </VehicleSpecsGrid>
            </motion.div>

            {data.isUnlocked && (
              <>
            <InsuranceClaimsSection
              claims={insuranceClaims}
              country={data.country}
              vehicleYear={data.year}
              krwPerUsd={krwPerUsd}
              t={t}
              language={language}
              variant="public"
              delay={0.11}
            />

            <RegistryHistorySection
              events={registryHistory}
              country={data.country}
              vehicleYear={data.year}
              krwPerUsd={krwPerUsd}
              t={t}
              language={language}
              variant="public"
              delay={0.115}
            />

            {/* Market Data */}
            {showMarketDataSection && marketData && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 }}
                className="rounded-2xl border bg-card px-6 py-5"
              >
                <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
                  {t("report_market_data")}
                </h2>
                <MarketValueChart
                  marketData={marketData}
                  auctionHistory={auctionHistory}
                  t={t}
                  language={language}
                  vehicleCountry={data.country}
                  className="mb-5"
                />
                <div className="space-y-4">
                  {marketData.estimatedValue != null && (
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-[11px] text-muted-foreground uppercase tracking-wide">{t("report_estimated_value")}</p>
                        <p className="text-sm font-bold tabular-nums">
                          {marketData.currency ?? "USD"} {marketData.estimatedValue.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}
                  {marketData.lastAuctionPrice != null && (
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-[11px] text-muted-foreground uppercase tracking-wide">{t("report_last_auction")}</p>
                        <p className="text-sm font-bold tabular-nums">
                          ${marketData.lastAuctionPrice.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}
                  {marketData.lastAuctionDate && (
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-[11px] text-muted-foreground uppercase tracking-wide">{t("report_auction_date")}</p>
                        <p className="text-sm font-semibold">
                          {formatMarketAuctionDate(marketData.lastAuctionDate, language, data.year, data.country)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

              </>
            )}

          </div>{/* END LEFT COLUMN */}

        </div>{/* END 2-COLUMN GRID */}
        </div>{/* END vin-report-screen */}

        {data.isUnlocked && (
          <VinReportShareCard
            vin={vin}
            language={language}
            vehicleTitle={vehicleTitle}
            preview={{
              thumbnailUrl: photos[0] ?? data.thumbnailUrl ?? null,
              odometer,
              accidentCount: accidentSignals,
              ownerCount: data.ownerCount ?? null,
            }}
            basePath={basePath}
          />
        )}

        <PrintReportBranding vin={vin} variant="bottom" />
      </div>

      {/* ── Sticky Unlock Bar ── */}
        {!data.isUnlocked && (
        <div
          className="fixed bottom-0 inset-x-0 z-50 print:hidden"
          style={{ background: "linear-gradient(135deg, #0f1923 0%, #1a2f20 100%)", borderTop: "1px solid rgba(31,163,84,0.25)" }}
        >
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-white">{t("vin_public_unlock_title")}</p>
              <p className="text-xs text-white/50 truncate hidden sm:block">
                {t("vin_public_unlock_desc")}
              </p>
            </div>
            <Button
              className="shrink-0 gap-1.5 rounded-full px-5 font-bold shadow-lg"
              style={{ boxShadow: "0 0 16px rgba(31,163,84,0.35)" }}
              onClick={handleUnlock}
            >
              <Lock className="h-3.5 w-3.5" />
              {priceStr
                ? `${t("vin_public_check_cta")} — ${priceStr}`
                : t("vin_public_check_cta")}
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
