import { Link, useLocation } from "wouter";
import { KmcheckLogo } from "@/components/logo";
import { useTheme } from "@/components/theme-provider";
import { FlagImg } from "@/components/flag-img";
import { cn } from "@/lib/utils";
import { API_B2B_REGIONS } from "./regions";
import { LANG_META } from "@/lib/languages";
import type { Language } from "@/lib/languages";
import { setStoredLangPreference } from "@/lib/lang-preference";
import { ensureDict } from "@/i18n/context";
import { LangPickerList, usePrefetchPickerFlags } from "@/components/lang-picker-list";
import { Menu, X, Send, Mail, ChevronDown, ChevronUp, ArrowUpRight, ArrowRight } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, LayoutGroup } from "framer-motion";
import { useApiB2bCopy } from "./use-copy";

const SCROLL_MARKETS_KEY = "api-b2b-scroll-markets";

export function KmcheckApiMark({
  className,
  forDarkBg = false,
  compact = false,
}: {
  className?: string;
  forDarkBg?: boolean;
  compact?: boolean;
}) {
  const { c } = useApiB2bCopy();
  const { resolvedTheme } = useTheme();
  const useWhiteMark = forDarkBg || resolvedTheme === "dark";
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <KmcheckLogo
        variant={useWhiteMark ? "dark" : "light"}
        className={cn(compact ? "h-6 md:h-7" : "h-7 md:h-8")}
      />
      <span
        aria-hidden
        className={cn(
          "h-4 w-px",
          useWhiteMark ? "bg-white/20" : "bg-slate-900/15",
        )}
      />
      <span
        className={cn(
          "rounded-md border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em]",
          useWhiteMark
            ? "border-white/15 bg-white/[0.06] text-white/55"
            : "border-slate-900/10 bg-slate-900/[0.05] text-slate-600/80",
        )}
      >
        {c.brandApi}
      </span>
    </span>
  );
}

