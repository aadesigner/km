import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { PrefetchLink } from "@/components/prefetch-link";
import {
  Car, ChevronRight, CheckCircle2, XCircle, Clock, AlertCircle, Trash2, ArrowUpDown,
} from "lucide-react";
import type { VinLookup, VinLookupStatus } from "@workspace/api-client-react";
import type { UseMutationResult } from "@tanstack/react-query";
import { useTranslation } from "@/i18n/context";
import { formatAccidentCount } from "@/lib/format-accident-count";
import { countAccidentSignals, hasAccidentSignals } from "@/lib/accident-signals";
import { mileageColor } from "@/lib/mileage-color";
import { resolveLatestRecordedOdometer } from "@/lib/resolve-latest-odometer";
import {
  DASHBOARD_FILTER_THRESHOLD,
  sortDashboardLookups,
  type DashboardLookupSort,
} from "@/lib/filter-dashboard-lookups";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  isVinImageSessionLoaded,
  markVinImageSessionLoaded,
} from "@/lib/vin-image-cache";

const SORT_OPTIONS: DashboardLookupSort[] = [
  "newest",
  "oldest",
  "year_desc",
  "year_asc",
];

const SORT_LABEL_KEYS: Record<DashboardLookupSort, string> = {
  newest: "dashboard_filter_newest",
  oldest: "dashboard_filter_oldest",
  year_desc: "dashboard_filter_year_new",
  year_asc: "dashboard_filter_year_old",
};

export const DASHBOARD_REPORTS_PER_PAGE = 12;

function isViewableReportStatus(status: string) {
  return status === "complete" || status === "pending_manual";
}

function StatusBadge({ status }: { status: VinLookupStatus | string }) {
  const { t } = useTranslation();
  const config: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode; className?: string }> = {
    complete: { variant: "default", icon: <CheckCircle2 className="h-3 w-3 mr-1" />, className: "bg-green-500 hover:bg-green-600 text-white border-0" },
    pending: { variant: "secondary", icon: <Clock className="h-3 w-3 mr-1" /> },
    pending_manual: { variant: "secondary", icon: <Clock className="h-3 w-3 mr-1" />, className: "bg-amber-500/15 text-amber-900 dark:text-amber-300 border-amber-500/35" },
    processing: { variant: "outline", icon: <AlertCircle className="h-3 w-3 mr-1" /> },
    error: { variant: "destructive", icon: <XCircle className="h-3 w-3 mr-1" /> },
  };
  const { variant, icon, className } = config[status] ?? config.pending;
  const labelMap: Record<string, string> = {
    complete: t("completed"),
    error: t("failed"),
    pending: t("pending"),
    pending_manual: t("pending_report_badge"),
    processing: t("processing"),
  };
  return (
    <Badge variant={variant} className={cn("flex items-center w-fit text-[10px] sm:text-xs shrink-0 px-1.5 py-0 sm:px-2 sm:py-0.5", className)}>
      {icon}{labelMap[status] ?? status}
    </Badge>
  );
}

type DeleteMutation = UseMutationResult<unknown, unknown, { id: number }, unknown>;

function resolveReportPhotoUrl(data: VinLookup["data"]): string | undefined {
  const vd = data as { photos?: string[]; thumbnailUrl?: string | null } | null | undefined;
  if (!vd) return undefined;
  if (Array.isArray(vd.photos) && vd.photos[0]) return vd.photos[0];
  if (typeof vd.thumbnailUrl === "string" && vd.thumbnailUrl) return vd.thumbnailUrl;
  return undefined;
}

