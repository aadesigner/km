import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Shared share-card surface for VIN report sections.
 * Decorations (hairline + soft wash) live in CSS ::before/::after — no extra DOM per card.
 * Print flattens via .vin-report-section rules in index.css.
 */
export const VIN_REPORT_SECTION_SURFACE = cn(
  "vin-report-section relative overflow-hidden rounded-2xl border border-border/70 bg-card",
  "shadow-sm dark:shadow-[0_4px_20px_-8px_rgba(0,0,0,0.4)]",
  "print:shadow-none",
);

/** @deprecated Prefer CSS on .vin-report-section — kept for timeline one-off. */
export const VIN_REPORT_SECTION_RADIAL = "hidden";

/** @deprecated Prefer CSS on .vin-report-section — kept for timeline one-off. */
export const VIN_REPORT_SECTION_HAIRLINE = "hidden";

export type VinReportSectionAccent =
  | "primary"
  | "orange"
  | "sky"
  | "purple"
  | "emerald"
  | "rose"
  | "amber"
  | "slate";

const ACCENT_CHIP: Record<VinReportSectionAccent, string> = {
  primary: "bg-primary/10 text-primary",
  orange: "bg-orange-500/10 text-orange-500",
  sky: "bg-sky-500/10 text-sky-500",
  purple: "bg-purple-500/10 text-purple-500",
  emerald: "bg-emerald-500/10 text-emerald-500",
  rose: "bg-rose-500/10 text-rose-500",
  amber: "bg-amber-500/10 text-amber-500",
  slate: "bg-slate-500/10 text-slate-500",
};

export const ACCENT_HEADER_WASH: Record<VinReportSectionAccent, string> = {
  primary: "bg-primary/[0.03]",
  orange: "bg-orange-500/[0.03]",
  sky: "bg-sky-500/[0.03]",
  purple: "bg-purple-500/[0.03]",
  emerald: "bg-emerald-500/[0.03]",
  rose: "bg-rose-500/[0.03]",
  amber: "bg-amber-500/[0.03]",
  slate: "bg-slate-500/[0.03]",
};

/** Drives top hairline + corner wash via --vr-accent (see index.css). */
const ACCENT_FOCUS_VAR: Record<VinReportSectionAccent, string> = {
  primary: "[--vr-accent:hsl(var(--primary))]",
  orange: "[--vr-accent:#f97316]",
  sky: "[--vr-accent:#0ea5e9]",
  purple: "[--vr-accent:#a855f7]",
  emerald: "[--vr-accent:#10b981]",
  rose: "[--vr-accent:#f43f5e]",
  amber: "[--vr-accent:#f59e0b]",
  slate: "[--vr-accent:#64748b]",
};

type VinReportSectionProps = {
  children: ReactNode;
  className?: string;
  /** When false, omit CSS decoration class. Default true. */
  decorated?: boolean;
  /** Matches header chip color — top focus / wash use this instead of brand green. */
  accent?: VinReportSectionAccent;
};

export function VinReportSection({
  children,
  className,
  decorated = true,
  accent = "primary",
}: VinReportSectionProps) {
  return (
    <div
      className={cn(
        VIN_REPORT_SECTION_SURFACE,
        decorated && "vin-report-section--decorated",
        ACCENT_FOCUS_VAR[accent],
        className,
      )}
    >
      {children}
    </div>
  );
}

type VinReportSectionHeaderProps = {
  title: ReactNode;
  subtitle?: ReactNode;
  icon?: ElementType;
  accent?: VinReportSectionAccent;
  trailing?: ReactNode;
  /** Public-style uppercase muted title vs report-style bold title. */
  variant?: "report" | "public";
  className?: string;
};

export function VinReportSectionHeader({
  title,
  subtitle,
  icon: Icon,
  accent = "primary",
  trailing,
  variant = "report",
  className,
}: VinReportSectionHeaderProps) {
  return (
    <div
      className={cn(
        "px-4 py-2.5 sm:px-5 sm:py-3.5 border-b border-border/60 flex items-center justify-between gap-2",
        ACCENT_HEADER_WASH[accent],
        className,
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        {Icon ? (
          <div
            className={cn(
              "rounded-md flex items-center justify-center shrink-0",
              variant === "public" ? "h-7 w-7 rounded-lg" : "h-6 w-6",
              ACCENT_CHIP[accent],
            )}
          >
            <Icon className="h-3.5 w-3.5" />
          </div>
        ) : null}
        <div className="min-w-0">
          {variant === "public" ? (
            <h2 className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-muted-foreground truncate">
              {title}
            </h2>
          ) : (
            <h2 className="font-bold text-sm leading-tight truncate">{title}</h2>
          )}
          {subtitle ? (
            <div className="text-[10px] sm:text-[11px] text-muted-foreground leading-tight mt-0.5 line-clamp-2">
              {subtitle}
            </div>
          ) : null}
        </div>
      </div>
      {trailing ? <div className="shrink-0 flex items-center gap-2">{trailing}</div> : null}
    </div>
  );
}
