import { useState, useEffect, useRef, useCallback, useLayoutEffect, forwardRef, type ButtonHTMLAttributes, type CSSProperties, type Dispatch, type MouseEvent as ReactMouseEvent, type MutableRefObject, type SetStateAction } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation } from "wouter";
import { PrefetchLink } from "@/components/prefetch-link";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation, ensureDict } from "@/i18n/context";
import { useTheme } from "@/components/theme-provider";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Moon, Sun, User, Shield, LogOut, X,
  ChevronRight, ChevronDown,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Footer } from "@/components/footer";
import { KmcheckLogo } from "@/components/logo";
import { BannedSessionRedirect } from "@/components/banned-session-redirect";
import { cn } from "@/lib/utils";
import { setStoredLangPreference } from "@/lib/lang-preference";
import { AnnouncementBar } from "@/components/announcement-bar";
import { ClientMobileNav, useShowClientMobileNav, CLIENT_MOBILE_NAV_PADDING } from "@/components/client-mobile-nav";
import { LANG_PICKER_OPTIONS, isSupportedLang, replaceLangInPath, type Language } from "@/lib/languages";
import { FlagImg } from "@/components/flag-img";
import { formatImageFlagAlt } from "@/lib/flag-alt";
import { LangPickerList, usePrefetchPickerFlags } from "@/components/lang-picker-list";
import { NavAssetWarmup } from "@/components/nav-asset-warmup";
import { prefetchNavMenuAssets } from "@/lib/nav-assets";
import { prefetchCountryPages, prefetchAuthAreaRoutes, prefetchRoute, prefetchCommonRoutes } from "@/lib/prefetch-route";

const LANGS = LANG_PICKER_OPTIONS.map((l) => ({
  code: l.code,
  label: l.label,
  short: l.short,
  img: l.flag,
}));

const COUNTRY_CONTINENTS = ["americas", "asia"] as const;
type CountryContinent = (typeof COUNTRY_CONTINENTS)[number];

const CONTINENT_LABEL_KEY: Record<CountryContinent, "nav_continent_americas" | "nav_continent_asia"> = {
  americas: "nav_continent_americas",
  asia: "nav_continent_asia",
};

const COUNTRY_LINKS = [
  {
    slug: "canada",
    img: "ca",
    continent: "americas" as const,
    labelKey: "country_canada_label" as const,
    nameKey: "country_canada_name" as const,
    countKey: "country_canada_count" as const,
  },
  {
    slug: "usa",
    img: "us",
    continent: "americas" as const,
    labelKey: "country_usa_label" as const,
    nameKey: "country_usa_name" as const,
    countKey: "country_usa_count" as const,
  },
  {
    slug: "korea",
    img: "kr",
    continent: "asia" as const,
    labelKey: "country_korea_label" as const,
    nameKey: "country_korea_name" as const,
    countKey: "country_korea_count" as const,
  },
  {
    slug: "uae",
    img: "ae",
    continent: "asia" as const,
    labelKey: "country_uae_label" as const,
    nameKey: "country_uae_name" as const,
    countKey: "country_uae_count" as const,
  },
  {
    slug: "china",
    img: "cn",
    continent: "asia" as const,
    labelKey: "country_china_label" as const,
    nameKey: "country_china_name" as const,
    countKey: "country_china_count" as const,
  },
] as const;

const NAV_COUNTRY_FLAGS = COUNTRY_LINKS.map((link) => link.img);

