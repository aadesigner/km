import type { ReactNode } from "react";
import { CheckCircle2, XCircle, Gauge, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { mileageColor } from "@/lib/mileage-color";
import { formatMilesInParens } from "@/lib/format-km-with-miles";
import { SalvageMeaningHint } from "@/components/salvage-meaning-hint";
import { FlagImg } from "@/components/flag-img";
import { formatImageFlagAlt } from "@/lib/flag-alt";

export type UnlockStatusFlag = {
  key: string;
  ok: boolean;
  label: string;
  trailing?: ReactNode;
};

type Props = {
  odometerKm?: number | null;
  formatMiles?: (km: number) => string;
  mileageLabel?: string;
  /** Localized country / market name shown beside mileage on desktop. */
  originLabel?: string | null;
  originFlagCode?: string | null;
  originEyebrow?: string;
  tForFlagAlt?: (key: string) => string;
  flags: UnlockStatusFlag[];
  lead?: ReactNode;
  className?: string;
};

const ODO_GAUGE_MAX_KM = 300_000;

function StatusRow({
  ok,
  label,
  trailing,
  className,
}: {
  ok: boolean;
  label: string;
  trailing?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 sm:px-3",
        ok
          ? "border-emerald-200/70 bg-emerald-50/70 dark:border-emerald-800/45 dark:bg-emerald-950/35"
          : "border-red-200/70 bg-red-50/70 dark:border-red-800/45 dark:bg-red-950/35",
        className,
      )}
    >
      {ok ? (
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
      ) : (
        <XCircle className="h-3.5 w-3.5 shrink-0 text-red-600 dark:text-red-400" />
      )}
      <span
        className={cn(
          "min-w-0 flex-1 text-left text-[10px] sm:text-[11px] font-semibold leading-snug",
          ok ? "text-emerald-800 dark:text-emerald-300" : "text-red-800 dark:text-red-300",
        )}
      >
        {label}
      </span>
      {trailing}
    </div>
  );
}

function OriginCard({
  label,
  flagCode,
  eyebrow,
  tForFlagAlt,
  className,
}: {
  label: string;
  flagCode?: string | null;
  eyebrow?: string;
  tForFlagAlt?: (key: string) => string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 items-center gap-2 rounded-xl border border-border/55",
        "bg-gradient-to-br from-muted/45 via-muted/25 to-transparent px-2.5 py-2",
        className,
      )}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-background ring-1 ring-border/50 shadow-sm">
        {flagCode ? (
          <FlagImg
            code={flagCode}
            size={22}
            className="rounded-sm"
            alt={tForFlagAlt ? formatImageFlagAlt(label, tForFlagAlt) : ""}
          />
        ) : (
          <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </span>
      <span className="min-w-0 flex flex-col gap-0.5">
        {eyebrow ? (
          <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {eyebrow}
          </span>
        ) : null}
        <span className="text-xs sm:text-[13px] font-bold text-foreground leading-snug break-words">
          {label}
        </span>
      </span>
    </div>
  );
}

