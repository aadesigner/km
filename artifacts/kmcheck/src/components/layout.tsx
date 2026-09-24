import { useState, useEffect, useRef, useCallback, useLayoutEffect, useSyncExternalStore, type CSSProperties, type Dispatch, type MouseEvent as ReactMouseEvent, type MutableRefObject, type SetStateAction } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation } from "wouter";
import { PrefetchLink } from "@/components/prefetch-link";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation, ensureDict } from "@/i18n/context";
import { useTheme } from "@/components/theme-provider";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import {
  Moon, Sun, User, Shield, LogOut,
  ChevronDown,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Footer } from "@/components/footer";
import { KmcheckLogo } from "@/components/logo";
import { BannedSessionRedirect } from "@/components/banned-session-redirect";
import { cn } from "@/lib/utils";
import { setStoredLangPreference } from "@/lib/lang-preference";
import { AnnouncementBar } from "@/components/announcement-bar";
import { ClientMobileNav, useShowClientMobileNav, CLIENT_MOBILE_NAV_PADDING } from "@/components/client-mobile-nav";
import { CountryNavMenuGroups } from "@/components/nav-country-menu";
import { NavbarMobileMenu } from "@/components/navbar-mobile-menu";
import { LANG_PICKER_OPTIONS, isSupportedLang, replaceLangInPath, type Language } from "@/lib/languages";
import { FlagImg } from "@/components/flag-img";
import { formatImageFlagAlt } from "@/lib/flag-alt";
import { LangPickerList, usePrefetchPickerFlags } from "@/components/lang-picker-list";
import { NavAssetWarmup } from "@/components/nav-asset-warmup";
import { prefetchNavMenuAssets } from "@/lib/nav-assets";
import { prefetchCountryPages, prefetchAuthAreaRoutes, prefetchRoute, prefetchCommonRoutes } from "@/lib/prefetch-route";
import { clearLeakedAdminDocumentStyles } from "@/lib/admin-revenue-mood";
import { shouldDeferHeavyClientWarmup } from "@/hooks/use-light-motion";

const LANGS = LANG_PICKER_OPTIONS.map((l) => ({
  code: l.code,
  label: l.label,
  short: l.short,
  img: l.flag,
}));

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

/** True when hover menus are safe (desktop). Touch devices synthesize mouseleave and close instantly. */
function subscribeFinePointer(onChange: () => void) {
  const fine = window.matchMedia("(pointer: fine)");
  const hover = window.matchMedia("(hover: hover)");
  fine.addEventListener("change", onChange);
  hover.addEventListener("change", onChange);
  return () => {
    fine.removeEventListener("change", onChange);
    hover.removeEventListener("change", onChange);
  };
}

function getFinePointer() {
  return window.matchMedia("(pointer: fine)").matches
    && window.matchMedia("(hover: hover)").matches;
}

function useFinePointerHover() {
  return useSyncExternalStore(subscribeFinePointer, getFinePointer, () => false);
}

