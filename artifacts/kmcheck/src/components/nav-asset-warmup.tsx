import { NAV_MENU_WARMUP_SOURCES } from "@/lib/nav-assets";

/** Keeps navbar flag/logo bitmaps decoded after first paint (mobile sheet remounts). */
export function NavAssetWarmup() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed -left-[9999px] top-0 h-0 w-0 overflow-hidden opacity-0"
      tabIndex={-1}
    >
      {NAV_MENU_WARMUP_SOURCES.map((src) => (
        <img key={src} src={src} alt="" width={1} height={1} decoding="sync" />
      ))}
    </div>
  );
}
