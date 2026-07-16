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
}: {
  lang: Language;
  onSelect: (l: Language) => void;
  tone?: "nav" | "footer";
}) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState({ top: 0, bottom: 0, left: 0, width: 260 });
  usePrefetchPickerFlags(open);
  const meta = LANG_META[lang];
  const isFooter = tone === "footer";

  useEffect(() => {
    if (!open || !btnRef.current) return;
    const place = () => {
      const rect = btnRef.current!.getBoundingClientRect();
      const narrow = window.innerWidth < 768;
      const width = Math.min(narrow ? 15.5 * 16 : 17.5 * 16, window.innerWidth - 24);
      const centerX = rect.left + rect.width / 2;
      const left = Math.max(12, Math.min(centerX - width / 2, window.innerWidth - width - 12));
      setPos({
        top: rect.bottom + 8,
        bottom: window.innerHeight - rect.top + 10,
        left,
        width,
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
          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold transition",
          isFooter
            ? "text-slate-300 hover:bg-white/[0.06] hover:text-white"
            : "border border-slate-900/10 bg-white/70 text-slate-700 hover:border-slate-900/18 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-200 dark:hover:bg-white/[0.1]",
        )}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <FlagImg code={meta.flag} size={16} />
        <span className="max-w-[5.5rem] truncate sm:max-w-[7rem]">{meta.label}</span>
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
                "absolute overflow-hidden rounded-xl border shadow-2xl",
                isFooter
                  ? "border-white/10 bg-[#14201b] shadow-[0_-16px_48px_-12px_rgba(0,0,0,0.55)]"
                  : "border-slate-900/10 bg-white dark:border-white/10 dark:bg-[#0f1714]",
              )}
              style={
                isFooter
                  ? { bottom: pos.bottom, left: pos.left, width: pos.width }
                  : { top: pos.top, left: pos.left, width: pos.width }
              }
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div className="max-h-[min(20rem,48vh)] overflow-y-auto p-1.5">
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
    {
      href: `${base}/vin-decoder`,
      label: c.navDecoder,
      match: (p: string) => p.includes("/vin-decoder"),
    },
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
          "sticky top-0 z-40 border-b backdrop-blur-xl transition-[background-color,box-shadow,border-color] duration-300",
          scrolled
            ? "border-slate-900/10 bg-[#f3f7f4]/95 shadow-[0_10px_40px_-18px_rgba(15,23,42,0.22)] dark:border-white/[0.08] dark:bg-[#070c0a]/95 dark:shadow-black/60"
            : "border-transparent bg-[#f3f7f4]/70 dark:bg-[#070c0a]/75",
        )}
      >
        <div
          className={cn(
            "mx-auto flex h-[4.5rem] max-w-[74rem] items-center justify-between gap-3 px-4 sm:px-6",
          )}
        >
          <Link
            href={base}
            className={cn(
              "shrink-0 transition-transform duration-300 hover:scale-[1.015]",
              scrolled ? "translate-y-0" : "translate-y-0",
            )}
            aria-label="kmcheck API"
          >
            <KmcheckApiMark compact={scrolled} />
          </Link>

          <LayoutGroup id="b2b-nav">
          <nav className={cn(
            "hidden items-center gap-0.5 rounded-full border border-slate-900/[0.07] bg-white/60 p-1 backdrop-blur-md transition-transform duration-300 dark:border-white/[0.08] dark:bg-white/[0.04] lg:flex",
            scrolled ? "scale-[0.98]" : "scale-100",
          )}>
            {navPrimary.slice(0, 2).map((item) => {
              const active = item.match(pathOnly);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative rounded-full px-3.5 py-2 text-[13px] font-medium transition-colors duration-150",
                    active
                      ? "text-white"
                      : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white",
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="b2b-nav-pill"
                      className="absolute inset-0 rounded-full bg-slate-900 dark:bg-emerald-500/90"
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
                        ? "text-white"
                        : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white",
                    )}
                  >
                    {marketsActive && (
                      <motion.span
                        layoutId="b2b-nav-pill"
                        className="absolute inset-0 rounded-full bg-slate-900 dark:bg-emerald-500/90"
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
                              <span className="mt-0.5 line-clamp-1 text-[11px] text-slate-500 dark:text-slate-400">
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
                      ? "text-white"
                      : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white",
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="b2b-nav-pill"
                      className="absolute inset-0 rounded-full bg-slate-900 dark:bg-emerald-500/90"
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

          <div className="flex items-center gap-1.5 md:hidden">
            <LangDropdown lang={lang} onSelect={switchLang} />
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-800 transition hover:bg-slate-900/[0.06] dark:text-white dark:hover:bg-white/10"
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
              className="absolute inset-0 bg-[#050807]/55 backdrop-blur-[2px]"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 36 }}
              className="absolute inset-y-0 right-0 flex w-[min(19rem,88vw)] flex-col bg-[#f7faf8] dark:bg-[#0a110e]"
            >
              <div className="flex items-center justify-between px-5 pt-5 pb-3">
                <KmcheckApiMark compact />
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-900/[0.06] dark:text-slate-300 dark:hover:bg-white/10"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto px-3 pb-4 pt-1">
                <div className="space-y-0.5">
                  {navPrimary.map((item, idx) => {
                    const active = item.match(pathOnly);
                    return (
                      <motion.div
                        key={item.href}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.03 * idx }}
                      >
                        <Link
                          href={item.href}
                          onClick={() => setOpen(false)}
                          className={cn(
                            "flex items-center justify-between rounded-xl px-3.5 py-3 text-[15px] font-medium transition-colors",
                            active
                              ? "bg-slate-900/5 text-slate-900 dark:bg-emerald-500/15 dark:text-emerald-300"
                              : "text-slate-600 hover:bg-slate-900/[0.04] hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/[0.05] dark:hover:text-white",
                          )}
                        >
                          {item.label}
                          {active && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
                        </Link>
                      </motion.div>
                    );
                  })}

                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setMobileMarketsOpen((v) => !v)}
                      className="flex w-full items-center justify-between rounded-xl px-3.5 py-3 text-[15px] font-medium text-slate-600 transition-colors hover:bg-slate-900/[0.04] hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/[0.05] dark:hover:text-white"
                    >
                      {c.navRegions}
                      <ChevronDown className={cn("h-4 w-4 opacity-45 transition", mobileMarketsOpen && "rotate-180")} />
                    </button>
                    <AnimatePresence initial={false}>
                      {mobileMarketsOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.16 }}
                          className="overflow-hidden pt-1"
                        >
                          <button
                            type="button"
                            onClick={goMarketsSection}
                            className="flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 pl-5 text-sm font-medium text-emerald-700 dark:text-emerald-400"
                          >
                            {c.regionsTitle}
                            <ArrowRight className="h-3.5 w-3.5 opacity-60" />
                          </button>
                          {API_B2B_REGIONS.map((r) => (
                            <Link
                              key={r.slug}
                              href={`${base}/${r.slug}`}
                              onClick={() => setOpen(false)}
                              className={cn(
                                "flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 pl-5 text-sm transition-colors",
                                pathOnly.includes(`/${r.slug}`)
                                  ? "text-slate-900 dark:text-white"
                                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200",
                              )}
                            >
                              <FlagImg code={r.flag} size={16} />
                              {c[r.nameKey]}
                            </Link>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </nav>

              <div className="px-4 pb-5 pt-2">
                <Link
                  href={`${base}/contact`}
                  onClick={() => setOpen(false)}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white dark:bg-emerald-500 dark:text-emerald-950"
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

        <div className="relative mx-auto max-w-[74rem] px-4 py-14 sm:px-6">
          <div className="grid gap-12 md:grid-cols-[1.35fr_1fr_1fr_1fr]">
            <div>
              <KmcheckApiMark forDarkBg />
              <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-400">{c.footerTagline}</p>
              <div className="mt-6">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  {c.footerLanguage}
                </p>
                <LangDropdown lang={lang} onSelect={switchLang} tone="footer" />
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
                  <Link href={`${base}/vin-decoder`} className="transition hover:text-white">{c.navDecoder}</Link>
                </li>
                <li>
                  <Link href={`${base}/contact`} className="transition hover:text-white">{c.navContact}</Link>
                </li>
              </ul>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400/90">{c.navContact}</p>
              <div className="mt-4 flex flex-col gap-2.5">
                <a
                  href={`mailto:${c.contactEmail}`}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 px-4 py-2.5 text-sm font-semibold text-white transition hover:border-emerald-400/40 hover:bg-white/[0.06]"
                >
                  <Mail className="h-4 w-4 text-emerald-400" />
                  {c.contactEmailLabel}
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
              <p className="mt-3 truncate text-center text-[11px] text-slate-500">{c.contactEmail}</p>
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