function MobileLangPicker({
  language,
  onLanguageChange,
  isDarkNav,
  mobileMenuOpen = false,
}: {
  language: string;
  onLanguageChange: (code: string) => void;
  isDarkNav: boolean;
  mobileMenuOpen?: boolean;
}) {
  const { t } = useTranslation();
  const finePointer = useFinePointerHover();
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
    if (!finePointer) return;
    clearHoverClose();
    hoverCloseTimer.current = setTimeout(() => {
      hoverCloseTimer.current = null;
      setOpen(false);
    }, 120);
  }, [clearHoverClose, finePointer]);

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
  const hoverProps = finePointer
    ? { onMouseEnter: openMenu, onMouseLeave: scheduleClose }
    : {};

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
                {...hoverProps}
              >
                <LangPickerList
                  language={language as Language}
                  layout="mobile"
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
    <div className="relative" {...hoverProps}>
      <button
        ref={btnRef}
        type="button"
        title={current?.label ?? language}
        aria-label={current?.label ?? language}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={handleToggle}
        className={cn(
          "flex items-center gap-1 px-2 font-medium tracking-wide transition-colors duration-75 outline-none h-9 text-[15px]",
          open
            ? isDarkNav
              ? "text-white"
              : "text-foreground"
            : isDarkNav
              ? "text-white/60 hover:text-white"
              : "text-foreground/65 hover:text-foreground",
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
  const [scrolled, setScrolled] = useState(() =>
    typeof window !== "undefined" ? window.scrollY > 16 : false,
  );
  const [heroScrolled, setHeroScrolled] = useState(() =>
    typeof window !== "undefined" ? window.scrollY > 72 : false,
  );
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
    // After first paint — avoid competing with logo/hero on cold mobile loads.
    // Phones still get this small same-origin set (flags + wordmarks); only delayed longer.
    const delayMs = shouldDeferHeavyClientWarmup() ? 1_600 : 800;
    const id = window.setTimeout(() => {
      prefetchNavMenuAssets();
    }, delayMs);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    if (!countryOpen) return;
    prefetchCountryPages();
  }, [countryOpen]);

  useEffect(() => {
    if (!mobileOpen) return;
    // Don't compete with the open animation — warm routes after the frame settles.
    // Light devices: skip — menu open already feels heavy enough.
    if (shouldDeferHeavyClientWarmup()) return;
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
        // One threshold — dual scrolled/heroScrolled caused dark-nav text flicker.
        const next = y > 16;
        setScrolled(next);
        setHeroScrolled(next);
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
    "relative inline-flex items-center gap-1.5 font-medium tracking-wide transition-colors duration-75 outline-none",
    scrolled ? "px-3.5 py-2 text-[16px]" : "px-4 py-2.5 text-[16px]",
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

  const utilityClusterCls = "flex items-center gap-0.5";

  return (
    <header
      style={{ top: announcementOffset }}
      className={cn(
      "fixed inset-x-0 z-[100] w-full print:hidden",
      // No bg/border tween on mobile — mid devices flash when isDarkNav flips.
      "md:transition-[border-color,background-color,box-shadow] md:duration-150",
      scrolled
        ? (resolvedTheme === "dark"
            ? (isDarkNav
                ? "bg-[#060a14]/95 border-b border-white/20"
                : "bg-background/97 border-b border-white/15")
            : "bg-background/97 border-b border-border/70")
        : isDarkNav
        ? "bg-gradient-to-b from-black/30 to-transparent border-b border-white/15"
        : (isHeroTransparentNav || isAuthNavPage)
        ? "bg-transparent border-b border-border/30"
        : resolvedTheme === "dark"
        ? "bg-background/80 border-b border-white/12"
        : "bg-background/80 border-b border-border/40",
    )}>
      <div className={cn(
        "max-w-[1400px] mx-auto px-5 flex justify-between items-center gap-4",
        "md:grid md:grid-cols-[auto_1fr_auto] md:gap-6",
        // Fixed height on mobile — logo/height tween caused scroll flicker.
        "h-16 md:h-[76px] md:transition-[height] md:duration-150 md:ease-out",
        scrolled && "md:h-16",
      )}>

        {/* ── Logo ── */}
        <div className="flex items-center min-w-0 md:justify-self-start">
          <PrefetchLink href={`/${language}`} className="flex items-center shrink-0 group -translate-y-px">
            <KmcheckLogo
              syncDecode
              className={cn(
                "w-auto max-w-none object-contain group-hover:opacity-90",
                "h-8 md:transition-[height,opacity] md:duration-150 md:ease-out",
                scrolled ? "md:h-9" : "md:h-10",
              )}
            />
          </PrefetchLink>
        </div>

        {/* ── Centered nav links (desktop) — no box ── */}
        <div className="hidden md:flex items-center justify-center justify-self-center min-w-0">
          <nav className="inline-flex items-center gap-1.5" aria-label="Primary">
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
                    "h-4 w-4 shrink-0 transition-transform duration-75",
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
                <div className={cn(NAV_COUNTRY_PANEL, "w-[17rem] max-w-[calc(100vw-1.5rem)] p-0")}>
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
              mobileMenuOpen={mobileOpen}
            />
            <button
              type="button"
              onClick={toggleTheme}
              title="Toggle theme"
              aria-label="Toggle theme"
              className={cn(
                "relative h-9 w-9 flex items-center justify-center transition-colors duration-75 outline-none",
                isDarkNav
                  ? "text-white/60 hover:text-white"
                  : "text-foreground/65 hover:text-foreground",
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
                    "flex items-center gap-2 pl-1 pr-2 rounded-lg outline-none transition-colors duration-75 h-9 py-1",
                    userOpen
                      ? isDarkNav
                        ? "text-white"
                        : "text-foreground"
                      : isDarkNav
                        ? "text-white/75 hover:text-white"
                        : "text-foreground/75 hover:text-foreground",
                  )}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.avatarUrl ?? undefined} alt={user?.name ?? ""} />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                      {avatarInitial}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium tracking-wide max-w-[7.5rem] truncate hidden lg:block text-[15px]">
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
                    "inline-flex items-center px-2.5 h-9 text-[13px] font-medium tracking-wide transition-colors duration-75",
                    isDarkNav
                      ? "text-white/55 hover:text-white"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {t("sign_in")}
                </PrefetchLink>
                <Button
                  size="sm"
                  className="h-9 px-3.5 text-[13px] font-semibold tracking-wide rounded-lg shadow-none transition-opacity duration-75 hover:opacity-90"
                  asChild
                >
                  <PrefetchLink href={`/${language}`}>{t("check_vin")}</PrefetchLink>
                </Button>
              </div>
            )}
          </div>

          {/* Mobile menu */}
          <div className="md:hidden flex items-center gap-1.5">
            <NavbarMobileMenu
              open={mobileOpen}
              onOpenChange={setMobileOpen}
              language={language}
              isDarkNav={isDarkNav}
              isOnPage={isOnPage}
              isLoaded={isLoaded}
              isSignedIn={!!isSignedIn}
              isAdmin={isAdmin}
              user={user}
              onLogout={handleLogout}
            />
          </div>
        </div>
      </div>
    </header>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [announcementHeight, setAnnouncementHeight] = useState(0);
  const showClientNav = useShowClientMobileNav();

  // Admin themes used to write CSS vars onto <html>; scrub leftovers on public shell.
  useLayoutEffect(() => {
    clearLeakedAdminDocumentStyles();
  }, []);

  useLayoutEffect(() => {
    const apply = () => {
      // Mobile navbar is fixed h-16 (64px); desktop resting height is 76px.
      const navbarHeight =
        typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches
          ? 76
          : 64;
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
    const mq = window.matchMedia("(min-width: 768px)");
    mq.addEventListener("change", apply);
    return () => {
      mq.removeEventListener("change", apply);
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
        <main className="overflow-x-hidden pt-[var(--site-header-offset,76px)] print:pt-0">
          {children}
        </main>
        <Footer />
      </div>
      <ClientMobileNav />
    </div>
  );
}
