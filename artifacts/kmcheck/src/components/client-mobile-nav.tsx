import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "wouter";
import { FileText, Search, User, HelpCircle, Tag } from "lucide-react";
import { useTranslation } from "@/i18n/context";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import { prefetchRouteFromHref } from "@/lib/prefetch-route";
import {
  dashboardPath,
  isDashboardLocation,
  isOffersLocation,
  normalizeClientPath,
  parseDashboardView,
} from "@/lib/dashboard-nav";

import { SUPPORTED_LANGS } from "@/lib/languages";

const LANGS = new Set<string>(SUPPORTED_LANGS);

/** Pages where the logged-in bottom nav should not appear. */
export function isClientMobileNavExcluded(pathname: string): boolean {
  const path = normalizeClientPath(pathname);
  if (path.startsWith("/adminx")) return true;

  const segs = path.split("/").filter(Boolean);
  if (segs.length < 2 || !LANGS.has(segs[0])) return false;

  const section = segs[1];
  if (section === "checkout" || section === "vin") return true;
  if (
    section === "sign-in"
    || section === "sign-up"
    || section === "forgot-password"
    || section === "reset-password"
    || section === "set-password"
  ) {
    return true;
  }

  return false;
}

export function useShowClientMobileNav(): boolean {
  const { isSignedIn, isLoaded } = useAuth();
  const [location] = useLocation();
  return isLoaded && !!isSignedIn && !isClientMobileNavExcluded(location);
}

/** Extra space for the raised Check VIN control above the bar. */
export const CLIENT_MOBILE_NAV_PADDING = "pb-[calc(4.25rem+env(safe-area-inset-bottom,0px))]";

type NavItem = {
  id: string;
  icon: typeof FileText;
  label: string;
  href: string;
  active: boolean;
};

export function ClientMobileNav() {
  const { t, language } = useTranslation();
  const { isSignedIn } = useAuth();
  const [location, setLocation] = useLocation();
  const show = useShowClientMobileNav();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentPath = normalizeClientPath(location);
  const isDashboard = isDashboardLocation(currentPath, language);
  const dashboardView = parseDashboardView(currentPath, language);
  const isHome = currentPath === `/${language}`;

  const isOffers = isOffersLocation(currentPath, language);

  const items: NavItem[] = [
    {
      id: "help",
      icon: HelpCircle,
      label: t("help"),
      href: dashboardPath(language, "help"),
      active: isDashboard && dashboardView === "help",
    },
    {
      id: "offers",
      icon: Tag,
      label: t("nav_offers"),
      href: `/${language}/pricing`,
      active: isOffers,
    },
    {
      id: "check-vin",
      icon: Search,
      label: t("check_vin"),
      href: `/${language}`,
      active: isHome,
    },
    {
      id: "reports",
      icon: FileText,
      label: t("my_reports"),
      href: dashboardPath(language),
      active: isDashboard && dashboardView === "reports",
    },
    {
      id: "account",
      icon: User,
      label: t("account"),
      href: dashboardPath(language, "account"),
      active: isDashboard && dashboardView === "account",
    },
  ];

  const navigateTo = useCallback((href: string) => {
    const target = normalizeClientPath(href);
    if (currentPath !== target) {
      setLocation(href);
    }
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [currentPath, setLocation]);

  if (!show || !mounted) return null;

  const nav = (
    <nav
      aria-label="Main navigation"
      className={cn(
        "md:hidden fixed bottom-0 inset-x-0 z-40 print:hidden",
        "border-t border-border/60 bg-background/92 backdrop-blur-md",
      )}
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="relative mx-auto flex h-14 max-w-lg items-stretch px-1">
        {items.map(({ id, icon: Icon, label, href, active }) => {
          const isCheckVin = id === "check-vin";

          if (isCheckVin) {
            return (
              <div key={id} className="relative flex min-w-0 flex-1 items-end justify-center">
                <button
                  type="button"
                  aria-current={active ? "page" : undefined}
                  aria-label={label}
                  className={cn(
                    "absolute bottom-2 z-10 flex flex-col items-center gap-1",
                    "touch-manipulation select-none",
                    "transition-transform duration-75 active:scale-[0.97]",
                  )}
                  onPointerDown={() => {
                    prefetchRouteFromHref(href, { isSignedIn });
                  }}
                  onClick={() => navigateTo(href)}
                >
                  {/* Icon-only circle raised above the bar; label sits below, outside the fill */}
                  <span
                    className={cn(
                      "-mt-3 flex h-11 w-11 items-center justify-center rounded-full",
                      "bg-primary text-primary-foreground",
                      "shadow-md shadow-primary/25",
                      active && "ring-2 ring-primary/20",
                    )}
                  >
                    <Icon className="h-5 w-5 shrink-0 pointer-events-none" strokeWidth={2.25} />
                  </span>
                  <span
                    className={cn(
                      "max-w-[5.75rem] truncate text-center text-[10px] font-semibold leading-tight pointer-events-none",
                      active ? "text-primary" : "text-foreground",
                    )}
                  >
                    {label}
                  </span>
                </button>
              </div>
            );
          }

          return (
            <button
              key={id}
              type="button"
              aria-current={active ? "page" : undefined}
              aria-label={label}
              className={cn(
                "relative flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-0.5",
                "touch-manipulation select-none transition-colors duration-75",
                active ? "text-primary" : "text-muted-foreground active:text-foreground",
              )}
              onPointerDown={() => {
                prefetchRouteFromHref(href, { isSignedIn });
              }}
              onClick={() => navigateTo(href)}
            >
              {active && (
                <span
                  aria-hidden
                  className="absolute inset-x-3 top-0 h-[2px] rounded-full bg-primary"
                />
              )}
              <Icon
                className="h-[18px] w-[18px] shrink-0 pointer-events-none"
                strokeWidth={active ? 2.25 : 1.75}
              />
              <span
                className={cn(
                  "max-w-full truncate px-0.5 text-center text-[10px] leading-tight pointer-events-none",
                  active ? "font-semibold" : "font-medium",
                )}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );

  return createPortal(nav, document.body);
}