function LangDropdown({
  lang,
  onSelect,
  tone = "nav",
  align = "right",
}: {
  lang: Language;
  onSelect: (l: Language) => void;
  tone?: "nav" | "footer";
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState({ top: 0, bottom: 0, left: 0, right: 0 });
  usePrefetchPickerFlags(open);
  const meta = LANG_META[lang];
  const isFooter = tone === "footer";

  useEffect(() => {
    if (!open || !btnRef.current) return;
    const place = () => {
      const rect = btnRef.current!.getBoundingClientRect();
      setPos({
        top: rect.bottom + 8,
        bottom: window.innerHeight - rect.top + 10,
        left: rect.left,
        right: window.innerWidth - rect.right,
      });
    };
    place();
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [open]);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition",
          isFooter
            ? "border-white/15 bg-white/5 text-white hover:bg-white/10"
            : "border-slate-900/10 bg-white/90 text-slate-700 shadow-sm hover:border-slate-900/20 dark:border-white/15 dark:bg-white/5 dark:text-slate-200",
        )}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <FlagImg code={meta.flag} size={18} />
        <span className="max-w-[7rem] truncate">{meta.label}</span>
        {isFooter ? (
          <ChevronUp className="h-3.5 w-3.5 shrink-0 opacity-60" />
        ) : (
          <ChevronDown className={cn("h-3.5 w-3.5 shrink-0 opacity-60 transition", open && "rotate-180")} />
        )}
      </button>
      {open
        && createPortal(
          <div className="fixed inset-0 z-[80]" onMouseDown={() => setOpen(false)}>
            <div
              className={cn(
                "absolute w-[min(20rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border shadow-2xl",
                isFooter
                  ? "border-white/10 bg-[#14201b] shadow-[0_-16px_48px_-12px_rgba(0,0,0,0.55)]"
                  : "border-slate-900/10 bg-white dark:border-white/10 dark:bg-[#121a17]",
              )}
              style={
                isFooter
                  ? align === "left"
                    ? { bottom: pos.bottom, left: Math.max(12, pos.left) }
                    : { bottom: pos.bottom, right: Math.max(12, pos.right) }
                  : align === "left"
                    ? { top: pos.top, left: Math.max(12, pos.left) }
                    : { top: pos.top, right: Math.max(12, pos.right) }
              }
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div className="max-h-[min(22rem,50vh)] overflow-y-auto p-2">
                <LangPickerList
                  language={lang}
                  tone={isFooter ? "footer" : "nav"}
                  onSelect={(code) => {
                    onSelect(code);
                    setOpen(false);
                  }}
                />
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

function scrollToMarkets() {
  const el = document.getElementById("markets");
  if (!el) return false;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
  return true;
}

export function ApiB2bLayout({ children }: { children: ReactNode }) {
  const { lang, c, base } = useApiB2bCopy();
  const [location, setLocation] = useLocation();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [marketsOpen, setMarketsOpen] = useState(false);
  const [mobileMarketsOpen, setMobileMarketsOpen] = useState(false);
  const marketsRef = useRef<HTMLDivElement>(null);
  const pathOnly = location.split("?")[0] ?? location;
  const isHome = pathOnly === base || pathOnly === `${base}/`;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (sessionStorage.getItem(SCROLL_MARKETS_KEY) !== "1") return;
    sessionStorage.removeItem(SCROLL_MARKETS_KEY);
    const t = window.setTimeout(() => scrollToMarkets(), 80);
    return () => clearTimeout(t);
  }, [location]);

  useEffect(() => {
    if (!marketsOpen) return;
    const close = (e: MouseEvent) => {
      if (marketsRef.current && !marketsRef.current.contains(e.target as Node)) {
        setMarketsOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [marketsOpen]);

  const goMarketsSection = () => {
    setOpen(false);
    setMarketsOpen(false);
    if (isHome) {
      scrollToMarkets();
      return;
    }
    sessionStorage.setItem(SCROLL_MARKETS_KEY, "1");
    setLocation(base);
  };

  const navPrimary = [
    { href: base, label: c.navHome, match: (p: string) => p === base || p === `${base}/` },
    { href: `${base}/plans`, label: c.navPlans, match: (p: string) => p.includes("/plans") },
    { href: `${base}/contact`, label: c.navContact, match: (p: string) => p.includes("/contact") },
  ];

  const switchLang = (next: Language) => {
    setStoredLangPreference(next);
    void ensureDict(next);
    const rest = location.replace(new RegExp(`^/${lang}`), "") || "/api-b2b";
    setLocation(`/${next}${rest.startsWith("/") ? rest : `/${rest}`}`);
    setOpen(false);
  };

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <div className="api-b2b min-h-screen bg-[#f3f7f4] text-slate-900 dark:bg-[#090f0d] dark:text-slate-100">
      <header
        className={cn(
          "sticky top-0 z-40 border-b backdrop-blur-xl transition-[height,background-color,box-shadow,border-color] duration-300",
          scrolled
            ? "border-slate-900/10 bg-[#f3f7f4]/95 shadow-[0_10px_40px_-18px_rgba(15,23,42,0.22)] dark:border-white/10 dark:bg-[#090f0d]/95 dark:shadow-black/50"
            : "border-slate-900/[0.06] bg-[#f3f7f4]/80 dark:border-white/10 dark:bg-[#090f0d]/80",
        )}
      >
        <div
          className={cn(
            "mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 transition-[height] duration-300 sm:px-6",
            scrolled ? "h-[3.75rem]" : "h-[4.5rem]",
          )}
        >
          <Link
            href={base}
            className="shrink-0 transition-transform duration-300 hover:scale-[1.015]"
            aria-label="kmcheck API"
          >
            <KmcheckApiMark compact={scrolled} />
          </Link>

          <LayoutGroup id="b2b-nav">
          <nav className="hidden items-center gap-0.5 rounded-full border border-slate-900/[0.08] bg-white/75 p-1 shadow-[0_1px_2px_rgba(15,23,42,0.04)] backdrop-blur-md dark:border-white/10 dark:bg-white/[0.05] lg:flex">
            {navPrimary.slice(0, 2).map((item) => {
              const active = item.match(pathOnly);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative rounded-full px-3.5 py-2 text-[13px] font-medium transition-colors duration-150",
                    active
                      ? "text-white dark:text-slate-900"
                      : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white",
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="b2b-nav-pill"
                      className="absolute inset-0 rounded-full bg-slate-900 dark:bg-white"
                      transition={{ type: "spring", stiffness: 420, damping: 32 }}
                    />
                  )}
                  <span className="relative z-[1]">{item.label}</span>
                </Link>
              );
            })}

            <div ref={marketsRef} className="relative">
              {(() => {
                const marketsActive =
                  marketsOpen
                  || pathOnly.includes("/usa-cars")
                  || pathOnly.includes("/canada-cars")
                  || pathOnly.includes("/korea-cars")
                  || pathOnly.includes("/dubai-cars")
                  || pathOnly.includes("/china-cars");
                return (
                  <button
                    type="button"
                    onClick={() => setMarketsOpen((v) => !v)}
                    className={cn(
                      "relative inline-flex items-center gap-1 rounded-full px-3.5 py-2 text-[13px] font-medium transition-colors duration-150",
                      marketsActive
                        ? "text-white dark:text-slate-900"
                        : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white",
                    )}
                  >
                    {marketsActive && (
                      <motion.span
                        layoutId="b2b-nav-pill"
                        className="absolute inset-0 rounded-full bg-slate-900 dark:bg-white"
                        transition={{ type: "spring", stiffness: 420, damping: 32 }}
                      />
                    )}
                    <span className="relative z-[1] inline-flex items-center gap-1">
                      {c.navRegions}
                      <ChevronDown className={cn("h-3.5 w-3.5 opacity-60 transition duration-150", marketsOpen && "rotate-180")} />
                    </span>
                  </button>
                );
              })()}
              <AnimatePresence>
                {marketsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.98 }}
                    transition={{ duration: 0.16 }}
                    className="absolute left-1/2 top-full z-50 mt-3 w-[19rem] -translate-x-1/2 overflow-hidden rounded-2xl border border-slate-900/10 bg-white/95 p-2 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-[#101816]/95"
                  >
                    <button
                      type="button"
                      onClick={goMarketsSection}
                      className="mb-1 flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-slate-800 hover:bg-slate-900/[0.04] dark:text-slate-100 dark:hover:bg-white/5"
                    >
                      {c.regionsTitle}
                      <ArrowRight className="h-3.5 w-3.5 opacity-40" />
                    </button>
                    <div className="h-px bg-slate-900/8 dark:bg-white/10" />
                    <ul className="mt-1 space-y-0.5">
                      {API_B2B_REGIONS.map((r) => (
                        <li key={r.slug}>
                          <Link
                            href={`${base}/${r.slug}`}
                            onClick={() => setMarketsOpen(false)}
                            className="group flex items-start gap-2.5 rounded-xl px-3 py-2.5 transition hover:bg-slate-900/[0.04] dark:hover:bg-white/5"
                          >
                            <FlagImg code={r.flag} size={18} className="mt-0.5" />
                            <span className="min-w-0">
                              <span className="block text-sm font-medium text-slate-800 dark:text-slate-100">
                                {c[r.nameKey]}
                              </span>
                              <span className="mt-0.5 line-clamp-1 text-[11px] text-slate-500">
                                {c[r.blurbKey]}
                              </span>
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {navPrimary.slice(2).map((item) => {
              const active = item.match(pathOnly);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative rounded-full px-3.5 py-2 text-[13px] font-medium transition-colors duration-150",
                    active
                      ? "text-white dark:text-slate-900"
                      : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white",
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="b2b-nav-pill"
                      className="absolute inset-0 rounded-full bg-slate-900 dark:bg-white"
                      transition={{ type: "spring", stiffness: 420, damping: 32 }}
                    />
                  )}
                  <span className="relative z-[1]">{item.label}</span>
                </Link>
              );
            })}
          </nav>
          </LayoutGroup>

          <div className="hidden items-center gap-2.5 md:flex">
            <LangDropdown lang={lang} onSelect={switchLang} />
            <Link
              href={`${base}/contact`}
              className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-slate-900/15 transition hover:bg-slate-800 dark:bg-emerald-500 dark:text-emerald-950 dark:shadow-emerald-500/20 dark:hover:bg-emerald-400"
            >
              {c.ctaStart}
              <ArrowUpRight className="h-3.5 w-3.5 opacity-80" />
            </Link>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <LangDropdown lang={lang} onSelect={switchLang} />
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-900/10 bg-white/90 text-slate-800 shadow-sm dark:border-white/15 dark:bg-white/5 dark:text-white"
              onClick={() => setOpen(true)}
              aria-label="Menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              type="button"
              className="absolute inset-0 bg-[#0a1012]/60 backdrop-blur-[3px]"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 340, damping: 34 }}
              className="absolute inset-y-0 right-0 flex w-[min(22.5rem,94vw)] flex-col border-l border-slate-900/10 bg-[#f7faf8] shadow-2xl dark:border-white/10 dark:bg-[#0e1613]"
            >
              <div className="flex items-center justify-between border-b border-slate-900/10 px-4 py-4 dark:border-white/10">
                <KmcheckApiMark />
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-900/10 dark:border-white/15"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto px-3 py-4">
                <div className="space-y-1.5">
                  {navPrimary.map((item, idx) => {
                    const active = item.match(pathOnly);
                    return (
                      <motion.div
                        key={item.href}
                        initial={{ opacity: 0, x: 12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.04 * idx }}
                      >
                        <Link
                          href={item.href}
                          onClick={() => setOpen(false)}
                          className={cn(
                            "flex items-center justify-between rounded-2xl px-4 py-3.5 text-[15px] font-medium transition",
                            active
                              ? "bg-slate-900 text-white shadow-md shadow-slate-900/20 dark:bg-emerald-500 dark:text-emerald-950"
                              : "bg-white text-slate-700 shadow-sm ring-1 ring-slate-900/[0.06] hover:bg-slate-50 dark:bg-white/5 dark:text-slate-200 dark:ring-white/10",
                          )}
                        >
                          {item.label}
                          <ArrowUpRight className={cn("h-4 w-4", active ? "opacity-80" : "opacity-35")} />
                        </Link>
                      </motion.div>
                    );
                  })}

                  <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-900/[0.06] dark:bg-white/5 dark:ring-white/10">
                    <button
                      type="button"
                      onClick={() => setMobileMarketsOpen((v) => !v)}
                      className="flex w-full items-center justify-between px-4 py-3.5 text-[15px] font-medium text-slate-700 dark:text-slate-200"
                    >
                      {c.navRegions}
                      <ChevronDown className={cn("h-4 w-4 opacity-50 transition", mobileMarketsOpen && "rotate-180")} />
                    </button>
                    <AnimatePresence initial={false}>
                      {mobileMarketsOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden border-t border-slate-900/8 dark:border-white/10"
                        >
                          <button
                            type="button"
                            onClick={goMarketsSection}
                            className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold text-emerald-800 dark:text-emerald-300"
                          >
                            {c.regionsTitle}
                            <ArrowRight className="h-3.5 w-3.5" />
                          </button>
                          {API_B2B_REGIONS.map((r) => (
                            <Link
                              key={r.slug}
                              href={`${base}/${r.slug}`}
                              onClick={() => setOpen(false)}
                              className="flex items-center gap-2.5 px-4 py-3 text-sm text-slate-700 hover:bg-slate-900/[0.03] dark:text-slate-200 dark:hover:bg-white/5"
                            >
                              <FlagImg code={r.flag} size={18} />
                              {c[r.nameKey]}
                            </Link>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </nav>

              <div className="border-t border-slate-900/10 p-4 dark:border-white/10">
                <Link
                  href={`${base}/contact`}
                  onClick={() => setOpen(false)}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 dark:bg-emerald-500 dark:text-emerald-950 dark:shadow-emerald-500/25"
                >
                  {c.ctaStart}
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="min-h-[60vh]">
        <AnimatePresence mode="wait">
          <motion.div
            key={pathOnly}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="relative mt-20 overflow-hidden border-t border-white/10 bg-[#0a1410] text-slate-200">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/35 to-transparent" />
        <div className="pointer-events-none absolute -left-24 top-0 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-16 bottom-0 h-48 w-48 rounded-full bg-teal-400/10 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="grid gap-12 md:grid-cols-[1.35fr_1fr_1fr_1fr]">
            <div>
              <KmcheckApiMark forDarkBg />
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-400">{c.footerTagline}</p>
              <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  {c.footerLanguage}
                </p>
                <LangDropdown lang={lang} onSelect={switchLang} tone="footer" align="left" />
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400/90">{c.navRegions}</p>
              <ul className="mt-4 space-y-2.5">
                {API_B2B_REGIONS.map((r) => (
                  <li key={r.slug}>
                    <Link
                      href={`${base}/${r.slug}`}
                      className="group inline-flex items-center gap-2.5 text-sm text-slate-300 transition hover:text-white"
                    >
                      <FlagImg code={r.flag} size={16} />
                      <span className="transition group-hover:translate-x-0.5">{c[r.nameKey]}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400/90">{c.navPlans}</p>
              <ul className="mt-4 space-y-2.5 text-sm text-slate-300">
                <li>
                  <Link href={base} className="transition hover:text-white">{c.navHome}</Link>
                </li>
                <li>
                  <Link href={`${base}/plans`} className="transition hover:text-white">{c.planDevTitle}</Link>
                </li>
                <li>
                  <Link href={`${base}/plans`} className="transition hover:text-white">{c.planManagedTitle}</Link>
                </li>
                <li>
                  <Link href={`${base}/contact`} className="transition hover:text-white">{c.navContact}</Link>
                </li>
              </ul>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400/90">{c.navContact}</p>
              <div className="mt-4 space-y-3">
                <a
                  href={`mailto:${c.contactEmail}`}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-sm text-slate-300 transition hover:border-emerald-400/30 hover:bg-white/[0.06] hover:text-white"
                >
                  <Mail className="h-4 w-4 shrink-0 text-emerald-400" />
                  <span className="min-w-0 truncate">{c.contactEmail}</span>
                </a>
                <a
                  href={`https://t.me/${c.contactTelegram}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#229ED9] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1d8fc4]"
                >
                  <Send className="h-4 w-4" />
                  {c.contactTelegramLabel}
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="relative border-t border-white/10 py-5 text-center text-xs text-slate-500">
          {c.footerRights}
        </div>
      </footer>
    </div>
  );
}
