import { useState, useEffect, useRef } from "react";
import { X, ExternalLink } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { useTranslation } from "@/i18n/context";

type Announcement = {
  id: number;
  message: string;
  linkText: string | null;
  linkUrl: string | null;
  showTo: string;
  pages: string;
  endsAt: string | null;
};

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

const PAGE_SLUGS: Record<string, string[]> = {
  home:        ["/", ""],
  pricing:     ["/pricing"],
  checkout:    ["/checkout"],
  decoder:     ["/free-vin-decoder"],
  country:     ["/cars/"],
  auth:        ["/sign-in", "/sign-up"],
};

function matchesPage(pages: string, location: string): boolean {
  if (pages === "all") return true;
  const allowed = pages.split(",").map(s => s.trim()).filter(Boolean);
  const langStripped = location.replace(/^\/[a-z]{2}/, "") || "/";

  for (const slug of allowed) {
    const matchers = PAGE_SLUGS[slug];
    if (!matchers) continue;
    for (const m of matchers) {
      if (m.endsWith("/")) {
        if (langStripped.startsWith(m) || langStripped === m.slice(0, -1)) return true;
      } else {
        if (langStripped === m || langStripped.startsWith(m + "/") || langStripped.startsWith(m + "?")) return true;
      }
    }
  }
  return false;
}

export function AnnouncementBar({ onHeightChange }: { onHeightChange?: (height: number) => void }) {
  const [data, setData] = useState<Announcement | null | undefined>(undefined);
  const [dismissed, setDismissed] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);
  const { isSignedIn, isLoaded } = useAuth();
  const [location] = useLocation();
  const { language } = useTranslation();

  useEffect(() => {
    fetch(`${basePath}/api/announcements/active?lang=${language}`, { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(setData)
      .catch(() => setData(null));
  }, [language]);

  useEffect(() => {
    if (data?.id != null) {
      const stored = localStorage.getItem("kmcheck_dismissed_announcement");
      if (stored === String(data.id)) setDismissed(true);
      else setDismissed(false);
    }
  }, [data?.id]);

  const visible =
    isLoaded &&
    data != null &&
    data !== undefined &&
    !dismissed &&
    matchesPage(data.pages, location) &&
    !(data.showTo === "guests" && isSignedIn) &&
    !(data.showTo === "users" && !isSignedIn);

  useEffect(() => {
    if (!onHeightChange) return;
    if (!visible) {
      onHeightChange(0);
      return;
    }
    const el = barRef.current;
    if (!el) return;
    const report = () => onHeightChange(el.getBoundingClientRect().height);
    report();
    const ro = new ResizeObserver(report);
    ro.observe(el);
    return () => ro.disconnect();
  }, [visible, onHeightChange, data?.message]);

  if (!visible || !data) return null;

  const handleDismiss = () => {
    localStorage.setItem("kmcheck_dismissed_announcement", String(data.id));
    setDismissed(true);
  };

  return (
    <div
      ref={barRef}
      className="fixed top-0 inset-x-0 z-[110] w-full text-white text-sm font-medium print:hidden"
      style={{
        background: "linear-gradient(90deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.8) 50%, hsl(var(--primary)) 100%)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-center gap-3 min-h-[40px]">
        <span className="text-center leading-snug">{data.message}</span>

        {data.linkUrl && (
          <a
            href={data.linkUrl}
            target={data.linkUrl.startsWith("http") ? "_blank" : undefined}
            rel="noopener noreferrer"
            className="shrink-0 inline-flex items-center gap-1 bg-white/20 hover:bg-white/30 transition-colors px-3 py-1 rounded-full text-xs font-bold"
          >
            {data.linkText || "Learn more"}
            {data.linkUrl.startsWith("http") && <ExternalLink className="h-3 w-3" />}
          </a>
        )}

        <button
          onClick={handleDismiss}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/20 transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
