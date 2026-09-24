import { useEffect, useState } from "react";
import { NAV_MENU_WARMUP_SOURCES } from "@/lib/nav-assets";
import { shouldDeferHeavyClientWarmup } from "@/hooks/use-light-motion";

/** Keeps navbar flag/logo bitmaps decoded after first paint (mobile sheet remounts). */
export function NavAssetWarmup() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Skip on phones / Save-Data — decode storms compete with hero CTA.
    if (shouldDeferHeavyClientWarmup()) return;

    // Defer past first paint so cold iOS loads don't sync-decode flags/logos mid-hero.
    let idleId: number | undefined;
    const start = window.setTimeout(() => {
      if (typeof window.requestIdleCallback === "function") {
        idleId = window.requestIdleCallback(() => setReady(true), { timeout: 2_500 });
      } else {
        setReady(true);
      }
    }, 700);
    return () => {
      window.clearTimeout(start);
      if (idleId != null && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleId);
      }
    };
  }, []);

  if (!ready) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed -left-[9999px] top-0 h-0 w-0 overflow-hidden opacity-0"
      tabIndex={-1}
    >
      {NAV_MENU_WARMUP_SOURCES.map((src) => (
        <img key={src} src={src} alt="" width={1} height={1} decoding="async" />
      ))}
    </div>
  );
}