function ReportListThumbnail({ src, alt }: { src?: string; alt: string }) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(() => (src ? isVinImageSessionLoaded(src) : false));

  const markReady = useCallback(() => {
    if (!src) return;
    markVinImageSessionLoaded(src);
    setReady(true);
    setFailed(false);
  }, [src]);

  useEffect(() => {
    setFailed(false);
    setReady(src ? isVinImageSessionLoaded(src) : false);
  }, [src]);

  useEffect(() => {
    const img = imgRef.current;
    if (img?.complete && img.naturalWidth > 0) markReady();
  }, [src, markReady]);

  if (!src || failed) {
    return (
      <div className="report-list-thumb-fallback h-11 w-11 sm:h-14 sm:w-14 bg-primary/10 flex items-center justify-center">
        <Car className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
      </div>
    );
  }

  return (
    <>
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        className={cn(
          "report-list-thumb h-11 w-[3.25rem] sm:h-14 sm:w-[4.5rem] object-cover transition-transform duration-200 group-hover/thumb:scale-[1.03]",
          !ready && "opacity-0",
        )}
        loading="lazy"
        decoding="async"
        onLoad={markReady}
        onError={() => setFailed(true)}
      />
      {!ready && (
        <div className="report-list-thumb-fallback absolute inset-0 h-11 w-11 sm:h-14 sm:w-14 bg-primary/10 flex items-center justify-center">
          <Car className="h-4 w-4 sm:h-5 sm:w-5 text-primary animate-pulse" />
        </div>
      )}
    </>
  );
}

