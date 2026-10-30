import { useAuth } from "@/lib/auth-context";
import { useLocation, Link } from "wouter";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminPendingCountQuery } from "@/lib/admin-query-options";
import {
  ADMIN_PENDING_COUNT_QUERY_KEY,
  fetchAdminPendingCount,
} from "@/lib/admin-pending-count";
import { splitRouterLocation } from "@/lib/normalize-app-path";
import { matchAdminRoute, normalizeAdminPath } from "@/lib/admin-routes";
import { canAccessAdminArea, canAccessAdminRoute, isFullAdmin } from "@/lib/admin-staff";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Users, Search, Server, Settings, LogOut, CreditCard, Activity, Tag, Menu, X, Mail, Database, ReceiptText, ShieldAlert, Megaphone, Clock, Puzzle, Home, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { KmcheckLogo, KmcheckMark } from "@/components/logo";
import { SEOHead } from "@/components/seo";
import { useTheme } from "@/components/theme-provider";
import { AdminPinGate } from "@/components/admin-pin-gate";
import { AdminThemeProvider, useAdminTheme, useAdminThemeDocumentSync } from "@/components/admin/admin-theme-provider";
import { AdminThemePicker } from "@/components/admin/admin-theme-picker";
import { AdminRevenueMoodBadge, useAdminRevenueMood } from "@/components/admin/admin-revenue-mood";

type NavItem = {
  href: string;
  label: string;
  icon: typeof BarChart3;
  exact?: boolean;
  adminOnly?: boolean;
};

const navGroups: Array<{ label: string; items: NavItem[] }> = [
  {
    label: "Analytics",
    items: [
      { href: "/adminx", label: "Overview", icon: BarChart3, exact: true },
      { href: "/adminx/analytics", label: "Analytics", icon: Activity },
    ],
  },
  {
    label: "Management",
    items: [
      { href: "/adminx/users", label: "Users", icon: Users },
      { href: "/adminx/lookups", label: "VIN Lookups", icon: Search },
      { href: "/adminx/pending-vin-checks", label: "Pending Vin Checks", icon: Clock },
      { href: "/adminx/vin-catalog", label: "VIN Catalog", icon: Database },
      { href: "/adminx/pricing", label: "Pricing", icon: CreditCard, adminOnly: true },
      { href: "/adminx/coupons", label: "Coupons", icon: Tag, adminOnly: true },
      { href: "/adminx/announcements", label: "Announcements", icon: Megaphone, adminOnly: true },
      { href: "/adminx/transactions", label: "Transactions", icon: ReceiptText },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/adminx/providers", label: "Providers", icon: Server, adminOnly: true },
      { href: "/adminx/emails", label: "Emails", icon: Mail, adminOnly: true },
      { href: "/adminx/plugins", label: "Plugins", icon: Puzzle, adminOnly: true },
      { href: "/adminx/security", label: "Security & Logs", icon: ShieldAlert, adminOnly: true },
      { href: "/adminx/settings", label: "Settings", icon: Settings, adminOnly: true },
    ],
  },
];

