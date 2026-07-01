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
    "inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium transition-all border whitespace-nowrap",
    isActive
      ? "bg-gradient-to-r from-primary to-[hsl(158,72%,34%)] text-primary-foreground shadow-sm shadow-primary/20 border-primary/30"
      : "border-transparent text-muted-foreground hover:bg-muted/80 hover:text-foreground",
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
    <div className={cn("w-full min-h-[50vh]", className)}>
      {before}

      {/* Desktop: in-flow client nav (scrolls with page) */}
      <div
        className={cn(
          "hidden md:block",
          "border-b border-border/80 bg-background",
        )}
      >
        <div className="max-w-6xl mx-auto px-6 h-[4.25rem] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href={dashboardPath(language, "account")}
              aria-label={t("account")}
              className="flex shrink-0 rounded-full border border-border/60 bg-muted/30 p-1 hover:bg-muted/50 transition-colors"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.avatarUrl ?? undefined} alt={user?.name || ""} />
                <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
              </Avatar>
            </Link>

            <div className="h-6 w-px bg-border/80 shrink-0" aria-hidden />

            <nav className="flex items-center gap-1 overflow-x-auto scrollbar-none min-w-0" aria-label={t("account")}>
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

          <Button asChild size="sm" className="shrink-0 gap-2 rounded-full px-4 shadow-sm shadow-primary/15">
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
