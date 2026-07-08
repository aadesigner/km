import { cn } from "@/lib/utils";

const FLAG_ICONS_VERSION = "7.5.0";

const prefetched = new Set<string>();

export type FlagVariant = "default" | "nav" | "list";

/** Display size (px) — width; height = width × 3/4 (standard 4:3 flag) */
const FLAG_WIDTH: Record<FlagVariant, number> = {
  nav: 14,
  list: 16,
  default: 18,
};

/**
 * lipis/flag-icons — consistent 4:3 SVGs (not flagcdn; no circle crop).
 * @see https://github.com/lipis/flag-icons
 */
export function flagUrl(code: string): string {
  return `https://cdn.jsdelivr.net/npm/flag-icons@${FLAG_ICONS_VERSION}/flags/4x3/${code}.svg`;
}

export function prefetchFlags(codes: string[]): void {
  if (typeof window === "undefined") return;
  for (const code of codes) {
    if (prefetched.has(code)) continue;
    prefetched.add(code);
    const img = new Image();
    img.src = flagUrl(code);
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
  /** Width in px (height follows 4:3). */
  size?: number;
  variant?: FlagVariant;
  className?: string;
  priority?: boolean;
}) {
  const width = size ?? FLAG_WIDTH[variant];
  const height = Math.round((width * 3) / 4);

  return (
    <img
      src={flagUrl(code)}
      width={width}
      height={height}
      alt=""
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={priority ? "high" : "low"}
      className={cn(
        "shrink-0 rounded-[2px] object-contain",
        "shadow-[0_0_0_0.5px_rgba(0,0,0,0.08)]",
        className,
      )}
    />
  );
}
