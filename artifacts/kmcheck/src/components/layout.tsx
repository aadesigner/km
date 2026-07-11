import { useState, useEffect, useRef, useCallback, useLayoutEffect, forwardRef, type ButtonHTMLAttributes, type CSSProperties, type Dispatch, type MouseEvent, type MutableRefObject, type SetStateAction } from "react";
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
  ChevronRight, ChevronDown, Check,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Footer } from "@/components/footer";
import { KmcheckLogo } from "@/components/logo";
import { BannedSessionRedirect } from "@/components/banned-session-redirect";
import { cn } from "@/lib/utils";
import { setStoredLangPreference } from "@/lib/lang-preference";
import { AnnouncementBar } from "@/components/announcement-bar";
import { ClientMobileNav, useShowClientMobileNav, CLIENT_MOBILE_NAV_PADDING } from "@/components/client-mobile-nav";
import { LANG_PICKER_OPTIONS, isSupportedLang, type Language } from "@/lib/languages";
import { FlagImg, prefetchFlags } from "@/components/flag-img";
import { LangPickerList, usePrefetchPickerFlags } from "@/components/lang-picker-list";

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
                <PrefetchLink
                  key={slug}
                  href={`/${language}/cars/${slug}`}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-75",
                    active ? "bg-primary/8 text-primary" : "hover:bg-primary/[0.06]",
                  )}
                >
                  <FlagImg code={img} size={20} priority className="w-3.5 h-2.5" />
                  <span className="flex-1">{t(labelKey)}</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </PrefetchLink>
              );
            })}
          </div>
        ))}
      </>
    );
  }

  return (
    <div className="py-1" role="menu">
      {groups.map((group, groupIndex) => (
        <div
          key={group.continent}
          className={cn(groupIndex > 0 && "mt-1 border-t border-border/45")}
        >
          <p className="px-2.5 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/75">
            {t(CONTINENT_LABEL_KEY[group.continent])}
          </p>
          <ul className="pb-0.5">
            {group.items.map(({ slug, img, nameKey, countKey }) => {
              const active = isActive(slug);
              return (
                <li key={slug} role="none">
                  <PrefetchLink
                    href={`/${language}/cars/${slug}`}
                    role="menuitem"
                    onClick={onNavigate}
                    className={cn(
                      "group flex items-center gap-3 rounded-lg px-2.5 py-2.5 transition-colors duration-75",
                      active
                        ? "bg-primary/[0.08] ring-1 ring-primary/15"
                        : "hover:bg-muted/60 dark:hover:bg-white/[0.05]",
                    )}
                  >
                    <FlagImg code={img} size={22} className="shrink-0 rounded-[3px] shadow-sm" />
                    <span className="min-w-0 flex-1">
                      <span
                        className={cn(
                          "block text-[13px] font-medium leading-tight",
                          active ? "text-primary" : "text-foreground",
                        )}
                      >
                        {t(nameKey)}
                      </span>
                      <span className="mt-0.5 block truncate text-[11px] leading-tight text-muted-foreground">
                        {t(countKey)}
                      </span>
                    </span>
                    {active ? (
                      <Check className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
                    ) : (
                      <ChevronRight
                        className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40 opacity-0 transition-opacity duration-100 group-hover:opacity-100"
                        aria-hidden
                      />
                    )}
                  </PrefetchLink>
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

const NAV_DROPDOWN_PANEL = cn(
  "min-w-[9.5rem] rounded-2xl border border-border/80 bg-background/95 backdrop-blur-xl shadow-xl shadow-black/10",
  "overflow-hidden",
);

/** Positions panel below trigger; pt-2 bridges the gap for hover travel. */
const NAV_DROPDOWN_ANCHOR = "absolute top-full z-[110] pt-2";

const NAV_DROPDOWN_MOTION = {
  initial: { opacity: 0, y: -2, scale: 0.99 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -2, scale: 0.99 },
  transition: { duration: 0.07, ease: [0.22, 1, 0.36, 1] },
} as const;

/** Dropdown panel shell — motion handles enter/exit; avoid tailwind animate-in (double animation). */
const NAV_DROPDOWN_CLS = NAV_DROPDOWN_PANEL;

type NavDropdownKey = "country" | "lang" | "user";

function navDropdownHoverProps(
  key: NavDropdownKey,
  timers: MutableRefObject<Record<NavDropdownKey, ReturnType<typeof setTimeout> | null>>,
  setOpen: Dispatch<SetStateAction<boolean>>,
  closeOthers: () => void,
  delayMs = 80,
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
    onClick: (e: MouseEvent<HTMLButtonElement>) => e.preventDefault(),
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
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({});

  const close = useCallback(() => setOpen(false), []);

  const updateMenuPosition = useCallback(() => {
    const btn = btnRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const margin = 12;
    const width = Math.min(288, window.innerWidth - margin * 2);
    setMenuStyle({
      position: "fixed",
      top: rect.bottom + 8,
      right: margin,
      width,
      zIndex: 130,
    });
  }, []);

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
    if (!open) updateMenuPosition();
    setOpen((v) => !v);
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
                style={{ ...menuStyle, transformOrigin: "top right" }}
                className="rounded-2xl border border-border/80 bg-background shadow-2xl shadow-black/15 p-2"
              >
                <LangPickerList
                  language={language as Language}
                  layout="mobile"
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
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        title={current?.label ?? language}
        aria-label={current?.label ?? language}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={handleToggle}
        className={cn(
          "flex items-center gap-1 px-2 rounded-full font-medium transition-colors duration-100",
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
        <FlagImg code={current?.img ?? "gb"} variant="nav" size={18} priority />
        <ChevronDown className={cn("h-3 w-3 opacity-40 transition-transform duration-100", open && "rotate-180")} />
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
  const [langOpen, setLangOpen]       = useState(false);
  const [userOpen, setUserOpen]       = useState(false);
  const countryRef = useRef<HTMLDivElement>(null);
  const langRef    = useRef<HTMLDivElement>(null);
  const userRef    = useRef<HTMLDivElement>(null);
  const hoverCloseTimers = useRef<Record<NavDropdownKey, ReturnType<typeof setTimeout> | null>>({
    country: null,
    lang: null,
    user: null,
  });

  const closeCountryAndLang = useCallback(() => {
    setCountryOpen(false);
    setLangOpen(false);
  }, []);

  const closeLangAndUser = useCallback(() => {
    setLangOpen(false);
    setUserOpen(false);
  }, []);

  const closeCountryAndUser = useCallback(() => {
    setCountryOpen(false);
    setUserOpen(false);
  }, []);

  useEffect(() => () => {
    for (const key of Object.keys(hoverCloseTimers.current) as NavDropdownKey[]) {
      const timer = hoverCloseTimers.current[key];
      if (timer) clearTimeout(timer);
    }
  }, []);

  usePrefetchPickerFlags(langOpen);

  useEffect(() => {
    if (!countryOpen) return;
    prefetchFlags(NAV_COUNTRY_FLAGS);
  }, [countryOpen]);

  useEffect(() => {
    if (!mobileOpen) return;
    prefetchFlags(NAV_COUNTRY_FLAGS);
  }, [mobileOpen]);

  const prefetchMobileNavFlags = useCallback(() => {
    prefetchFlags(NAV_COUNTRY_FLAGS);
  }, []);

  useEffect(() => {
    let ticking = false;
    const handler = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        setScrolled(y > 60);
        setHeroScrolled(y > 240);
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
    const close = (e: MouseEvent) => {
      if (countryRef.current && !countryRef.current.contains(e.target as Node)) setCountryOpen(false);
      if (langRef.current    && !langRef.current.contains(e.target as Node))    setLangOpen(false);
      if (userRef.current    && !userRef.current.contains(e.target as Node))    setUserOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const handleLanguageChange = (lang: string) => {
    if (!isSupportedLang(lang)) return;
    const next: Language = lang;
    const path = window.location.pathname;
    const newPath = path.replace(new RegExp(`^/${language}(/|$)`), `/${next}$1`);
    const target = newPath === path ? `/${next}` : newPath;
    void ensureDict(next)
      .catch(() => {
        // Still switch language — English fallback strings apply if locale bundle failed.
      })
      .finally(() => {
        setStoredLangPreference(next);
        setLanguage(next);
        setLocation(target);
        setMobileOpen(false);
        setLangOpen(false);
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
  const isMarketingTransparentNav = isOnPage("faq") || isOnPage("how-it-works");
  const isDarkNav =
    resolvedTheme === "dark"
    && (
      (isHeroTransparentNav && !heroScrolled)
      || ((isAuthNavPage || isMarketingTransparentNav) && !scrolled)
    );

  const currentLang  = LANGS.find(l => l.code === language);
  const displayName  = user?.name ?? user?.email?.split("@")[0] ?? "";
  const avatarInitial = displayName?.[0]?.toUpperCase() ?? <User className="h-3 w-3" />;

  const navLink = (active: boolean) => cn(
    "relative px-3.5 rounded-xl font-medium transition-colors duration-75",
    scrolled ? "py-1.5 text-sm" : "py-2 text-[15px]",
    active
      ? isDarkNav
        ? "text-white"
        : "text-primary"
      : isDarkNav
        ? "text-white/65 hover:text-white"
        : "text-muted-foreground hover:text-foreground",
    isDarkNav
      ? "hover:bg-white/[0.08]"
      : "hover:bg-primary/[0.06]",
  );

  const dropdownCls = NAV_DROPDOWN_CLS;
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
      "transition-[border-color,backdrop-filter,box-shadow,background-color] duration-300",
      scrolled
        ? (isDarkNav
            ? "bg-[#060a14]/75 backdrop-blur-xl border-b border-white/[0.08] shadow-[0_8px_32px_-8px_rgba(0,0,0,0.35)]"
            : "bg-background/92 backdrop-blur-xl border-b border-border/50 shadow-[0_4px_24px_-6px_rgba(0,0,0,0.06)]")
        : isDarkNav
        ? "bg-gradient-to-b from-black/45 to-black/15 backdrop-blur-md border-b border-white/[0.08]"
        : (isHeroTransparentNav || isAuthNavPage)
        ? "bg-background/70 backdrop-blur-md border-b border-border/40"
        : "bg-background/62 backdrop-blur-md border-b border-border/40",
    )}>
      <div className={cn(
        "max-w-[1400px] mx-auto px-5 flex justify-between items-center gap-4",
        "md:grid md:grid-cols-[1fr_auto]",
        "transition-[height,padding] duration-300",
        scrolled ? "h-[68px]" : "h-[72px] md:h-[84px]",
      )}>

        {/* ── Logo + nav cluster ── */}
        <div className="flex items-center gap-6 min-w-0 md:justify-self-start">
          <PrefetchLink href={`/${language}`} className="flex items-center shrink-0 group -translate-y-px md:-translate-y-0.5">
            <KmcheckLogo
              className={cn(
                "transition-all duration-300 group-hover:opacity-90",
                scrolled ? "h-9 md:h-9" : "h-9 md:h-10",
              )}
            />
          </PrefetchLink>

          <div className="hidden md:flex items-center gap-0.5">
          {/* Search by Country — desktop */}
          <div
            ref={countryRef}
            className="relative"
            {...navDropdownHoverProps("country", hoverCloseTimers, setCountryOpen, closeLangAndUser)}
          >
            <button
              {...navDropdownTriggerProps(countryOpen, t("nav_country"))}
              className={cn(navLink(isOnPage("cars")), "flex items-center gap-1.5 outline-none")}
            >
              {t("nav_country")}
              <ChevronDown className={cn("h-3 w-3 opacity-50 transition-transform duration-100", countryOpen && "rotate-180")} />
              {isOnPage("cars") && <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-0.5 w-5 rounded-full bg-primary" />}
            </button>

            <AnimatePresence>
              {countryOpen && (
                <motion.div
                  {...NAV_DROPDOWN_MOTION}
                  className={cn(NAV_DROPDOWN_ANCHOR, "left-0")}
                >
                  <div className={cn(dropdownCls, "w-[19.5rem] p-1.5")}>
                    <CountryNavMenuGroups
                      language={language}
                      isActive={(slug) => isOnPage(`cars/${slug}`)}
                      onNavigate={() => setCountryOpen(false)}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Primary nav — desktop, beside Country */}
          <nav className="flex items-center gap-0.5">
            <PrefetchLink href={`/${language}/how-it-works`} className={navLink(isOnPage("how-it-works"))}>
              {t("nav_how_it_works")}
              {isOnPage("how-it-works") && <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-0.5 w-5 rounded-full bg-primary" />}
            </PrefetchLink>
            <PrefetchLink href={`/${language}/pricing`} className={navLink(isOnPage("pricing"))}>
              {t("pricing")}
              {isOnPage("pricing") && <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-0.5 w-5 rounded-full bg-primary" />}
            </PrefetchLink>
            <PrefetchLink href={`/${language}/faq`} className={navLink(isOnPage("faq"))}>
              {t("nav_faq")}
              {isOnPage("faq") && <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-0.5 w-5 rounded-full bg-primary" />}
            </PrefetchLink>
          </nav>
          </div>
        </div>

        {/* ── Right controls ── */}
        <div className="flex items-center gap-1.5 shrink-0 md:justify-self-end">
          <div className="hidden md:flex items-center gap-2">

            <div className={utilityClusterCls}>
            {/* Language picker */}
            <div
              ref={langRef}
              className="relative"
              {...navDropdownHoverProps("lang", hoverCloseTimers, setLangOpen, closeCountryAndUser)}
            >
              <button
                {...navDropdownTriggerProps(langOpen, LANGS.find(l => l.code === language)?.label ?? language)}
                className={cn(
                  "flex items-center gap-1 px-2 rounded-full font-medium transition-colors duration-100",
                  scrolled ? "h-8 text-sm" : "h-9 text-[15px]",
                  langOpen
                    ? isDarkNav
                      ? "bg-white/10 text-white"
                      : "bg-primary/8 text-primary"
                    : isDarkNav
                      ? "text-white/75 hover:bg-white/10 hover:text-white"
                      : "text-foreground hover:bg-primary/[0.06]",
                )}
              >
                <FlagImg
                  code={LANGS.find(l => l.code === language)?.img ?? "gb"}
                  variant="nav"
                  size={18}
                  priority
                />
                <ChevronDown className={cn("h-3 w-3 opacity-40 transition-transform duration-100", langOpen && "rotate-180")} />
              </button>

              <AnimatePresence>
                {langOpen && (
                  <div className={cn(NAV_DROPDOWN_ANCHOR, "left-1/2 -translate-x-1/2")}>
                    <motion.div
                      {...NAV_DROPDOWN_MOTION}
                      style={{ transformOrigin: "top center" }}
                    >
                      <div className={cn(dropdownCls, "w-[18.5rem] max-w-[calc(100vw-1.5rem)] p-1.5")}>
                        <LangPickerList
                          language={language}
                          onSelect={(code) => handleLanguageChange(code)}
                        />
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </div>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              title="Toggle theme"
              className={cn(
                "relative rounded-full flex items-center justify-center transition-colors duration-75",
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

            {/* Divider */}
            <div className={cn("h-4 w-px rounded-full", isDarkNav ? "bg-white/10" : "bg-border/60")} />

            {/* Auth */}
            {!isLoaded ? (
              <div className={cn("rounded-full bg-muted/80 animate-pulse", scrolled ? "h-9 w-24" : "h-10 w-28")} aria-hidden />
            ) : isSignedIn ? (
              <div
                ref={userRef}
                className="relative"
                {...navDropdownHoverProps("user", hoverCloseTimers, setUserOpen, closeCountryAndLang)}
              >
                <button
                  {...navDropdownTriggerProps(userOpen, displayName || t("my_reports"))}
                  className={cn(
                    "flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full transition-colors duration-75 outline-none",
                    isDarkNav ? "hover:bg-white/[0.07]" : "hover:bg-primary/[0.06]",
                  )}
                >
                  <Avatar className={cn("transition-all duration-300", scrolled ? "h-7 w-7" : "h-8 w-8")}>
                    <AvatarImage src={user?.avatarUrl ?? undefined} alt={user?.name ?? ""} />
                    <AvatarFallback className="text-xs bg-primary/10 text-primary font-bold">
                      {avatarInitial}
                    </AvatarFallback>
                  </Avatar>
                  <span className={cn(
                    "font-medium max-w-[100px] truncate hidden lg:block transition-colors",
                    scrolled ? "text-[13px]" : "text-[14px]",
                    isDarkNav ? "text-white/80" : "text-foreground",
                  )}>
                    {displayName}
                  </span>
                  <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-75", isDarkNav ? "text-white/35" : "text-muted-foreground", userOpen && "rotate-180")} />
                </button>

                <AnimatePresence>
                  {userOpen && (
                    <motion.div
                      {...NAV_DROPDOWN_MOTION}
                      style={{ transformOrigin: "top right" }}
                      className={cn(NAV_DROPDOWN_ANCHOR, "right-0")}
                    >
                      <div className={cn(dropdownCls, "w-56 py-1.5")}>
                      <div className="px-4 py-3 border-b border-border/60 mb-1">
                        {user?.name && <p className="font-semibold text-sm truncate">{user.name}</p>}
                        <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                      </div>
                      <PrefetchLink
                        href={`/${language}/dashboard`}
                        onClick={() => setUserOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm hover:bg-primary/[0.06] transition-colors duration-75 rounded-lg mx-1.5"
                      >
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                        {t("my_reports")}
                      </PrefetchLink>
                      {isAdmin && (
                        <PrefetchLink
                          href="/adminx"
                          onClick={closeMenus}
                          className="flex items-center gap-2.5 px-4 py-2 text-sm hover:bg-primary/[0.06] transition-colors duration-75 rounded-lg mx-1.5"
                        >
                          <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                          {t("admin")}
                        </PrefetchLink>
                      )}
                      <div className="border-t border-border/60 mt-1 pt-1 mx-1.5">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-destructive hover:bg-destructive/8 transition-colors duration-75 rounded-lg"
                        >
                          <LogOut className="h-3.5 w-3.5" />
                          {t("logout")}
                        </button>
                      </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "font-medium rounded-full transition-colors duration-75",
                    scrolled ? "h-9 px-3.5 text-sm" : "h-10 px-4 text-[15px]",
                    isDarkNav
                      ? "text-white/60 hover:text-white hover:bg-white/[0.07]"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                  asChild
                >
                  <PrefetchLink href={`/${language}/sign-in`}>{t("sign_in")}</PrefetchLink>
                </Button>
                <Button
                  size="sm"
                  className={cn(
                    "font-semibold rounded-full shadow-sm shadow-primary/15 hover:shadow-primary/25 transition-all",
                    scrolled ? "h-9 px-4 text-sm" : "h-10 px-5 text-[15px]",
                  )}
                  asChild
                >
                  <PrefetchLink href={`/${language}/sign-up`}>{t("sign_up")}</PrefetchLink>
                </Button>
              </div>
            )}
          </div>

          {/* Mobile menu */}
          <div className="md:hidden flex items-center gap-1.5">
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
                  "relative rounded-full flex items-center justify-center transition-colors duration-75",
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
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <MobileMenuToggle
                  open={mobileOpen}
                  scrolled={scrolled}
                  isDarkNav={isDarkNav}
                  label={mobileOpen ? t("nav_close_menu") : t("nav_open_menu")}
                  onPointerDown={prefetchMobileNavFlags}
                />
              </SheetTrigger>

            <SheetContent
              side="right"
              speed="fast"
              overlayClassName="z-[110] touch-none"
              className="z-[110] w-[min(288px,86vw)] p-0 flex flex-col h-full max-h-[100dvh] border-l border-border/50 shadow-2xl shadow-black/20"
              onOpenAutoFocus={(e) => e.preventDefault()}
            >
              {/* Mobile header */}
              <div className="flex items-center justify-between px-5 h-16 border-b shrink-0">
                <PrefetchLink
                  href={`/${language}`}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center -translate-y-px"
                >
                  <KmcheckLogo className="h-8" />
                </PrefetchLink>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-primary/[0.06] active:scale-95 transition-all duration-150"
                  aria-label={t("nav_close_menu")}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Mobile nav links */}
              <nav className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain px-3 py-3 space-y-0.5 [-webkit-overflow-scrolling:touch] touch-pan-y">
                <PrefetchLink
                  href={`/${language}/how-it-works`}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors touch-manipulation active:bg-primary/10",
                    isOnPage("how-it-works") ? "bg-primary/8 text-primary" : "hover:bg-primary/[0.06]",
                  )}
                >
                  {t("nav_how_it_works")}
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </PrefetchLink>
                <PrefetchLink
                  href={`/${language}/pricing`}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                    isOnPage("pricing") ? "bg-primary/8 text-primary" : "hover:bg-primary/[0.06]",
                  )}
                >
                  {t("pricing")}
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </PrefetchLink>
                <PrefetchLink
                  href={`/${language}/faq`}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                    isOnPage("faq") ? "bg-primary/8 text-primary" : "hover:bg-primary/[0.06]",
                  )}
                >
                  {t("nav_faq")}
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </PrefetchLink>

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
                        <PrefetchLink href={`/${language}/dashboard`}>{t("my_reports")}</PrefetchLink>
                      </Button>
                      {isAdmin ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9 rounded-xl"
                          asChild
                          onClick={() => setMobileOpen(false)}
                        >
                          <PrefetchLink href="/adminx" onClick={closeMenus}>{t("admin")}</PrefetchLink>
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
                      <PrefetchLink href={`/${language}/sign-in`}>{t("sign_in")}</PrefetchLink>
                    </Button>
                    <Button className="flex-1 h-10 rounded-xl font-bold" asChild onClick={() => setMobileOpen(false)}>
                      <PrefetchLink href={`/${language}/sign-up`}>{t("sign_up")}</PrefetchLink>
                    </Button>
                  </div>
                )}
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
    const mq = window.matchMedia("(min-width: 768px)");
    const apply = () => {
      const navbarHeight = mq.matches ? 84 : 72;
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
    mq.addEventListener("change", apply);
    return () => {
      mq.removeEventListener("change", apply);
      document.documentElement.style.removeProperty("--site-header-offset");
      document.documentElement.style.removeProperty("--announcement-bar-height");
    };
  }, [announcementHeight]);

  return (
    <div className="min-h-[100dvh] flex flex-col overflow-x-clip w-full">
      <BannedSessionRedirect />
      <AnnouncementBar onHeightChange={setAnnouncementHeight} />
      <Navbar announcementOffset={announcementHeight} />
      <div
        className={cn(
          "flex flex-col flex-1",
          showClientNav && `md:pb-0 ${CLIENT_MOBILE_NAV_PADDING}`,
        )}
      >
        <main className="flex-1 overflow-x-hidden pt-[var(--site-header-offset,84px)] print:pt-0">
          {children}
        </main>
        <Footer />
      </div>
      <ClientMobileNav />
    </div>
  );
}
