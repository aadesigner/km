import { useState } from "react";
import { useTranslation } from "@/i18n/context";
import { DashboardReportList } from "@/components/dashboard-report-list";
import { ClientAreaLayout } from "@/components/client-area-layout";
import { ObfuscatedEmailLink } from "@/components/obfuscated-email-link";
import { prefetchVinPageChunk, seedVinLookupsFromHistory } from "@/lib/prefetch-vin-report";
import { warmVinImages } from "@/lib/vin-image-cache";
import {
  useGetUserStats,
  useDeleteUserVinLookup,
} from "@workspace/api-client-react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { CLIENT_AREA_QUERY_OPTIONS, orvalQuery } from "@/lib/query-options";
import type { UserStats } from "@workspace/api-client-react";
import {
  DEFAULT_USER_HISTORY_SUMMARY,
  fetchUserHistory,
  userHistoryQueryKey,
} from "@/lib/user-history-api";
import { useAuth } from "@/lib/auth-context";
import { useLocation, Link } from "wouter";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import {
  FileText, Search,
  AlertCircle, User, HelpCircle,
  ShieldCheck, Zap, MessageCircle, CalendarDays, Globe, Loader2,
} from "lucide-react";
import { motion } from "framer-motion";
import { fadeUp } from "@/lib/motion-variants";
import { cn } from "@/lib/utils";
import { SEOHead, usePageSeo } from "@/components/seo";
import { UserCountrySelect } from "@/components/user-country-select";
import { FlagImg } from "@/components/flag-img";
import { userCountryLabel } from "@/lib/user-countries";
import { Label } from "@/components/ui/label";
import {
  buildPrefillOnlyCheckoutPath,
  clearStoredPendingVin,
  isEligiblePendingVin,
  readStoredPendingVin,
  type PendingVinPeek,
} from "@/lib/checkout-vin-flow";
import {
  dashboardPath,
  parseDashboardView,
  normalizeClientPath,
  type DashboardView,
} from "@/lib/dashboard-nav";
import { ClientQueryFallback } from "@/components/client-query-fallback";
import { getErrorStatus } from "@/lib/api-error";

function useGreeting(t: (k: string) => string): string {
  const hour = new Date().getHours();
  if (hour < 12) return t("dashboard_good_morning");
  if (hour < 17) return t("dashboard_good_afternoon");
  return t("dashboard_good_evening");
}

type ActiveView = DashboardView;

