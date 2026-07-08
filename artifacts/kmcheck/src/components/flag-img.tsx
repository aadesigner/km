import { cn } from "@/lib/utils";

const prefetched = new Set<string>();

export function flagCdnUrl(code: string): string {
  return `https://flagcdn.com/${code}.svg`;
}

/** Warm the browser cache before rendering a picker list. */
export function prefetchFlags(codes: string[]): void {
  if (typeof window === "undefined") return;
  for (const code of codes) {
    if (prefetched.has(code)) continue;
    prefetched.add(code);
    const img = new Image();
    img.src = flagCdnUrl(code);
  }
}

export function FlagImg({
  code,
  size = 20,
  className,
  priority = false,
}: {
  code: string;
  size?: number;
  className?: string;
  /** Eager load for the visible/active flag in a trigger button. */
  priority?: boolean;
}) {
  const height = Math.max(8, Math.round(size * 0.75));
  return (
    <img
      src={flagCdnUrl(code)}
      width={size}
      height={height}
      alt=""
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={priority ? "high" : "low"}
      className={cn("rounded-[2px] object-cover shrink-0", className)}
    />
  );
}