const mobileBottomNav = [
  { href: "/adminx", label: "Home", icon: Home, exact: true },
  { href: "/adminx/pending-vin-checks", label: "Pending", icon: Clock },
  { href: "/adminx/vin-catalog", label: "Catalog", icon: Database },
  { href: "/adminx/lookups", label: "Lookups", icon: Search },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminThemeProvider>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </AdminThemeProvider>
  );
}

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const { user, isSignedIn, isLoaded } = useAuth();
  const [location, setLocation] = useLocation();
  const { pathname } = splitRouterLocation(location);
  const navPath = normalizeAdminPath(pathname);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();
  const { themeId } = useAdminTheme();
  const toggleTheme = () => setTheme(resolvedTheme === "dark" ? "light" : "dark");

  const isStaff = canAccessAdminArea(user);
  const fullAdmin = isFullAdmin(user);
  useAdminThemeDocumentSync(isLoaded && isSignedIn && isStaff);
  /** Hide revenue mood chip + atmosphere on pending VIN work pages. */
  const isPendingVinPage = navPath.startsWith("/adminx/pending-vin-checks");
  const { mood, revenueToday, ready: moodReady } = useAdminRevenueMood(
    isLoaded && isSignedIn && isStaff && !isPendingVinPage,
  );

  const { data: pendingCount } = useQuery({
    queryKey: ADMIN_PENDING_COUNT_QUERY_KEY,
    queryFn: ({ signal }) => fetchAdminPendingCount(signal),
    ...adminPendingCountQuery(),
    enabled: isLoaded && isSignedIn && isStaff,
  });
  const pendingOpen = pendingCount?.open ?? 0;
  const visibleNavGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => fullAdmin || !item.adminOnly),
    }))
    .filter((group) => group.items.length > 0);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn || !isStaff) {
      setLocation("/en");
    }
  }, [isLoaded, isSignedIn, isStaff, setLocation]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !isStaff) return;
    const match = matchAdminRoute(navPath);
    if (!canAccessAdminRoute(user, match.id)) {
      setLocation("/adminx");
    }
  }, [isLoaded, isSignedIn, isStaff, navPath, setLocation, user]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location]);

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [sidebarOpen]);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Skeleton className="h-8 w-48" />
      </div>
    );
  }

  if (!isSignedIn || !isStaff) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Skeleton className="h-8 w-48" />
      </div>
    );
  }

  const SidebarContent = ({ mobile }: { mobile?: boolean }) => (
    <>
      <div className={cn("px-5 py-4 border-b border-border/60", mobile && "pr-12")}>
        <Link href="/en" className="flex items-center">
          <KmcheckLogo
            className="h-8"
            variant={themeId === "orbit" ? "dark" : undefined}
            syncDecode
          />
        </Link>
        <div className="flex items-center gap-1.5 mt-2">
          <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          <span className="text-xs font-medium text-muted-foreground">{fullAdmin ? "Admin Panel" : "Editor Panel"}</span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
        {visibleNavGroups.map(({ label, items }) => (
          <div key={label}>
            <p className="admin-nav-group-label text-[10px] font-bold uppercase tracking-widest px-3 mb-1.5">{label}</p>
            <div className="space-y-0.5">
              {items.map(({ href, label: itemLabel, icon: Icon, ...rest }) => {
                const exact = (rest as { exact?: boolean }).exact;
                const isActive = exact ? navPath === href : navPath.startsWith(href);
                const showPendingBadge = href === "/adminx/pending-vin-checks" && pendingOpen > 0;
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "admin-nav-link flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium",
                      isActive
                        ? "admin-nav-link--active text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="flex-1 min-w-0 truncate">{itemLabel}</span>
                    {showPendingBadge && (
                      <Badge
                        className="text-[10px] px-1.5 min-w-[1.25rem] justify-center border-0 bg-amber-500 text-white hover:bg-amber-500"
                      >
                        {pendingOpen}
                      </Badge>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-border/60 space-y-0.5">
        {mobile ? (
          <>
            <AdminThemePicker />
            <button
              type="button"
              onClick={toggleTheme}
              className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label={resolvedTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              {resolvedTheme === "dark" ? "Light mode" : "Dark mode"}
            </button>
          </>
        ) : null}
        <Link
          href="/en"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Back to Site
        </Link>
      </div>
    </>
  );

  return (
    <AdminPinGate>
    <>
      <SEOHead title="Admin — kmcheck.com" description="kmcheck administration panel" lang="en" noIndex />
    <div
      className="admin-shell flex min-h-screen max-w-[100vw] overflow-x-clip"
      data-admin-theme={themeId}
    >
      <aside className="admin-sidebar hidden md:flex fixed inset-y-0 left-0 z-30 w-64 border-r border-border/60 flex-col">
        <SidebarContent />
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      <aside className={cn(
        "admin-sidebar fixed inset-y-0 left-0 z-50 w-64 border-r border-border/60 flex flex-col md:hidden transition-transform duration-200",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <button
          type="button"
          className="admin-sidebar-close flex h-8 w-8 items-center justify-center rounded-lg text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-white/10"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close menu"
        >
          <X className="h-4 w-4" />
        </button>
        <SidebarContent mobile />
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Desktop: mood + theme + dark — bottom-right */}
        <div className="fixed bottom-4 right-4 z-40 hidden md:flex flex-col items-end gap-2.5">
          {moodReady && mood ? (
            <AdminRevenueMoodBadge mood={mood} revenueToday={revenueToday} />
          ) : null}
          <div className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/90 p-1 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/80">
            <AdminThemePicker toolbar />
            <button
              type="button"
              onClick={toggleTheme}
              className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label={resolvedTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              title={resolvedTheme === "dark" ? "Light mode" : "Dark mode"}
            >
              {resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <header className="md:hidden sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border/60 flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2 font-semibold text-sm min-w-0">
            <KmcheckMark className="h-5 w-5 text-primary shrink-0" />
            <span>{fullAdmin ? "Admin" : "Editor"}</span>
          </div>
        </header>

        <main className="admin-main flex-1 min-w-0 overflow-y-auto overflow-x-clip pb-[4.5rem] md:pb-0">
          <div className="p-3 sm:p-4 lg:p-6 w-full min-w-0 max-w-[88rem] mx-auto md:pb-24">
            {children}
          </div>
        </main>

        <nav
          className="md:hidden fixed bottom-0 inset-x-0 z-30 border-t border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
          aria-label="Admin quick navigation"
        >
          <div className="grid grid-cols-4">
            {mobileBottomNav.map(({ href, label, icon: Icon, ...rest }) => {
              const exact = (rest as { exact?: boolean }).exact;
              const isActive = exact ? navPath === href : navPath.startsWith(href);
              const showBadge = href === "/adminx/pending-vin-checks" && pendingOpen > 0;
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "relative flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{label}</span>
                  {showBadge && (
                    <span className="absolute top-1.5 right-[calc(50%-1.25rem)] min-w-[1rem] h-4 px-1 rounded-full bg-amber-500 text-white text-[9px] font-bold flex items-center justify-center">
                      {pendingOpen > 9 ? "9+" : pendingOpen}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
    </>
    </AdminPinGate>
  );
}
