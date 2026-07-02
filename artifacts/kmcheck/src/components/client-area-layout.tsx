import type { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import {
  FileText,
  Search,
  User,
  HelpCircle,
  ShoppingBag,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTranslation } from "@/i18n/context";
import { useAuth } from "@/lib/auth-context";
import { useClientAreaLiveRefresh } from "@/hooks/use-client-area-live-refresh";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  dashboardPath,
  parseClientAreaSection,
  type ClientAreaSection,
  type DashboardView,
} from "@/lib/dashboard-nav";

type NavItem = {
  id: ClientAreaSection;
  icon: LucideIcon;
  label: string;
  href?: string;
  view?: DashboardView;
};

type Props = {
  children: ReactNode;
  /** Renders above the client shell (e.g. pending VIN banner). */
  before?: ReactNode;
  className?: string;
};

function navItemClass(isActive: boolean) {
  return cn(
    "relative inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-all whitespace-nowrap",
    isActive
      ? "text-primary bg-primary/[0.08] shadow-sm shadow-primary/5"
      : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
    isActive && "after:absolute after:bottom-0 after:left-3 after:right-3 after:h-0.5 after:rounded-full after:bg-primary",
  );
}

export function ClientAreaLayout({ children, before, className }: Props) {
  const { t, language } = useTranslation();
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const activeSection = parseClientAreaSection(location, language);

  useClientAreaLiveRefresh();

  const setActiveView = (view: DashboardView) => {
    setLocation(dashboardPath(language, view));
  };

  const navItems: NavItem[] = [
    { id: "reports", icon: FileText, label: t("my_reports"), view: "reports" },
    { id: "purchases", icon: ShoppingBag, label: t("purchases_title"), href: `/${language}/purchases` },
    { id: "account", icon: User, label: t("account"), view: "account" },
    { id: "help", icon: HelpCircle, label: t("help"), view: "help" },
  ];

  return (
    <div className={cn("w-full min-h-[50vh] pb-12 md:pb-20", className)}>
      {before}

      {/* Desktop: in-flow client nav (scrolls with page) — no enter animation */}
      <div
        className={cn(
          "hidden md:block",
          "border-b border-border/60 bg-gradient-to-b from-muted/30 to-background",
        )}
      >
        <div className="max-w-6xl mx-auto px-6 h-[4.25rem] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href={dashboardPath(language, "account")}
              aria-label={t("account")}
              className="flex shrink-0 rounded-full ring-1 ring-border/50 bg-background p-0.5 hover:ring-primary/30 transition-all"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.avatarUrl ?? undefined} alt={user?.name || ""} />
                <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
              </Avatar>
            </Link>

            <div className="h-6 w-px bg-border/70 shrink-0" aria-hidden />

            <nav className="flex items-center gap-0.5 overflow-x-auto scrollbar-none min-w-0" aria-label={t("account")}>
              {navItems.map(({ id, icon: Icon, label, href, view }) => {
                const isActive = activeSection === id;
                if (href) {
                  return (
                    <Link key={id} href={href} className={navItemClass(isActive)}>
                      <Icon className="h-4 w-4 shrink-0" />
                      {label}
                    </Link>
                  );
                }
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => { if (view) setActiveView(view); }}
                    className={navItemClass(isActive)}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {label}
                  </button>
                );
              })}
            </nav>
          </div>

          <Button asChild size="sm" className="shrink-0 gap-2 rounded-lg px-4 shadow-sm shadow-primary/15">
            <Link href={`/${language}`}>
              <Search className="h-4 w-4" />
              {t("check_vin")}
            </Link>
          </Button>
        </div>
      </div>

      <div className="w-full max-w-6xl mx-auto">
        {children}
      </div>
    </div>
  );
}