function DashboardStatCard({
  label,
  hint,
  value,
  loading,
  icon: Icon,
  variant = "muted",
  delay = 0,
}: {
  label: string;
  hint: string;
  value: string;
  loading: boolean;
  icon: React.ElementType;
  variant?: "muted" | "primary";
  delay?: number;
}) {
  const isPrimary = variant === "primary";
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border border-border/60 shadow-sm",
        "bg-gradient-to-br from-background via-background to-muted/20",
        "px-3 py-2.5 sm:px-3.5 sm:py-3",
        "hover:shadow-md hover:border-border transition-[box-shadow,border-color] duration-200",
        isPrimary ? "border-l-[3px] border-l-primary/55" : "border-l-[3px] border-l-border",
      )}
    >
      <div className="flex items-center justify-between gap-2 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className={cn(
            "h-7 w-7 sm:h-8 sm:w-8 rounded-md flex items-center justify-center shrink-0",
            "ring-1 ring-border/50",
            isPrimary ? "bg-primary/10 text-primary" : "bg-muted/70 text-muted-foreground",
          )}>
            <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="text-xs sm:text-[13px] font-semibold text-foreground leading-tight truncate">
              {label}
            </p>
            <p className="text-[10px] sm:text-[11px] text-muted-foreground leading-tight truncate">
              {hint}
            </p>
          </div>
        </div>
        <p className={cn(
          "text-lg sm:text-xl font-black tabular-nums tracking-tight leading-none shrink-0",
          isPrimary && "text-primary",
        )}>
          {loading ? (
            <span className="inline-block h-5 sm:h-6 w-8 rounded bg-muted animate-pulse" aria-hidden />
          ) : (
            value
          )}
        </p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { t, language } = useTranslation();
  const seo = usePageSeo("dashboard");
  const { isSignedIn, isLoaded, user, refreshUser } = useAuth();
  const [location, setLocation] = useLocation();
  const greeting = useGreeting(t);
  const activeView = parseDashboardView(location, language);
  const [accountCountry, setAccountCountry] = useState("");
  const [savingCountry, setSavingCountry] = useState(false);
  const [countryMsg, setCountryMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [countryChangesRemaining, setCountryChangesRemaining] = useState<number | null>(null);

  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (hash === "account" || hash === "help") {
      setLocation(dashboardPath(language, hash), { replace: true });
    }
  }, [language, setLocation]);

  useEffect(() => {
    const path = normalizeClientPath(location);
    const prefix = `/${language}/dashboard/`;
    if (!path.startsWith(prefix)) return;
    const segment = path.slice(prefix.length);
    if (segment && segment !== "account" && segment !== "help") {
      setLocation(dashboardPath(language), { replace: true });
    }
  }, [location, language, setLocation]);

  const setActiveView = (view: ActiveView) => {
    setLocation(dashboardPath(language, view));
  };

  const queryClient = useQueryClient();

  const historyParams = DEFAULT_USER_HISTORY_SUMMARY;
  const authReady = isLoaded && isSignedIn;
  const {
    data: history,
    isLoading: historyLoading,
    isError: historyError,
    error: historyErr,
    refetch: refetchHistory,
    isFetching: historyFetching,
  } = useQuery({
    queryKey: userHistoryQueryKey(historyParams),
    queryFn: ({ signal }) => fetchUserHistory(historyParams, signal),
    enabled: authReady,
    ...CLIENT_AREA_QUERY_OPTIONS,
  });
  const { data: stats, isLoading: statsLoading, isError: statsError, error: statsErr, refetch: refetchStats, isFetching: statsFetching } = useGetUserStats(
    { query: { enabled: authReady, ...orvalQuery<UserStats>(CLIENT_AREA_QUERY_OPTIONS) } },
  );

  const deleteLookup = useDeleteUserVinLookup({
    mutation: {
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: ["/api/user/history"] });
        void queryClient.invalidateQueries({ queryKey: ["/api/user/stats"] });
      },
    },
  });

  useEffect(() => {
    if (isLoaded && !isSignedIn) setLocation(`/${language}/sign-in`);
  }, [isLoaded, isSignedIn, language, setLocation]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) return;
    if (user.hasPassword === false) {
      setLocation(`/${language}/set-password`);
    }
  }, [isLoaded, isSignedIn, user, language, setLocation]);

  useEffect(() => {
    setAccountCountry(user?.countryCode ?? "");
    setCountryMsg(null);
  }, [user?.id, user?.countryCode]);

  useEffect(() => {
    if (activeView !== "account" || !isSignedIn) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(`${import.meta.env.BASE_URL.replace(/\/$/, "")}/api/user/profile`, {
          credentials: "include",
        });
        if (!res.ok) return;
        const data = await res.json() as {
          countryCode?: string | null;
          countryChangesRemaining?: number;
          countryChangesLimit?: number;
        };
        if (cancelled) return;
        if (typeof data.countryChangesRemaining === "number") {
          setCountryChangesRemaining(data.countryChangesRemaining);
        }
      } catch {
        /* ignore */
      }
    })();
    return () => { cancelled = true; };
  }, [activeView, isSignedIn, user?.id]);

  useEffect(() => {
    const err = historyError ? historyErr : statsError ? statsErr : null;
    if (!err) return;
    if (getErrorStatus(err) === 401) {
      setLocation(`/${language}/sign-in`);
    }
  }, [historyError, historyErr, statsError, statsErr, language, setLocation]);

  useEffect(() => {
    if (!isSignedIn) return;
    prefetchVinPageChunk();
  }, [isSignedIn]);

  useEffect(() => {
    if (!history?.items?.length) return;
    seedVinLookupsFromHistory(queryClient, history.items);

    const thumbUrls = history.items
      .map((lookup) => {
        const d = lookup.data as { photos?: string[]; thumbnailUrl?: string | null } | null | undefined;
        if (!d) return null;
        if (Array.isArray(d.photos) && d.photos[0]) return d.photos[0];
        return d.thumbnailUrl ?? null;
      })
      .filter((url): url is string => typeof url === "string" && url.length > 0);
    if (thumbUrls.length) void warmVinImages(thumbUrls.slice(0, 3));
  }, [history?.items, queryClient]);

  // Pending VIN check saved in sessionStorage before auth / checkout
  const [pendingVin, setPendingVin] = useState<string | null>(() => readStoredPendingVin());
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

  const saveAccountCountry = async () => {
    if (!accountCountry) {
      setCountryMsg({ ok: false, text: t("auth_error_country_required") });
      return;
    }
    if (countryChangesRemaining === 0) {
      setCountryMsg({ ok: false, text: t("account_country_change_limit") });
      return;
    }
    setSavingCountry(true);
    setCountryMsg(null);
    try {
      const res = await fetch(`${basePath}/api/user/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ countryCode: accountCountry }),
      });
      const data = await res.json() as {
        error?: string;
        code?: string;
        countryCode?: string | null;
        countryChangesRemaining?: number;
        countryChangesLimit?: number;
      };
      if (typeof data.countryChangesRemaining === "number") {
        setCountryChangesRemaining(data.countryChangesRemaining);
      }
      if (!res.ok) {
        setCountryMsg({
          ok: false,
          text: data.code === "COUNTRY_CHANGE_LIMIT"
            ? t("account_country_change_limit")
            : (data.error || t("error_generic")),
        });
        return;
      }
      await refreshUser();
      setCountryMsg({ ok: true, text: t("account_country_saved") });
    } catch {
      setCountryMsg({ ok: false, text: t("error_generic") });
    } finally {
      setSavingCountry(false);
    }
  };

  const { data: pendingPeek, isLoading: pendingPeekLoading, isError: pendingPeekError, error: pendingPeekErr } = useQuery<PendingVinPeek>({
    queryKey: ["/api/vin/peek", "pending-banner", pendingVin],
    enabled: !!pendingVin && !!isSignedIn,
    staleTime: 60_000,
    retry: false,
    queryFn: async () => {
      const r = await fetch(`${basePath}/api/vin/peek/${encodeURIComponent(pendingVin!)}`, {
        credentials: "include",
      });
      if (r.status === 400) {
        const err = new Error("invalid_vin");
        (err as Error & { invalidVin?: boolean }).invalidVin = true;
        throw err;
      }
      if (!r.ok) throw new Error("peek_failed");
      return r.json() as Promise<PendingVinPeek>;
    },
  });

  const showPendingBanner =
    !!pendingVin &&
    !pendingPeekLoading &&
    !!pendingPeek &&
    isEligiblePendingVin(pendingPeek);

  // Drop ineligible or invalid pending VINs (nonsense VINs, not in local-exists / catalog)
  useEffect(() => {
    if (!pendingVin || pendingPeekLoading) return;
    if (pendingPeekError) {
      if ((pendingPeekErr as Error & { invalidVin?: boolean })?.invalidVin) {
        clearStoredPendingVin();
        setPendingVin(null);
      }
      return;
    }
    if (!pendingPeek || !isEligiblePendingVin(pendingPeek)) {
      clearStoredPendingVin();
      setPendingVin(null);
    }
  }, [pendingVin, pendingPeek, pendingPeekLoading, pendingPeekError, pendingPeekErr]);

  // Clear the pending-VIN banner if the user already has a completed report for it
  useEffect(() => {
    if (!pendingVin || !history?.items) return;
    const alreadyOwned = history.items.some(
      l => l.vin.toUpperCase() === pendingVin.toUpperCase() && (l.status === "complete" || l.status === "pending_manual")
    );
    if (alreadyOwned) {
      clearStoredPendingVin();
      setPendingVin(null);
    }
  }, [history, pendingVin]);

  if (!isSignedIn) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Skeleton className="h-8 w-48" />
      </div>
    );
  }

  const lookups = history?.items ?? [];
  const hasHistoryData = history != null;
  const totalChecks = stats?.totalChecks ?? lookups.length;
  const checksThisMonth = stats?.checksThisMonth ?? 0;
  const isViewableReport = (status: string) => status === "complete" || status === "pending_manual";
  const completed = lookups.filter(l => l.status === "complete" || l.status === "pending_manual").length;
  const handlePendingVinCheckout = () => {
    if (!pendingVin) return;
    const target = buildPrefillOnlyCheckoutPath(pendingVin, language);
    if (target) setLocation(target);
  };

  const pendingBanner = showPendingBanner && pendingVin ? (
    <div className="bg-muted/40 dark:bg-muted/20 border-b border-border px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2.5 text-sm text-foreground">
          <AlertCircle className="h-4 w-4 text-primary shrink-0" />
          <span className="text-foreground/90">
            {t("pending_vin_banner")}{" "}
            <strong className="font-mono tracking-wider">{pendingVin}</strong>
          </span>
        </div>
        <Button size="sm" className="h-8 shrink-0 rounded-full gap-1.5" onClick={handlePendingVinCheckout}>
          <Zap className="h-3.5 w-3.5" />
          {t("complete_purchase")}
        </Button>
      </div>
    </div>
  ) : null;

  return (
    <>
    <SEOHead title={seo.title} description={seo.description} lang={seo.lang} noIndex />
    <ClientAreaLayout before={pendingBanner}>
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-10 space-y-8">

          {/* Page header — varies by active view */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={0}
            className="flex items-center justify-between gap-4"
          >
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">
                {activeView === "account"
                  ? t("account")
                  : activeView === "help"
                    ? t("help_title")
                    : `${greeting}${user?.name ? `, ${user.name.split(" ")[0]}` : ""} 👋`}
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base mt-1">
                {activeView === "account"
                  ? t("account_subtitle")
                  : activeView === "help"
                    ? t("help_subtitle")
                    : t("dashboard_subtitle")}
              </p>
            </div>
          </motion.div>

          {/* ── ACCOUNT VIEW ── */}
          {activeView === "account" ? (
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={1}
              className="space-y-6"
            >
              <div className="rounded-2xl border bg-background shadow-sm overflow-hidden">
                {/* Profile header */}
                <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-6 py-6 flex items-center gap-5">
                  <Avatar className="h-16 w-16 border-4 border-background shadow-md">
                    <AvatarImage src={user?.avatarUrl ?? undefined} alt={user?.name || ""} />
                    <AvatarFallback className="text-xl"><User className="h-8 w-8" /></AvatarFallback>
                  </Avatar>
                  <div className="space-y-0.5">
                    <p className="text-xl font-bold leading-tight">{user?.name || "User"}</p>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                    {user?.createdAt && (
                      <p className="text-xs text-muted-foreground">
                        {t("member_since")}{" "}
                        {new Date(user.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "long" })}
                      </p>
                    )}
                  </div>
                </div>

                {/* Stats summary */}
                <div className="grid grid-cols-2 divide-x border-t">
                  {[
                    { label: t("total_checks"), value: String(totalChecks) },
                    { label: t("completed"), value: String(completed) },
                  ].map(({ label, value }) => (
                    <div key={label} className="py-4 px-4 text-center">
                      <p className="text-xl font-black tabular-nums">{statsLoading ? "—" : value}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                    </div>
                  ))}
                </div>

                {/* Profile country / nationality */}
                <div className="px-5 sm:px-6 py-5 border-t">
                  <div className="rounded-2xl border border-border/60 bg-muted/15 p-4 sm:p-5 space-y-4">
                    {!user?.countryCode && (
                      <div
                        role="status"
                        className="flex gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-3 text-amber-950 dark:text-amber-100"
                      >
                        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                        <div className="min-w-0 space-y-0.5">
                          <p className="text-sm font-semibold leading-snug">
                            {t("account_country_prompt_title")}
                          </p>
                          <p className="text-xs leading-relaxed opacity-90">
                            {t("account_country_prompt_body")}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold flex items-center gap-2">
                          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15">
                            <Globe className="h-3.5 w-3.5" />
                          </span>
                          {t("account_country_label")}
                        </p>
                      </div>
                      {(() => {
                        const currentCode = user?.countryCode ?? null;
                        const currentName = userCountryLabel(currentCode);
                        if (!currentCode || !currentName) {
                          return (
                            <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                              {t("account_country_unset")}
                            </span>
                          );
                        }
                        return (
                          <span className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-background border border-border/70 px-2.5 py-1 text-[11px] font-medium shadow-sm">
                            {currentCode === "AL" ? (
                              <>
                                <FlagImg code="al" size={14} />
                                <span className="text-[11px] leading-none select-none" aria-hidden>🤝</span>
                                <FlagImg code="xk" size={14} />
                              </>
                            ) : (
                              <FlagImg code={currentCode.toLowerCase()} size={14} />
                            )}
                            <span className="max-w-[9rem] truncate">{currentName}</span>
                          </span>
                        );
                      })()}
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="account-country" className="text-xs text-muted-foreground">
                        {t("account_country_choose")}
                      </Label>
                      <UserCountrySelect
                        id="account-country"
                        value={accountCountry}
                        onValueChange={(v) => {
                          setAccountCountry(v);
                          setCountryMsg(null);
                        }}
                        preferredCode={user?.countryCode}
                        placeholder={t("auth_country_placeholder")}
                        searchPlaceholder={t("auth_country_search")}
                        emptySearchLabel={t("auth_country_search_empty")}
                        emptyLabel={user?.countryCode ? t("account_country_unset") : undefined}
                        disabled={savingCountry || countryChangesRemaining === 0}
                        triggerClassName="h-11 bg-background"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-end pt-0.5">
                      <Button
                        type="button"
                        size="sm"
                        className="shrink-0 gap-1.5"
                        onClick={() => void saveAccountCountry()}
                        disabled={
                          savingCountry
                          || !accountCountry
                          || accountCountry === (user?.countryCode ?? "")
                          || countryChangesRemaining === 0
                        }
                      >
                        {savingCountry ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : null}
                        {t("account_country_save")}
                      </Button>
                    </div>

                    {countryMsg && (
                      <p
                        className={cn(
                          "text-xs font-medium rounded-lg px-3 py-2",
                          countryMsg.ok
                            ? "bg-primary/10 text-primary"
                            : "bg-destructive/10 text-destructive",
                        )}
                      >
                        {countryMsg.text}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="px-6 py-4 border-t flex flex-col sm:flex-row gap-3">
                  <Button
                    variant="ghost"
                    className="gap-2 text-muted-foreground"
                    onClick={() => setActiveView("reports")}
                  >
                    <FileText className="h-4 w-4" />
                    {t("my_reports")}
                  </Button>
                  <Button
                    variant="ghost"
                    className="gap-2 text-muted-foreground"
                    onClick={() => setActiveView("help")}
                  >
                    <span className="h-4 w-4 flex items-center justify-center text-base">?</span>
                    {t("contact_support")}
                  </Button>
                </div>
              </div>
            </motion.div>
          ) : activeView === "help" ? (
            /* ── HELP VIEW ── */
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={1}
              className="space-y-6"
            >
              <Accordion type="single" collapsible className="space-y-2">
                {([1, 2, 3, 4, 5, 6] as const).map((n) => (
                  <AccordionItem key={n} value={`faq-${n}`} className="border rounded-xl px-4 bg-background shadow-sm">
                    <AccordionTrigger className="text-sm font-semibold hover:no-underline text-left py-4">
                      {t(`help_faq_${n}_q`)}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground pb-4 leading-relaxed">
                      {t(`help_faq_${n}_a`)}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>

              <div className="rounded-2xl border bg-primary/5 p-5 flex items-start gap-4">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <MessageCircle className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{t("help_contact_title")}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{t("help_contact_desc")}</p>
                  <ObfuscatedEmailLink className="text-xs font-medium mt-2 inline-block" />
                </div>
              </div>
            </motion.div>
          ) : (
            /* ── REPORTS VIEW ── */
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={1}
              className="space-y-6"
            >
              <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
                <DashboardStatCard
                  label={t("dashboard_stat_month_reports")}
                  hint={t("dashboard_stat_month_reports_hint")}
                  value={String(checksThisMonth)}
                  loading={statsLoading && historyLoading}
                  icon={CalendarDays}
                  variant="muted"
                  delay={0}
                />
                <DashboardStatCard
                  label={t("dashboard_stat_total_reports")}
                  hint={t("dashboard_stat_total_reports_hint")}
                  value={String(totalChecks)}
                  loading={statsLoading && historyLoading}
                  icon={FileText}
                  variant="primary"
                  delay={0.06}
                />
              </div>

              {/* History */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">{t("my_reports")}</h2>

                <ClientQueryFallback
                  isLoading={historyLoading}
                  isError={historyError}
                  isFetching={historyFetching}
                  hasData={hasHistoryData}
                  error={historyErr}
                  refetch={refetchHistory}
                  skeleton={(
                    <div className="space-y-3.5">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-[4.5rem] sm:h-20 w-full rounded-2xl" />
                      ))}
                    </div>
                  )}
                >
                {lookups.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="rounded-2xl border-2 border-dashed border-border bg-muted/20 py-14 px-6 text-center space-y-6"
                  >
                    <div className="max-w-sm mx-auto space-y-4">
                      <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                        <Search className="h-8 w-8 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{t("no_reports")}</h3>
                        <p className="text-muted-foreground text-sm mt-1">{t("no_reports_desc")}</p>
                      </div>
                      <Button asChild className="gap-2">
                        <Link href={`/${language}`}>
                          <Search className="h-4 w-4" />
                          {t("run_first_check")}
                        </Link>
                      </Button>
                    </div>

                    {/* Sample report preview */}
                    <div className="max-w-xs mx-auto text-left">
                      <p className="text-xs text-muted-foreground text-center mb-3">{t("sample_report_preview_label")}</p>
                      <div className="rounded-xl border bg-background shadow-sm overflow-hidden opacity-60">
                        <div className="bg-primary/80 px-4 py-2.5">
                          <p className="text-primary-foreground text-xs font-mono opacity-70">VIN: 1HGBH41JXMN109186</p>
                          <p className="text-primary-foreground font-bold text-sm">Honda Civic 2021</p>
                        </div>
                        <div className="p-3 space-y-2">
                          {[
                            { dot: "bg-green-500", label: t("dashboard_mileage_label"), val: t("dashboard_mileage_val") },
                            { dot: "bg-green-500", label: t("dashboard_salvage_label"), val: t("dashboard_salvage_val") },
                            { dot: "bg-green-500", label: t("dashboard_stolen_label"),  val: t("dashboard_stolen_val") },
                          ].map(({ dot, label, val }) => (
                            <div key={label} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className={`h-2 w-2 rounded-full ${dot}`} />
                                <span className="text-xs text-muted-foreground">{label}</span>
                              </div>
                              <span className="text-xs font-medium">{val}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <DashboardReportList
                    lookups={lookups}
                    language={language}
                    deleteLookup={deleteLookup}
                  />
                )}
                </ClientQueryFallback>
              </div>
            </motion.div>
          )}
        </div>
    </ClientAreaLayout>
    </>
  );
}
