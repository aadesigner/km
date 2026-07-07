import { useAuth } from "@/lib/auth-context";
import { useLocation, Link } from "wouter";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getAdminGetStatsQueryOptions } from "@workspace/api-client-react";
import { ADMIN_QUERY_OPTIONS } from "@/lib/admin-query-options";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Users, Search, Server, Settings, LogOut, CreditCard, Activity, Tag, Menu, X, Mail, Database, ReceiptText, ShieldAlert, Megaphone, Clock, Puzzle, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { KmcheckLogo, KmcheckMark } from "@/components/logo";
import { SEOHead } from "@/components/seo";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

const navGroups = [
  {
    label: "Analytics",
    items: [
      { href: "/adminx", label: "Overview", icon: BarChart3, exact: true },
      { href: "/adminx/analytics", label: "Tracking", icon: Activity },
    ],
  },
  {
    label: "Management",
    items: [
      { href: "/adminx/users", label: "Users", icon: Users },
      { href: "/adminx/lookups", label: "VIN Lookups", icon: Search },
      { href: "/adminx/pending-vin-checks", label: "Pending Vin Checks", icon: Clock },
      { href: "/adminx/vin-catalog", label: "VIN Catalog", icon: Database },
      { href: "/adminx/pricing", label: "Pricing", icon: CreditCard },
      { href: "/adminx/coupons", label: "Coupons", icon: Tag },
      { href: "/adminx/announcements", label: "Announcements", icon: Megaphone },
      { href: "/adminx/transactions", label: "Transactions", icon: ReceiptText },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/adminx/providers", label: "Providers", icon: Server },
      { href: "/adminx/emails", label: "Emails", icon: Mail },
      { href: "/adminx/plugins", label: "Plugins", icon: Puzzle },
      { href: "/adminx/security", label: "Security & Logs", icon: ShieldAlert },
      { href: "/adminx/settings", label: "Settings", icon: Settings },
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
  const { user, isSignedIn, isLoaded } = useAuth();
  const queryClient = useQueryClient();
  const [location, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: pendingOpen = 0 } = useQuery({
    queryKey: ["/api/admin/pending-vin-checks", "nav-badge"],
    queryFn: async () => {
      const r = await fetch(`${basePath}/api/admin/pending-vin-checks?page=1&limit=1`, { credentials: "include" });
      if (!r.ok) return 0;
      const d = await r.json() as { total?: number };
      return d.total ?? 0;
    },
    enabled: isLoaded && isSignedIn && user?.isAdmin === true,
    ...ADMIN_QUERY_OPTIONS,
    staleTime: 60_000,
    refetchInterval: 60_000,
  });

  const isAdmin = user?.isAdmin === true;

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn || !isAdmin) {
      setLocation("/en");
    }
  }, [isLoaded, isSignedIn, isAdmin, setLocation]);

  useEffect(() => {
    if (!isLoaded || !isAdmin) return;
    void queryClient.prefetchQuery({
      ...getAdminGetStatsQueryOptions({ query: { ...ADMIN_QUERY_OPTIONS } }),
    });
  }, [isLoaded, isAdmin, queryClient]);

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

  if (!isSignedIn || !isAdmin) return null;

  const SidebarContent = () => (
    <>
      <div className="px-5 py-5 border-b">
        <Link href="/en" className="flex items-center">
          <KmcheckLogo className="h-8" />
        </Link>
        <div className="flex items-center gap-1.5 mt-2">
          <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-medium text-muted-foreground">Admin Panel</span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
        {navGroups.map(({ label, items }) => (
          <div key={label}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-3 mb-1.5">{label}</p>
            <div className="space-y-0.5">
              {items.map(({ href, label: itemLabel, icon: Icon, ...rest }) => {
                const exact = (rest as { exact?: boolean }).exact;
                const isActive = exact ? location === href : location.startsWith(href);
                const showPendingBadge = href === "/adminx/pending-vin-checks" && pendingOpen > 0;
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all active:scale-[0.98]",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="flex-1 min-w-0 truncate">{itemLabel}</span>
                    {showPendingBadge && (
                      <Badge
                        className={cn(
                          "text-[10px] px-1.5 min-w-[1.25rem] justify-center border-0",
                          isActive
                            ? "bg-white/20 text-primary-foreground hover:bg-white/20"
                            : "bg-amber-500 text-white hover:bg-amber-500"
                        )}
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

      <div className="p-3 border-t space-y-0.5">
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
    <>
      <SEOHead title="Admin — kmcheck.com" description="kmcheck administration panel" lang="en" noIndex />
    <div className="flex min-h-screen bg-muted/30">
      <aside className="hidden md:flex w-60 bg-background border-r flex-col shrink-0">
        <SidebarContent />
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-background border-r flex flex-col md:hidden transition-transform duration-200",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <button
          className="absolute top-3 right-3 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close menu"
        >
          <X className="h-4 w-4" />
        </button>
        <SidebarContent />
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="md:hidden sticky top-0 z-30 bg-background/95 backdrop-blur border-b flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2 font-semibold text-sm">
            <KmcheckMark className="h-5 w-5 text-primary" />
            <span>Admin</span>
          </div>
        </header>

        <main className="flex-1 overflow-auto pb-[4.5rem] md:pb-0">
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            {children}
          </div>
        </main>

        <nav
          className="md:hidden fixed bottom-0 inset-x-0 z-30 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
          aria-label="Admin quick navigation"
        >
          <div className="grid grid-cols-4">
            {mobileBottomNav.map(({ href, label, icon: Icon, ...rest }) => {
              const exact = (rest as { exact?: boolean }).exact;
              const isActive = exact ? location === href : location.startsWith(href);
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
  );
}