function ReportCard({
  lookup,
  index,
  language,
  deleteLookup,
}: {
  lookup: VinLookup;
  index: number;
  language: string;
  deleteLookup: DeleteMutation;
}) {
  const { t } = useTranslation();
  const vd = lookup.data as (NonNullable<VinLookup["data"]> & {
    country?: string | null;
    registryHistory?: Array<{ mileage?: number | null; details?: Array<{ value?: string | null }> }>;
  }) | null | undefined;
  const odometer = resolveLatestRecordedOdometer({
    odometer: vd?.odometer,
    odometerLocked: vd?.odometerLocked === true,
    country: vd?.country,
    mileageHistory: vd?.mileageHistory as Array<{ odometer?: number | null }> | undefined,
    ownerHistory: vd?.ownerHistory as Array<{ mileage?: number | null }> | undefined,
    registryHistory: vd?.registryHistory as Array<{ mileage?: number | null; details?: Array<{ value?: string | null }> }> | undefined,
  });
  const make = vd?.make;
  const model = vd?.model;
  const year = vd?.year;
  const vehicleName = make && model ? `${year ? `${year} ` : ""}${make} ${model}` : null;
  const accidentSignalInput = {
    accidents: vd?.accidents as Array<{ severity?: string | null }> | undefined,
    accidentCount: vd?.accidentCount,
    insuranceClaims: vd?.insuranceClaims as Array<{ date?: string | null; type?: string | null; lossAmount?: number | null }> | undefined,
    registryHistory: vd?.registryHistory as Array<{ type?: string; title?: string | null; subtitle?: string | null; amount?: string | null; details?: Array<{ label?: string; value?: string | null }> }> | undefined,
  };
  const hasAccident = hasAccidentSignals(accidentSignalInput);
  const accidentCount = countAccidentSignals(accidentSignalInput);
  const hasMileage = odometer != null;
  const isSalvage = vd?.isSalvage === true;
  const hasDamageFlag = hasAccident || isSalvage;
  const damageDotTitle = hasAccident && isSalvage
    ? `${t("dashboard_accidents_found")} · ${t("badge_salvage")}`
    : hasAccident
      ? t("dashboard_accidents_found")
      : isSalvage
        ? t("badge_salvage")
        : t("dashboard_no_accidents");
  const photoUrl = resolveReportPhotoUrl(vd);
  const reportHref = `/${language}/vin/${lookup.vin}`;
  const viewable = isViewableReportStatus(lookup.status);

  const thumbnail = (
    <div className="relative shrink-0">
      <ReportListThumbnail src={photoUrl} alt={vehicleName ?? lookup.vin} />
    </div>
  );

  return (
    <div
      className={cn(
        "report-list-card relative flex items-center gap-2.5 sm:gap-4 bg-background rounded-xl sm:rounded-2xl border px-2.5 py-2.5 sm:px-4 sm:py-3 shadow-sm transition-all text-[13px] sm:text-sm",
        viewable
          ? "hover:border-primary/45 hover:shadow-md cursor-pointer group"
          : "hover:border-border/80",
      )}
    >
      {viewable && (
        <PrefetchLink
          href={reportHref}
          className="absolute inset-0 z-10 rounded-2xl"
          aria-label={`${t("view_report")} ${lookup.vin}`}
        >
          <span className="sr-only">{t("view_report")}</span>
        </PrefetchLink>
      )}

      {viewable ? (
        <PrefetchLink
          href={reportHref}
          className="relative z-20 shrink-0 rounded-xl overflow-hidden ring-1 ring-border/50 hover:ring-primary/50 transition-all group/thumb"
          aria-label={`${t("view_report")} ${lookup.vin}`}
        >
          {thumbnail}
        </PrefetchLink>
      ) : (
        <div className="shrink-0 rounded-xl overflow-hidden ring-1 ring-border/50">
          {thumbnail}
        </div>
      )}

      <div className="flex-1 min-w-0">
        {vehicleName ? (
          <>
            <p className="report-list-title font-bold text-[13px] sm:text-[15px] truncate leading-snug">{vehicleName}</p>
            <p className="report-list-vin font-mono text-[11px] sm:text-xs text-muted-foreground mt-0.5 truncate">{lookup.vin}</p>
          </>
        ) : (
          <p className="font-mono font-bold text-base tracking-wide truncate">{lookup.vin}</p>
        )}
        {hasMileage ? (
          <div className="flex items-center gap-2 mt-1.5">
            <div className="w-20 sm:w-24 h-1 bg-muted rounded-full overflow-hidden">
              <div
                className={cn("h-full rounded-full", mileageColor(odometer!).bar)}
                style={{ width: `${Math.min(100, (odometer! / 200000) * 100)}%` }}
              />
            </div>
            <span className="text-[11px] sm:text-xs text-muted-foreground tabular-nums font-medium">{odometer!.toLocaleString()} km</span>
          </div>
        ) : (
          <p className="text-[11px] sm:text-xs text-muted-foreground mt-1">
            {new Date(lookup.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
          </p>
        )}
        {isSalvage && (
          <Badge
            variant="outline"
            className="text-[10px] py-0 h-[1.125rem] mt-1 font-semibold border-orange-600/45 text-orange-800 bg-orange-50 dark:border-orange-500/40 dark:text-orange-400 dark:bg-orange-950/35"
          >
            {t("badge_salvage")}
          </Badge>
        )}
      </div>

      {lookup.status === "complete" && vd && (
        <div className="hidden sm:flex flex-col items-end gap-1.5 relative z-0 pointer-events-none">
          <div className="flex items-center gap-2">
            <div
              title={hasMileage ? t("dashboard_mileage_verified") : t("dashboard_mileage_unavailable")}
              className={cn("h-3 w-3 rounded-full", hasMileage ? "bg-primary" : "bg-muted-foreground/30")}
            />
            <div
              title={damageDotTitle}
              className={cn("h-3 w-3 rounded-full", hasDamageFlag ? "bg-red-500" : "bg-primary")}
            />
            <div
              title={`${vd.ownerCount ?? "?"} owner(s)`}
              className={cn("h-3 w-3 rounded-full", (vd.ownerCount ?? 1) > 2 ? "bg-muted-foreground/50" : "bg-primary")}
            />
          </div>
          {hasDamageFlag && (
            <span className="text-[11px] text-red-600 dark:text-red-400 font-medium tabular-nums">
              {hasAccident ? formatAccidentCount(t, accidentCount) : t("badge_salvage")}
            </span>
          )}
        </div>
      )}

      <div className="relative z-20 shrink-0">
        <StatusBadge status={lookup.status} />
      </div>
      {viewable ? (
        <Button size="sm" className="hidden lg:inline-flex gap-1 text-xs h-8 shrink-0 shadow-sm relative z-20 pointer-events-auto" asChild>
          <PrefetchLink href={reportHref}>
            {t("view_report")}
            <ChevronRight className="h-3.5 w-3.5" />
          </PrefetchLink>
        </Button>
      ) : lookup.status === "error" ? (
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 h-10 w-10 text-destructive hover:text-destructive hover:bg-destructive/10 relative z-20"
          disabled={deleteLookup.isPending}
          onClick={() => deleteLookup.mutate({ id: lookup.id })}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      ) : (
        <div className="w-10 shrink-0" />
      )}
      {viewable && (
        <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary/70 transition-colors shrink-0 relative z-0 pointer-events-none" />
      )}
    </div>
  );
}

function SortFilterBar({
  active,
  onSelect,
}: {
  active: DashboardLookupSort;
  onSelect: (sort: DashboardLookupSort) => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
      <span className="shrink-0 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-muted-foreground pr-1">
        <ArrowUpDown className="h-4 w-4" />
        {t("dashboard_filter_label")}
      </span>
      {SORT_OPTIONS.map((sort) => (
        <button
          key={sort}
          type="button"
          onClick={() => onSelect(sort)}
          className={cn(
            "shrink-0 rounded-full border px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold transition-all whitespace-nowrap",
            active === sort
              ? "bg-primary text-primary-foreground border-primary shadow-sm"
              : "bg-background hover:bg-muted/60 border-border/70 text-foreground",
          )}
        >
          {t(SORT_LABEL_KEYS[sort])}
        </button>
      ))}
    </div>
  );
}

function ReportPageTabs({
  page,
  totalPages,
  onSelect,
}: {
  page: number;
  totalPages: number;
  onSelect: (page: number) => void;
}) {
  return (
    <nav
      className="flex items-center justify-center gap-1.5 sm:gap-2 pt-2"
      aria-label="Report pages"
    >
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onSelect(p)}
          aria-current={p === page ? "page" : undefined}
          className={cn(
            "min-w-[2.25rem] h-9 sm:h-10 rounded-full border px-3 text-sm font-bold tabular-nums transition-all",
            p === page
              ? "bg-primary text-primary-foreground border-primary shadow-sm"
              : "bg-background hover:bg-muted/60 border-border/70 text-foreground",
          )}
        >
          {p}
        </button>
      ))}
    </nav>
  );
}

