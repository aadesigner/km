import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

/** Brand assets in `public/` — PNG wordmarks with transparent backgrounds. */
export const BRAND_ASSETS = {
  /** Full wordmark for dark backgrounds (white “km” text). */
  logoWhite: `${basePath}/brand/logo-white.png`,
  /** Full wordmark for light backgrounds (gray “km” text). */
  logoDark: `${basePath}/brand/logo-dark.png`,
  /** Shield symbol — favicon / compact mark. */
  favicon: `${basePath}/favicon-32x32.png`,
} as const;

const prefetchedBrand = new Set<string>();

/** Warm navbar wordmarks so the mobile sidebar logo does not flash on open. */
export function prefetchBrandAssets(): void {
  if (typeof window === "undefined") return;
  for (const src of [BRAND_ASSETS.logoWhite, BRAND_ASSETS.logoDark]) {
    if (prefetchedBrand.has(src)) continue;
    prefetchedBrand.add(src);
    const img = new Image();
    img.decoding = "sync";
    img.src = src;
  }
}

export type KmcheckLogoVariant = "light" | "dark";

/** Full horizontal kmcheck.com wordmark. */
export function KmcheckLogo({
  variant,
  className,
  syncDecode = false,
}: {
  /** `dark` = dark background → white wordmark; `light` = light background → gray wordmark. */
  variant?: KmcheckLogoVariant;
  className?: string;
  /** Prefer for menus that remount — avoids a blank flash while the PNG decodes. */
  syncDecode?: boolean;
}) {
  const { resolvedTheme } = useTheme();
  const resolved = variant ?? (resolvedTheme === "dark" ? "dark" : "light");
  const src = resolved === "dark" ? BRAND_ASSETS.logoWhite : BRAND_ASSETS.logoDark;

  return (
    <img
      src={src}
      alt="kmcheck.com"
      width={160}
      height={40}
      fetchPriority="high"
      className={cn("h-auto w-auto max-w-none object-contain", className)}
      decoding={syncDecode ? "sync" : "async"}
    />
  );
}

/** Compact shield symbol (favicon asset). */
export function KmcheckMark({ className }: { className?: string }) {
  return (
    <img
      src={BRAND_ASSETS.favicon}
      alt=""
      width={24}
      height={24}
      className={cn("object-contain", className)}
      aria-hidden="true"
      decoding="async"
    />
  );
}

/** Wordmark for print/PDF (always dark-on-white). */
export function KmcheckPrintLogo({ className }: { className?: string }) {
  return (
    <img
      src={BRAND_ASSETS.logoDark}
      alt="kmcheck.com"
      width={120}
      height={28}
      className={cn("h-6 w-auto object-contain object-left", className)}
      decoding="async"
    />
  );
}
