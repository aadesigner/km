import { cn } from "@/lib/utils";

const prefetched = new Set<string>();

export type FlagVariant = "default" | "compact";

const FLAG_DIMS: Record<FlagVariant, { w: number; h: number }> = {
  /** Standard 4:3 — footer, country columns */
  default: { w: 20, h: 15 },
  /** Taller, narrower crop — navbar triggers & pickers */
  compact: { w: 13, h: 16 },
};

/** 2× PNG — flagcdn supports WxH paths (not hNN). */
export function flagCdnUrl(code: string, variant: FlagVariant = "default"): string {
  const { w, h } = FLAG_DIMS[variant];
  return `https://flagcdn.com/${w * 2}x${h * 2}/${code}.png`;
}

/** Warm the browser cache before rendering a picker list. */
export function prefetchFlags(codes: string[], variant: FlagVariant = "compact"): void {
  if (typeof window === "undefined") return;
  for (const code of codes) {
    const key = `${variant}:${code}`;
    if (prefetched.has(key)) continue;
    prefetched.add(key);
    const img = new Image();
    img.src = flagCdnUrl(code, variant);
  }
}

export function FlagImg({
  code,
  size,
  variant = "default",
  className,
  priority = false,
}: {
  code: string;
  /** Overrides variant width (height follows variant aspect). */
  size?: number;
  variant?: FlagVariant;
  className?: string;
  /** Eager load for the visible/active flag in a trigger button. */
  priority?: boolean;
}) {
  const base = FLAG_DIMS[variant];
  const width = size ?? base.w;
  const height = Math.round(width * (base.h / base.w));

  return (
    <img
      src={flagCdnUrl(code, variant)}
      width={width}
      height={height}
      alt=""
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={priority ? "high" : "low"}
      className={cn(
        "shrink-0 rounded-[3px] object-cover object-center",
        "ring-1 ring-black/10 dark:ring-white/15 shadow-[0_0_0_0.5px_rgba(0,0,0,0.04)]",
        className,
      )}
    />
  );
}