type Props = {
  lookups: VinLookup[];
  language: string;
  deleteLookup: DeleteMutation;
};

export function DashboardReportList({ lookups, language, deleteLookup }: Props) {
  const showFilter = lookups.length >= DASHBOARD_FILTER_THRESHOLD;
  const [sort, setSort] = useState<DashboardLookupSort>("newest");
  const [page, setPage] = useState(1);

  const sorted = useMemo(
    () => (showFilter ? sortDashboardLookups(lookups, sort) : lookups),
    [lookups, showFilter, sort],
  );

  const totalPages = Math.max(1, Math.ceil(sorted.length / DASHBOARD_REPORTS_PER_PAGE));
  const showPagination = sorted.length > DASHBOARD_REPORTS_PER_PAGE;

  useEffect(() => {
    setPage(1);
  }, [sort]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const displayed = useMemo(() => {
    if (!showPagination) return sorted;
    const start = (page - 1) * DASHBOARD_REPORTS_PER_PAGE;
    return sorted.slice(start, start + DASHBOARD_REPORTS_PER_PAGE);
  }, [sorted, page, showPagination]);

  return (
    <div className="client-report-list space-y-2.5 sm:space-y-3">
      {showFilter && (
        <SortFilterBar active={sort} onSelect={setSort} />
      )}
      {displayed.map((lookup, i) => (
        <ReportCard
          key={lookup.id ?? lookup.vin}
          lookup={lookup}
          index={i}
          language={language}
          deleteLookup={deleteLookup}
        />
      ))}
      {showPagination && (
        <ReportPageTabs page={page} totalPages={totalPages} onSelect={setPage} />
      )}
    </div>
  );
}
