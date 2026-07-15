import { TrendingDown } from "lucide-react";
import type { B2bCopy } from "./copy";

/** Shared banner: volume → better API/B2B pricing */
export function VolumePricingBanner({ c }: { c: B2bCopy }) {
  return (
    <div className="relative overflow-hidden rounded-[1.35rem] border border-emerald-500/30 bg-gradient-to-r from-emerald-700 via-emerald-800 to-teal-800 p-5 text-white shadow-lg shadow-emerald-900/20 sm:p-6">
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-emerald-300/20 blur-2xl" />
      <div className="relative flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15">
          <TrendingDown className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-200/90">
            {c.volumePricingBadge}
          </p>
          <h3 className="mt-1 text-lg font-semibold tracking-tight sm:text-xl">{c.volumePricingTitle}</h3>
          <p className="mt-2 text-sm leading-relaxed text-emerald-50/90">{c.volumePricingBody}</p>
        </div>
      </div>
    </div>
  );
}
