import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "wouter";
import { FileText, Search, User, HelpCircle } from "lucide-react";
import { useTranslation } from "@/i18n/context";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import { prefetchRouteFromHref } from "@/lib/prefetch-route";
import { ShoppingBag } from "lucide-react";
import {
  dashboardPath,
  isDashboardLocation,
  isPurchasesLocation,
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

  const isPurchases = isPurchasesLocation(currentPath, language);

  const items: NavItem[] = [
    {
      id: "reports",
      icon: FileText,
      label: t("my_reports"),
      href: dashboardPath(language),
      active: isDashboard && dashboardView === "reports",
    },
    {
      id: "purchases",
      icon: ShoppingBag,
      label: t("nav_purchases"),
      href: `/${language}/purchases`,
      active: isPurchases,
    },
    {
      id: "check-vin",
      icon: Search,
      label: t("check_vin"),
      href: `/${language}`,
      active: isHome,
    },
    {
      id: "account",
      icon: User,
      label: t("account"),
      href: dashboardPath(language, "account"),
      active: isDashboard && dashboardView === "account",
    },
    {
      id: "help",
      icon: HelpCircle,
      label: t("help"),
      href: dashboardPath(language, "help"),
      active: isDashboard && dashboardView === "help",
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
      className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background shadow-[0_-4px_24px_rgba(0,0,0,0.08)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.35)] print:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="grid grid-cols-5 items-end">
        {items.map(({ id, icon: Icon, label, href, active }) => {
          const isCheckVin = id === "check-vin";

          if (isCheckVin) {
            return (
              <button
                key={id}
                type="button"
                aria-current={active ? "page" : undefined}
                aria-label={label}
                className="relative -mt-4 flex min-h-[3rem] flex-col items-center justify-end gap-1 px-0.5 pb-1.5 touch-manipulation select-none"
                onPointerDown={() => {
                  prefetchRouteFromHref(href, { isSignedIn });
                }}
                onClick={() => navigateTo(href)}
              >
                <span
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-transform active:scale-95",
                    "bg-gradient-to-br from-primary to-[hsl(158,72%,34%)] text-primary-foreground",
                    "ring-4 ring-background",
                    active && "ring-primary/25 shadow-primary/30",
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0 pointer-events-none" />
                </span>
                <span className="text-[9px] font-semibold leading-tight text-center pointer-events-none text-primary max-w-full truncate px-0.5">
                  {label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={id}
              type="button"
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-[3rem] flex-col items-center justify-center gap-0.5 px-0.5 pt-1 pb-2 touch-manipulation select-none",
                "active:bg-muted/60 transition-colors",
                active ? "text-primary" : "text-muted-foreground",
              )}
              onPointerDown={() => {
                prefetchRouteFromHref(href, { isSignedIn });
              }}
              onClick={() => navigateTo(href)}
            >
              <Icon className="h-5 w-5 shrink-0 pointer-events-none" />
              <span className="text-[9px] font-medium leading-tight text-center pointer-events-none max-w-full truncate px-0.5">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );

  return createPortal(nav, document.body);
}
