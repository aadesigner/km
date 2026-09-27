import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

/** Brand assets in `public/` — PNG originals (email/print) + compact WebP for the UI. */
export const BRAND_ASSETS = {
  /** Full wordmark for dark backgrounds (white “km” text). */
  logoWhite: `${basePath}/brand/logo-white.png`,
  logoWhiteWebp: `${basePath}/brand/logo-white.webp`,
  /** Full wordmark for light backgrounds (gray “km” text). */
  logoDark: `${basePath}/brand/logo-dark.png`,
  logoDarkWebp: `${basePath}/brand/logo-dark.webp`,
  /** Shield symbol — favicon / compact mark. */
  favicon: `${basePath}/favicon-32x32.png`,
} as const;

const prefetchedBrand = new Set<string>();

function brandSources(variant: "white" | "dark"): { png: string; webp: string } {
  return variant === "white"
    ? { png: BRAND_ASSETS.logoWhite, webp: BRAND_ASSETS.logoWhiteWebp }
    : { png: BRAND_ASSETS.logoDark, webp: BRAND_ASSETS.logoDarkWebp };
}

/** Warm navbar wordmarks so the mobile sidebar logo does not flash on open. */
export function prefetchBrandAssets(): void {
  if (typeof window === "undefined") return;
  for (const src of [BRAND_ASSETS.logoWhiteWebp, BRAND_ASSETS.logoDarkWebp]) {
    if (prefetchedBrand.has(src)) continue;
    prefetchedBrand.add(src);
    const img = new Image();
    img.decoding = "async";
    img.src = src;
  }
}

export type KmcheckLogoVariant = "light" | "dark";

function Wordmark({
  webp,
  png,
  alt,
  width,
  height,
  className,
  syncDecode,
  fetchPriority,
}: {
  webp: string;
  png: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  syncDecode?: boolean;
  fetchPriority?: "high" | "low" | "auto";
}) {
  return (
    <picture className="inline-block max-w-none leading-none align-middle">
      <source type="image/webp" srcSet={webp} />
      <img
        src={png}
        alt={alt}
        width={width}
        height={height}
        fetchPriority={fetchPriority}
        className={cn("w-auto max-w-none object-contain", className)}
        decoding={syncDecode ? "sync" : "async"}
      />
    </picture>
  );
}

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
  const { png, webp } = brandSources(resolved === "dark" ? "white" : "dark");

  return (
    <Wordmark
      webp={webp}
      png={png}
      alt="kmcheck.com"
      width={160}
      height={40}
      className={className}
      syncDecode={syncDecode}
      fetchPriority="high"
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

/** Wordmark for print/PDF (always dark-on-white). PNG is more reliable in print. */
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