/** Unlocked report status: mileage + origin row, then flags in a 2×2 grid. */
export function VinReportStatusGrid({
  odometerKm,
  formatMiles,
  mileageLabel = "Mileage",
  originLabel,
  originFlagCode,
  originEyebrow,
  tForFlagAlt,
  flags,
  lead,
  className,
}: Props) {
  const odoCol = odometerKm != null && odometerKm > 0 ? mileageColor(odometerKm) : null;
  const milesText =
    odometerKm != null && formatMiles ? formatMiles(odometerKm) : null;
  const gaugePct =
    odometerKm != null && odometerKm > 0
      ? Math.min(100, Math.round((odometerKm / ODO_GAUGE_MAX_KM) * 100))
      : 0;
  const hasMileage = Boolean(odoCol && odometerKm != null);
  const hasOrigin = Boolean(originLabel?.trim());

  return (
    <div className={cn("w-full min-w-0 space-y-1.5", className)}>
      {lead}

      {(hasMileage || hasOrigin) && (
        <div
          className={cn(
            "flex flex-row items-stretch gap-1.5",
          )}
        >
          {hasMileage && odometerKm != null && odoCol ? (
            <div
              className={cn(
                "relative min-w-0 overflow-hidden rounded-xl border px-3 py-2.5 sm:px-3.5",
                "border-border/55 bg-gradient-to-br from-background via-background to-muted/40",
                "shadow-[inset_0_1px_0_0_hsl(var(--foreground)/0.04)]",
                hasOrigin ? "w-[60%] flex-[0_0_60%] sm:w-[62%] sm:flex-[0_0_62%]" : "w-full",
              )}
            >
              <div
                aria-hidden
                className={cn(
                  "vin-mileage-wash pointer-events-none absolute -right-6 -top-8 h-24 w-24 rounded-full blur-2xl opacity-[0.10]",
                  odoCol.bar,
                )}
              />
              <div className="relative flex items-center gap-2.5">
                <div
                  className={cn(
                    "relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                    "bg-muted/60 ring-1 ring-border/50",
                    odoCol.text,
                  )}
                >
                  <svg viewBox="0 0 36 36" className="absolute inset-1 h-8 w-8 -rotate-90" aria-hidden>
                    <circle
                      cx="18"
                      cy="18"
                      r="14"
                      fill="none"
                      className="stroke-muted-foreground/15"
                      strokeWidth="3"
                    />
                    <circle
                      cx="18"
                      cy="18"
                      r="14"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeDasharray={`${(gaugePct / 100) * 88} 88`}
                      className="opacity-90"
                    />
                  </svg>
                  <Gauge className="relative h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    {mileageLabel}
                  </p>
                  <p className={cn("mt-0.5 text-lg sm:text-xl font-black tabular-nums leading-none tracking-tight", odoCol.text)}>
                    {odometerKm.toLocaleString()}
                    <span className="ml-1 text-[11px] sm:text-xs font-bold opacity-70">km</span>
                    {milesText ? (
                      <span className="ml-1.5 text-[10px] sm:text-xs font-medium text-muted-foreground opacity-90">
                        {milesText}
                      </span>
                    ) : null}
                  </p>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted/80 ring-1 ring-inset ring-border/40">
                    <div
                      className={cn("h-full rounded-full transition-[width] duration-500", odoCol.bar)}
                      style={{ width: `${Math.max(4, gaugePct)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {hasOrigin && originLabel ? (
            <OriginCard
              label={originLabel}
              flagCode={originFlagCode}
              eyebrow={originEyebrow}
              tForFlagAlt={tForFlagAlt}
              className={cn(
                hasMileage ? "w-[40%] flex-[0_0_40%] sm:w-[38%] sm:flex-[0_0_38%] sm:min-w-[9.75rem]" : "w-full",
              )}
            />
          ) : null}
        </div>
      )}

      {(hasMileage || hasOrigin) && flags.length > 0 ? (
        <div
          aria-hidden
          className="-mx-2.5 sm:-mx-5 !mt-2.5 border-t border-border/40"
        />
      ) : null}

      {flags.length > 0 ? (
        <div
          className={cn(
            "grid grid-cols-2 gap-1.5",
            (hasMileage || hasOrigin) && "!mt-0 pt-2.5",
          )}
        >
          {flags.map((f) => (
            <StatusRow
              key={f.key}
              ok={f.ok}
              label={f.label}
              trailing={f.trailing}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

/** Salvage / stolen / flood / taxi flags for unlocked reports. */
export function buildUnlockStatusFlags(opts: {
  isSalvage: boolean;
  isStolen: boolean;
  isTaxi: boolean;
  isFlooded?: boolean | null;
  showFlood: boolean;
  labels: {
    salvageOk: string;
    salvageFail: string;
    stolenOk: string;
    stolenFail: string;
    floodOk: string;
    floodFail: string;
    taxiOk: string;
    taxiFail: string;
  };
}): UnlockStatusFlag[] {
  const flags: UnlockStatusFlag[] = [
    {
      key: "salvage",
      ok: !opts.isSalvage,
      label: opts.isSalvage ? opts.labels.salvageFail : opts.labels.salvageOk,
      trailing: opts.isSalvage ? <SalvageMeaningHint className="shrink-0" /> : null,
    },
    {
      key: "stolen",
      ok: !opts.isStolen,
      label: opts.isStolen ? opts.labels.stolenFail : opts.labels.stolenOk,
    },
  ];
  if (opts.showFlood) {
    flags.push({
      key: "flood",
      ok: opts.isFlooded !== true,
      label: opts.isFlooded === true ? opts.labels.floodFail : opts.labels.floodOk,
    });
  }
  flags.push({
    key: "taxi",
    ok: !opts.isTaxi,
    label: opts.isTaxi ? opts.labels.taxiFail : opts.labels.taxiOk,
  });
  return flags;
}

export function statusGridMilesParen(km: number, t: (key: string) => string) {
  return formatMilesInParens(km, t);
}
