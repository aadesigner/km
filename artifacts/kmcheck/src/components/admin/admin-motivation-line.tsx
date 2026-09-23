import { useMemo } from "react";
import { pickAdminMotivation } from "@/lib/admin-motivation";
import { cn } from "@/lib/utils";

/** One-liner under Overview performance cards — random on each stats refresh. */
export function AdminMotivationLine({
  revenue,
  checks,
  signups,
  seed,
  className,
}: {
  revenue: number;
  checks: number;
  signups: number;
  /** Change on refresh to re-roll (e.g. dataUpdatedAt). */
  seed: number;
  className?: string;
}) {
  const text = useMemo(
    () => pickAdminMotivation({ revenue, checks, signups }, Math.abs(Math.sin(seed)) % 1 || Math.random()),
    [revenue, checks, signups, seed],
  );

  return (
    <p
      className={cn(
        "mt-3 md:mt-3.5 text-[12px] md:text-[13px] leading-relaxed text-muted-foreground/90",
        "border-l-2 border-primary/35 pl-3 md:pl-3.5 italic",
        className,
      )}
    >
      {text}
    </p>
  );
}