function CountryNavMenuGroups({
  language,
  isActive,
  onNavigate,
  layout = "desktop",
}: {
  language: string;
  isActive: (slug: string) => boolean;
  onNavigate?: () => void;
  layout?: "desktop" | "mobile";
}) {
  const { t } = useTranslation();
  const groups = COUNTRY_CONTINENTS.map((continent) => ({
    continent,
    items: COUNTRY_LINKS.filter((link) => link.continent === continent),
  }));

  if (layout === "mobile") {
    return (
      <>
        {groups.map((group, groupIndex) => (
          <div key={group.continent}>
            <p
              className={cn(
                "px-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground",
                groupIndex > 0 ? "pt-3" : "pt-1",
              )}
            >
              {t(CONTINENT_LABEL_KEY[group.continent])}
            </p>
            {group.items.map(({ slug, img, labelKey }) => {
              const active = isActive(slug);
              return (
                <Link
                  key={slug}
                  href={`/${language}/cars/${slug}`}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium touch-manipulation",
                    active ? "bg-primary/8 text-primary" : "hover:bg-primary/[0.06] active:bg-primary/10",
                  )}
                >
                  <FlagImg code={img} size={20} priority className="w-3.5 h-2.5" alt={formatImageFlagAlt(t(labelKey), t)} />
                  <span className="flex-1">{t(labelKey)}</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </Link>
              );
            })}
          </div>
        ))}
      </>
    );
  }

  return (
    <div role="menu" className="p-2">
      {groups.map((group, groupIndex) => (
        <div key={group.continent} className={cn(groupIndex > 0 && "mt-1.5 border-t border-border/50 pt-1.5")}>
          <p className="px-2.5 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/80">
            {t(CONTINENT_LABEL_KEY[group.continent])}
          </p>
          <ul className="space-y-0.5">
            {group.items.map(({ slug, img, labelKey }) => {
              const active = isActive(slug);
              const label = t(labelKey);
              return (
                <li key={slug} role="none">
                  <Link
                    href={`/${language}/cars/${slug}`}
                    role="menuitem"
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-sm font-medium tracking-tight",
                      "transition-colors duration-75",
                      active
                        ? "bg-primary/[0.09] text-primary"
                        : "text-foreground/85 hover:bg-muted/70 hover:text-foreground dark:hover:bg-white/[0.06]",
                    )}
                  >
                    <FlagImg
                      code={img}
                      size={22}
                      priority
                      className="h-3.5 w-[1.375rem] shrink-0 rounded-[2px] object-cover ring-1 ring-black/5 dark:ring-white/10"
                      alt={formatImageFlagAlt(label, t)}
                    />
                    <span className="min-w-0 flex-1 truncate leading-none">{label}</span>
                    <ChevronRight
                      className={cn(
                        "h-3.5 w-3.5 shrink-0",
                        active ? "text-primary/70" : "text-muted-foreground/50",
                      )}
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

const MobileMenuToggle = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & {
    open: boolean;
    scrolled: boolean;
    isDarkNav: boolean;
    label: string;
  }
>(({ open, scrolled, isDarkNav, label, className, ...props }, ref) => (
  <button
    ref={ref}
    type="button"
    aria-label={label}
    aria-expanded={open}
    className={cn(
      "md:hidden relative inline-flex shrink-0 items-center justify-center rounded-full touch-manipulation transition-[color,background-color,transform] duration-150 active:scale-95",
      scrolled ? "h-9 w-9" : "h-10 w-10",
      open
        ? "bg-primary/12 text-primary"
        : isDarkNav
          ? "text-white/85 hover:bg-white/10 hover:text-white"
          : "text-foreground/70 hover:bg-muted/90 hover:text-foreground",
      className,
    )}
    {...props}
  >
    <span className="relative block h-3.5 w-[17px]" aria-hidden>
      <span
        className={cn(
          "absolute left-0 block h-[1.5px] w-[17px] rounded-full bg-current transition-all duration-150 ease-[cubic-bezier(0.32,0.72,0,1)]",
          open ? "top-1/2 -translate-y-1/2 rotate-45" : "top-0",
        )}
      />
      <span
        className={cn(
          "absolute left-0 top-1/2 block h-[1.5px] w-[17px] -translate-y-1/2 rounded-full bg-current transition-all duration-150 ease-[cubic-bezier(0.32,0.72,0,1)]",
          open ? "scale-x-0 opacity-0" : "opacity-100",
        )}
      />
      <span
        className={cn(
          "absolute left-0 block h-[1.5px] w-[17px] rounded-full bg-current transition-all duration-150 ease-[cubic-bezier(0.32,0.72,0,1)]",
          open ? "top-1/2 -translate-y-1/2 -rotate-45" : "bottom-0",
        )}
      />
    </span>
  </button>
));
MobileMenuToggle.displayName = "MobileMenuToggle";

/** Country dropdown — compact list panel (solid fill, no blur). */
const NAV_COUNTRY_PANEL = cn(
  "rounded-xl border border-border/80 bg-background shadow-lg shadow-black/8",
  "overflow-hidden",
);

/** User menu — solid fill for snappy open (same idea as country mega). */
const NAV_USER_MENU_PANEL = cn(
  "rounded-2xl border border-border/80 bg-background shadow-xl shadow-black/10",
  "overflow-hidden",
);

/** Positions panel below trigger; pt-2 bridges the gap for hover travel. */
const NAV_DROPDOWN_ANCHOR = "absolute top-full z-[110] pt-2";

type NavDropdownKey = "country" | "user";

function navDropdownHoverProps(
  key: NavDropdownKey,
  timers: MutableRefObject<Record<NavDropdownKey, ReturnType<typeof setTimeout> | null>>,
  setOpen: Dispatch<SetStateAction<boolean>>,
  closeOthers: () => void,
  delayMs = 0,
) {
  return {
    onMouseEnter: () => {
      const timer = timers.current[key];
      if (timer) {
        clearTimeout(timer);
        timers.current[key] = null;
      }
      closeOthers();
      setOpen(true);
    },
    onMouseLeave: () => {
      const existing = timers.current[key];
      if (existing) clearTimeout(existing);
      timers.current[key] = setTimeout(() => {
        timers.current[key] = null;
        setOpen(false);
      }, delayMs);
    },
  };
}

/** Desktop dropdown triggers — hover opens via parent wrapper; click must not toggle. */
function navDropdownTriggerProps(open: boolean, label?: string) {
  return {
    type: "button" as const,
    tabIndex: -1,
    "aria-haspopup": "menu" as const,
    "aria-expanded": open,
    ...(label ? { "aria-label": label } : {}),
    onClick: (e: ReactMouseEvent<HTMLButtonElement>) => e.preventDefault(),
  };
}

function MobileLangPicker({
  language,
  onLanguageChange,
  isDarkNav,
  scrolled,
  mobileMenuOpen = false,
}: {
  language: string;
  onLanguageChange: (code: string) => void;
  isDarkNav: boolean;
  scrolled: boolean;
  mobileMenuOpen?: boolean;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const hoverCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({});

  const clearHoverClose = useCallback(() => {
    if (hoverCloseTimer.current) {
      clearTimeout(hoverCloseTimer.current);
      hoverCloseTimer.current = null;
    }
  }, []);

  const updateMenuPosition = useCallback(() => {
    const btn = btnRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const margin = 12;
    const width = Math.min(288, window.innerWidth - margin * 2);
    // Center under the language trigger, clamped to the viewport.
    const centerX = rect.left + rect.width / 2;
    let left = centerX - width / 2;
    left = Math.min(Math.max(left, margin), window.innerWidth - margin - width);
    setMenuStyle({
      position: "fixed",
      top: rect.bottom + 8,
      left,
      width,
      zIndex: 130,
    });
  }, []);

  const close = useCallback(() => {
    clearHoverClose();
    setOpen(false);
  }, [clearHoverClose]);

  const openMenu = useCallback(() => {
    clearHoverClose();
    updateMenuPosition();
    setOpen(true);
  }, [clearHoverClose, updateMenuPosition]);

  const scheduleClose = useCallback(() => {
    clearHoverClose();
    hoverCloseTimer.current = setTimeout(() => {
      hoverCloseTimer.current = null;
      setOpen(false);
    }, 120);
  }, [clearHoverClose]);

  useEffect(() => () => clearHoverClose(), [clearHoverClose]);

  useEffect(() => {
    if (mobileMenuOpen) close();
  }, [mobileMenuOpen, close]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    updateMenuPosition();
    const onReflow = () => updateMenuPosition();
    window.addEventListener("resize", onReflow);
    window.addEventListener("scroll", onReflow, true);
    return () => {
      window.removeEventListener("resize", onReflow);
      window.removeEventListener("scroll", onReflow, true);
    };
  }, [open, updateMenuPosition]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (btnRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      close();
    };
    const id = window.setTimeout(() => {
      document.addEventListener("pointerdown", onPointerDown, true);
    }, 0);
    return () => {
      window.clearTimeout(id);
      document.removeEventListener("pointerdown", onPointerDown, true);
    };
  }, [open, close]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, close]);

  usePrefetchPickerFlags(open);

  const handleToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!open) {
      updateMenuPosition();
      setOpen(true);
    } else {
      close();
    }
  };

  const current = LANGS.find((l) => l.code === language);

  const menu = mounted
    ? createPortal(
        <AnimatePresence>
          {open && (
              <motion.div
                ref={menuRef}
                role="menu"
                aria-label="Language"
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={{ duration: 0.08, ease: [0.22, 1, 0.36, 1] }}
                style={{ ...menuStyle, transformOrigin: "top center" }}
                className="rounded-2xl border border-border/80 bg-background shadow-2xl shadow-black/15 p-2"
                onMouseEnter={openMenu}
                onMouseLeave={scheduleClose}
              >
                <LangPickerList
                  language={language as Language}
                  hrefForLanguage={(code) =>
                    replaceLangInPath(
                      typeof window !== "undefined" ? window.location.pathname : `/${language}`,
                      language as Language,
                      code,
                    )
                  }
                  onSelect={(code) => {
                    close();
                    requestAnimationFrame(() => onLanguageChange(code));
                  }}
                />
              </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )
    : null;

  return (
    <div
      className="relative"
      onMouseEnter={openMenu}
      onMouseLeave={scheduleClose}
    >
      <button
        ref={btnRef}
        type="button"
        title={current?.label ?? language}
        aria-label={current?.label ?? language}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={handleToggle}
        className={cn(
          "flex items-center gap-1 px-2 rounded-full font-medium transition-colors duration-50 ease-out",
          scrolled ? "h-8 text-sm" : "h-9 text-[15px]",
          open
            ? isDarkNav
              ? "bg-white/10 text-white"
              : "bg-primary/10 text-primary"
            : isDarkNav
              ? "text-white/75 hover:bg-white/10 hover:text-white"
              : "text-foreground hover:bg-primary/[0.06]",
        )}
      >
        <FlagImg code={current?.img ?? "gb"} variant="nav" size={18} priority alt={formatImageFlagAlt(current?.label ?? language, t)} />
        <ChevronDown
          className={cn(
            "h-3 w-3 transition-transform duration-100",
            isDarkNav ? "text-white/40" : "text-muted-foreground",
            open && "rotate-180",
          )}
        />
      </button>
      {menu}
    </div>
  );
}

export function Navbar({ announcementOffset = 0 }: { announcementOffset?: number }) {
  const { t, language, setLanguage } = useTranslation();
  const { resolvedTheme, setTheme } = useTheme();
  const [location, setLocation] = useLocation();
  const { isSignedIn, isLoaded, user, logout } = useAuth();
  const [scrolled, setScrolled]       = useState(false);
  const [heroScrolled, setHeroScrolled] = useState(false);
  const [mobileOpen, setMobileOpen]   = useState(false);
  const [countryOpen, setCountryOpen] = useState(false);
  const [userOpen, setUserOpen]       = useState(false);
  const countryRef = useRef<HTMLDivElement>(null);
  const userRef    = useRef<HTMLDivElement>(null);
  const hoverCloseTimers = useRef<Record<NavDropdownKey, ReturnType<typeof setTimeout> | null>>({
    country: null,
    user: null,
  });

  const closeUser = useCallback(() => {
    setUserOpen(false);
  }, []);

  const closeCountry = useCallback(() => {
    setCountryOpen(false);
  }, []);

  useEffect(() => () => {
    for (const key of Object.keys(hoverCloseTimers.current) as NavDropdownKey[]) {
      const timer = hoverCloseTimers.current[key];
      if (timer) clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    prefetchNavMenuAssets();
  }, []);

  useEffect(() => {
    if (!countryOpen) return;
    prefetchCountryPages();
  }, [countryOpen]);

  useEffect(() => {
    if (!mobileOpen) return;
    // Don't compete with the open animation — warm routes after the frame settles.
    const run = () => {
      prefetchCommonRoutes();
      prefetchCountryPages();
    };
    let idleId: number | undefined;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      idleId = window.requestIdleCallback(run, { timeout: 1200 });
    } else {
      timeoutId = setTimeout(run, 280);
    }
    return () => {
      if (idleId != null && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId != null) clearTimeout(timeoutId);
    };
  }, [mobileOpen]);

  useEffect(() => {
    let ticking = false;
    const handler = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        // Solid bar early so mobile doesn't stay transparent mid-scroll.
        setScrolled(y > 16);
        setHeroScrolled(y > 72);
        ticking = false;
      });
    };
    handler();
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  useEffect(() => {
    const close = (e: globalThis.MouseEvent) => {
      if (countryRef.current && !countryRef.current.contains(e.target as Node)) setCountryOpen(false);
      if (userRef.current    && !userRef.current.contains(e.target as Node))    setUserOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const handleLanguageChange = (lang: string) => {
    if (!isSupportedLang(lang)) return;
    const next: Language = lang;
    const target = replaceLangInPath(window.location.pathname, language, next);
    void ensureDict(next)
      .catch(() => {
        // Still switch language — English fallback strings apply if locale bundle failed.
      })
      .finally(() => {
        setStoredLangPreference(next);
        setLanguage(next);
        setLocation(target);
        setMobileOpen(false);
      });
  };

  const handleLogout = async () => {
    await logout();
    setLocation(`/${language}`);
    setMobileOpen(false);
    setUserOpen(false);
  };

  const closeMenus = () => {
    setUserOpen(false);
    setMobileOpen(false);
  };

  const toggleTheme = () => setTheme(resolvedTheme === "dark" ? "light" : "dark");
  const isAdmin     = user?.isAdmin === true;
  const isOnPage    = (seg: string) => location.includes(`/${seg}`);
  const isHome      = /^\/[a-z]{2}\/?$/.test(location) || location === "/";
  const isCountry   = isOnPage("cars");
  const isHeroTransparentNav = isHome || isCountry || isOnPage("pricing");
  const isAuthNavPage =
    isOnPage("sign-in")
    || isOnPage("sign-up")
    || isOnPage("forgot-password")
    || isOnPage("reset-password")
    || isOnPage("set-password");
  const isDarkNav =
    resolvedTheme === "dark"
    && (
      (isHeroTransparentNav && !heroScrolled)
      || (isAuthNavPage && !scrolled)
    );

  useEffect(() => {
    if (!userOpen) return;
    prefetchAuthAreaRoutes();
    if (isAdmin) prefetchRoute("adminx");
  }, [userOpen, isAdmin]);

  const currentLang  = LANGS.find(l => l.code === language);
  const displayName  = user?.name ?? user?.email?.split("@")[0] ?? "";
  const avatarInitial = displayName?.[0]?.toUpperCase() ?? <User className="h-3 w-3" />;

  const navLink = (active: boolean) => cn(
    "relative inline-flex items-center gap-1.5 px-3.5 py-2.5 text-[15px] font-medium tracking-wide transition-colors duration-75 outline-none",
    active
      ? isDarkNav
        ? "text-white"
        : "text-foreground"
      : isDarkNav
        ? "text-white/60 hover:text-white"
        : "text-foreground/65 hover:text-foreground",
  );

  const navActiveMark = () => (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-x-3.5 bottom-0 h-[2px] rounded-full bg-primary"
    />
  );

  const utilityClusterCls = cn(
    "flex items-center gap-0.5 rounded-full p-0.5",
    isDarkNav
      ? "bg-white/[0.04] border border-white/10"
      : "bg-muted/35 border border-border/55",
  );

  return (
    <header
      style={{ top: announcementOffset }}
      className={cn(
      "fixed inset-x-0 z-[100] w-full print:hidden",
      "transition-[border-color,background-color] duration-200",
      scrolled
        ? (isDarkNav
            ? "bg-[#060a14]/95 border-b border-white/10"
            : "bg-background/97 border-b border-border/70")
        : isDarkNav
        ? "bg-gradient-to-b from-black/30 to-transparent border-b border-white/[0.06]"
        : (isHeroTransparentNav || isAuthNavPage)
        ? "bg-transparent border-b border-border/30"
        : "bg-background/80 border-b border-border/40",
    )}>
      <div className={cn(
        "max-w-[1400px] mx-auto px-5 flex justify-between items-center gap-4",
        "md:grid md:grid-cols-[auto_1fr_auto] md:gap-6",
        "h-[72px]",
      )}>

        {/* ── Logo ── */}
        <div className="flex items-center min-w-0 md:justify-self-start">
          <PrefetchLink href={`/${language}`} className="flex items-center shrink-0 group -translate-y-px">
            <KmcheckLogo
              className="h-9 md:h-10 transition-opacity duration-200 group-hover:opacity-90"
            />
          </PrefetchLink>
        </div>

        {/* ── Centered nav links (desktop) — no box ── */}
        <div className="hidden md:flex items-center justify-center justify-self-center min-w-0">
          <nav className="inline-flex items-center gap-1" aria-label="Primary">
            <div
              ref={countryRef}
              className="relative"
              {...navDropdownHoverProps("country", hoverCloseTimers, setCountryOpen, closeUser)}
            >
              <button
                {...navDropdownTriggerProps(countryOpen, t("nav_country"))}
                className={cn(navLink(isOnPage("cars") || countryOpen))}
              >
                {t("nav_country")}
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 shrink-0 transition-transform duration-75",
                    isDarkNav ? "text-white/35" : "text-muted-foreground/80",
                    countryOpen && "rotate-180",
                  )}
                />
                {(isOnPage("cars") || countryOpen) && navActiveMark()}
              </button>

              <div
                className={cn(
                  NAV_DROPDOWN_ANCHOR,
                  "left-1/2 -translate-x-1/2",
                  countryOpen ? "visible" : "invisible pointer-events-none",
                )}
                aria-hidden={!countryOpen}
              >
                <div className={cn(NAV_COUNTRY_PANEL, "w-[15rem] max-w-[calc(100vw-1.5rem)] p-0")}>
                  <CountryNavMenuGroups
                    language={language}
                    isActive={(slug) => isOnPage(`cars/${slug}`)}
                    onNavigate={() => setCountryOpen(false)}
                  />
                </div>
              </div>
            </div>

            <PrefetchLink href={`/${language}/how-it-works`} className={navLink(isOnPage("how-it-works"))}>
              {t("nav_how_it_works")}
              {isOnPage("how-it-works") && navActiveMark()}
            </PrefetchLink>
            <PrefetchLink href={`/${language}/pricing`} className={navLink(isOnPage("pricing"))}>
              {t("pricing")}
              {isOnPage("pricing") && navActiveMark()}
            </PrefetchLink>
            <PrefetchLink href={`/${language}/faq`} className={navLink(isOnPage("faq"))}>
              {t("nav_faq")}
              {isOnPage("faq") && navActiveMark()}
            </PrefetchLink>
          </nav>
        </div>

        {/* ── Right controls ── */}
        <div className="flex items-center gap-1.5 shrink-0 md:justify-self-end">
          {/* Lang + theme — same cluster layout on all breakpoints */}
          <div className={utilityClusterCls}>
            <MobileLangPicker
              language={language}
              onLanguageChange={handleLanguageChange}
              isDarkNav={isDarkNav}
              scrolled={scrolled}
              mobileMenuOpen={mobileOpen}
            />
            <button
              type="button"
              onClick={toggleTheme}
              title="Toggle theme"
              aria-label="Toggle theme"
              className={cn(
                "relative rounded-full flex items-center justify-center transition-colors duration-50 ease-out",
                scrolled ? "h-8 w-8" : "h-9 w-9",
                isDarkNav
                  ? "text-white/55 hover:text-white hover:bg-white/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-primary/[0.06]",
              )}
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </button>
          </div>

          <div className="hidden md:flex items-center gap-2">
            <div className={cn("h-4 w-px", isDarkNav ? "bg-white/15" : "bg-border/70")} />

            {/* Auth / Check VIN */}
            {!isLoaded ? (
              <div className="h-9 w-24 rounded-lg bg-muted/80 animate-pulse" aria-hidden />
            ) : isSignedIn ? (
              <div
                ref={userRef}
                className="relative"
                {...navDropdownHoverProps("user", hoverCloseTimers, setUserOpen, closeCountry)}
              >
                <button
                  {...navDropdownTriggerProps(userOpen, displayName || t("my_reports"))}
                  className={cn(
                    "flex items-center gap-2 pl-1 pr-2 rounded-lg outline-none transition-[color,height,padding] duration-150",
                    scrolled ? "h-8 py-0.5" : "h-9 py-1",
                    userOpen
                      ? isDarkNav
                        ? "text-white"
                        : "text-foreground"
                      : isDarkNav
                        ? "text-white/75 hover:text-white"
                        : "text-foreground/75 hover:text-foreground",
                  )}
                >
                  <Avatar className={cn(
                    "transition-[width,height] duration-150",
                    scrolled ? "h-7 w-7" : "h-8 w-8",
                  )}>
                    <AvatarImage src={user?.avatarUrl ?? undefined} alt={user?.name ?? ""} />
                    <AvatarFallback className={cn(
                      "bg-primary/10 text-primary font-bold transition-[font-size] duration-150",
                      scrolled ? "text-[11px]" : "text-xs",
                    )}>
                      {avatarInitial}
                    </AvatarFallback>
                  </Avatar>
                  <span className={cn(
                    "font-medium tracking-wide max-w-[7.5rem] truncate hidden lg:block transition-[font-size] duration-150",
                    scrolled ? "text-sm" : "text-[15px]",
                  )}>
                    {displayName}
                  </span>
                  <ChevronDown
                    className={cn(
                      "h-3 w-3 transition-transform duration-75",
                      isDarkNav ? "text-white/40" : "text-muted-foreground",
                      userOpen && "rotate-180",
                    )}
                  />
                </button>

                <div
                  className={cn(
                    NAV_DROPDOWN_ANCHOR,
                    "right-0",
                    userOpen ? "visible" : "invisible pointer-events-none",
                  )}
                  aria-hidden={!userOpen}
                >
                  <div className={cn(NAV_USER_MENU_PANEL, "w-56 py-1.5")}>
                    <div className="px-4 py-3 border-b border-border/60 mb-1">
                      {user?.name && <p className="font-semibold text-sm truncate">{user.name}</p>}
                      <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                    </div>
                    <Link
                      href={`/${language}/dashboard`}
                      onClick={() => setUserOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-sm hover:bg-muted/60 rounded-md mx-1.5"
                    >
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                      {t("my_reports")}
                    </Link>
                    {isAdmin && (
                      <Link
                        href="/adminx"
                        onClick={closeMenus}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm hover:bg-muted/60 rounded-md mx-1.5"
                      >
                        <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                        {t("admin")}
                      </Link>
                    )}
                    <div className="border-t border-border/60 mt-1 pt-1 mx-1.5">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-destructive hover:bg-destructive/8 rounded-md"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        {t("logout")}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <PrefetchLink
                  href={`/${language}/sign-in`}
                  className={cn(
                    "inline-flex h-9 items-center px-2.5 text-[13px] font-medium tracking-wide transition-colors duration-75",
                    isDarkNav
                      ? "text-white/55 hover:text-white"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {t("sign_in")}
                </PrefetchLink>
                <Button
                  size="sm"
                  className="h-9 px-3.5 text-[13px] font-semibold tracking-wide rounded-lg shadow-none transition-opacity hover:opacity-90"
                  asChild
                >
                  <PrefetchLink href={`/${language}`}>{t("check_vin")}</PrefetchLink>
                </Button>
              </div>
            )}
          </div>

          {/* Mobile menu */}
          <div className="md:hidden flex items-center gap-1.5">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <MobileMenuToggle
                  open={mobileOpen}
                  scrolled={scrolled}
                  isDarkNav={isDarkNav}
                  label={mobileOpen ? t("nav_close_menu") : t("nav_open_menu")}
                  onPointerDown={prefetchNavMenuAssets}
                />
              </SheetTrigger>

            <SheetContent
              side="right"
              speed="fast"
              overlayClassName="z-[110]"
              className="z-[110] w-[min(288px,86vw)] p-0 flex flex-col h-full max-h-[100dvh] border-l border-border/50 shadow-xl shadow-black/20 dark:shadow-black/35"
              onOpenAutoFocus={(e) => e.preventDefault()}
            >
              {/* Mobile header */}
              <div className="flex h-full flex-col">
              <div className="flex items-center justify-between px-5 h-16 border-b shrink-0">
                <Link
                  href={`/${language}`}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center -translate-y-px"
                >
                  <KmcheckLogo className="h-8" syncDecode />
                </Link>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-primary/[0.06] active:scale-95"
                  aria-label={t("nav_close_menu")}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Mobile nav links */}
              <nav className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain px-3 py-3 space-y-0.5 [-webkit-overflow-scrolling:touch] touch-pan-y">
                <Link
                  href={`/${language}/how-it-works`}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium touch-manipulation active:bg-primary/10",
                    isOnPage("how-it-works") ? "bg-primary/8 text-primary" : "text-foreground/75",
                  )}
                >
                  {t("nav_how_it_works")}
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>
                <Link
                  href={`/${language}/pricing`}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium touch-manipulation active:bg-primary/10",
                    isOnPage("pricing") ? "bg-primary/8 text-primary" : "text-foreground/75",
                  )}
                >
                  {t("pricing")}
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>
                <Link
                  href={`/${language}/faq`}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium touch-manipulation active:bg-primary/10",
                    isOnPage("faq") ? "bg-primary/8 text-primary" : "text-foreground/75",
                  )}
                >
                  {t("nav_faq")}
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>

                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-3 pt-3 pb-1">
                  {t("footer_countries")}
                </p>

                <CountryNavMenuGroups
                  language={language}
                  layout="mobile"
                  isActive={(slug) => isOnPage(`cars/${slug}`)}
                  onNavigate={() => setMobileOpen(false)}
                />

              </nav>

              {/* Mobile auth footer */}
              <div className="border-t px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] space-y-3 shrink-0 bg-background">
                {!isLoaded ? (
                  <div className="h-9 rounded-xl bg-muted/80 animate-pulse" aria-hidden />
                ) : isSignedIn ? (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 rounded-xl"
                        asChild
                        onClick={() => setMobileOpen(false)}
                      >
                        <Link href={`/${language}/dashboard`}>{t("my_reports")}</Link>
                      </Button>
                      {isAdmin ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9 rounded-xl"
                          asChild
                          onClick={() => setMobileOpen(false)}
                        >
                          <Link href="/adminx" onClick={closeMenus}>{t("admin")}</Link>
                        </Button>
                      ) : (
                        <div />
                      )}
                    </div>

                    <div className="flex items-center gap-3 px-1 py-1">
                      <Avatar className="h-9 w-9 shrink-0">
                        <AvatarImage src={user?.avatarUrl ?? undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                          {avatarInitial}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        {user?.name && <p className="font-semibold text-sm truncate">{user.name}</p>}
                        <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-2 h-9 text-destructive border-destructive/30 hover:bg-destructive/8"
                      onClick={handleLogout}
                    >
                      <LogOut className="h-4 w-4" />
                      {t("logout")}
                    </Button>
                  </>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1 h-10 rounded-xl" asChild onClick={() => setMobileOpen(false)}>
                      <Link href={`/${language}/sign-in`}>{t("sign_in")}</Link>
                    </Button>
                    <Button className="flex-1 h-10 rounded-xl font-bold" asChild onClick={() => setMobileOpen(false)}>
                      <Link href={`/${language}/sign-up`}>{t("sign_up")}</Link>
                    </Button>
                  </div>
                )}
              </div>
              </div>
            </SheetContent>
          </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [announcementHeight, setAnnouncementHeight] = useState(0);
  const showClientNav = useShowClientMobileNav();

  useEffect(() => {
    const apply = () => {
      // Must match Navbar inner height (`h-[72px]`).
      const navbarHeight = 72;
      document.documentElement.style.setProperty(
        "--site-header-offset",
        `${navbarHeight + announcementHeight}px`,
      );
      document.documentElement.style.setProperty(
        "--announcement-bar-height",
        `${announcementHeight}px`,
      );
    };
    apply();
    return () => {
      document.documentElement.style.removeProperty("--site-header-offset");
      document.documentElement.style.removeProperty("--announcement-bar-height");
    };
  }, [announcementHeight]);

  return (
    <div className="min-h-[100dvh] flex flex-col overflow-x-clip w-full">
      <NavAssetWarmup />
      <BannedSessionRedirect />
      <AnnouncementBar onHeightChange={setAnnouncementHeight} />
      <Navbar announcementOffset={announcementHeight} />
      <div
        className={cn(
          "flex flex-col flex-1",
          showClientNav && `md:pb-0 ${CLIENT_MOBILE_NAV_PADDING}`,
        )}
      >
        <main className="overflow-x-hidden pt-[var(--site-header-offset,72px)] print:pt-0">
          {children}
        </main>
        <Footer />
      </div>
      <ClientMobileNav />
    </div>
  );
}
