import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type MarketingPriceProps = {
  amount: number;
  currencySymbol: string;
  loading?: boolean;
  compareAmount?: number | null;
  /** md = compact cards; lg = pricing hero */
  size?: "md" | "lg";
  align?: "center" | "start";
  className?: string;
};

/** Customer-facing price — symbol smaller than amount, avoids oversized single-line labels. */
export function MarketingPrice({
  amount,
  currencySymbol,
  loading,
  compareAmount,
  size = "lg",
  align = "center",
  className,
}: MarketingPriceProps) {
  const [whole, fraction] = amount.toFixed(2).split(".");

  return (
    <div
      className={cn(
        "flex flex-col gap-1",
        align === "center" ? "items-center" : "items-start",
        className,
      )}
    >
      {compareAmount != null && compareAmount > amount && (
        <span className="text-sm font-medium text-muted-foreground/55 line-through tabular-nums">
          {currencySymbol}
          {compareAmount.toFixed(2)}
        </span>
      )}
      {loading ? (
        <Skeleton className={cn(size === "lg" ? "h-11 w-28" : "h-8 w-20", "rounded-md")} />
      ) : (
        <div
          className={cn(
            "inline-flex items-baseline tabular-nums leading-none",
            align === "center" ? "justify-center" : "justify-start",
          )}
        >
          <span
            className={cn(
              "font-semibold text-primary/75 pr-0.5",
              size === "lg" ? "text-xl sm:text-2xl" : "text-base sm:text-lg",
            )}
          >
            {currencySymbol}
          </span>
          <span
            className={cn(
              "font-bold text-primary tracking-tight",
              size === "lg" ? "text-[2rem] sm:text-[2.35rem]" : "text-2xl sm:text-[1.65rem]",
            )}
          >
            {whole}
            <span className="text-[0.58em] font-semibold text-primary/90">.{fraction}</span>
          </span>
        </div>
      )}
    </div>
  );
}
