import { Switch, Route, Redirect, Router as WouterRouter, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { I18nProvider } from "@/i18n/context";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { Layout } from "@/components/layout";
import { useEffect, Suspense, type ComponentType, type ReactNode } from "react";
import { lazyWithRetry } from "@/lib/lazy-with-retry";
import { RouteSEO } from "@/components/seo";
import NotFound from "@/pages/not-found";
import { isVin17 } from "@/lib/vin-route";
import { WarmCache } from "@/components/warm-cache";
import { RouteErrorBoundary } from "@/components/error-boundary";
import { MaintenanceGuard } from "@/components/maintenance-guard";
import { GeoLanguageRedirect } from "@/components/geo-language-redirect";
import { VinAccessGate } from "@/components/vin-access-gate";
import { ensureDict } from "@/i18n/context";
import {
  pathNeedingLangPrefix,
  buildLocalizedPath,
  markGeoLanguageEvaluated,
} from "@/lib/lang-preference";
import { resolveRootEntryLanguage } from "@/lib/geo-language-client";

import Home from "@/pages/home";
// Lazy-loaded
const Pricing       = lazyWithRetry(() => import("@/pages/pricing"));
const Dashboard     = lazyWithRetry(() => import("@/pages/dashboard"));
const VinResult     = lazyWithRetry(() => import("@/pages/vin-result"));
const VinPublic     = lazyWithRetry(() => import("@/pages/vin-public"));
const VinProcessing = lazyWithRetry(() => import("@/pages/vin-processing"));
const CountryPage   = lazyWithRetry(() => import("@/pages/country"));
const Terms         = lazyWithRetry(() => import("@/pages/terms"));
const Privacy       = lazyWithRetry(() => import("@/pages/privacy"));
const AdminLayout   = lazyWithRetry(() => import("@/pages/admin/layout").then(m => ({ default: m.AdminLayout })));
const AdminOverview  = lazyWithRetry(() => import("@/pages/admin/index"));
const AdminUsers     = lazyWithRetry(() => import("@/pages/admin/users"));
const AdminUserDetail = lazyWithRetry(() => import("@/pages/admin/user-detail"));
const AdminLookups   = lazyWithRetry(() => import("@/pages/admin/lookups"));
const AdminProviders = lazyWithRetry(() => import("@/pages/admin/providers"));
const AdminPricing   = lazyWithRetry(() => import("@/pages/admin/pricing"));
const AdminSettings  = lazyWithRetry(() => import("@/pages/admin/settings"));
const AdminLogs      = lazyWithRetry(() => import("@/pages/admin/logs"));
const AdminCoupons   = lazyWithRetry(() => import("@/pages/admin/coupons"));
const AdminEmails    = lazyWithRetry(() => import("@/pages/admin/emails"));
const AdminVinCatalog    = lazyWithRetry(() => import("@/pages/admin/vin-catalog"));
const AdminVinDetail     = lazyWithRetry(() => import("@/pages/admin/vin-detail"));
const AdminPendingVinChecks = lazyWithRetry(() => import("@/pages/admin/pending-vin-checks"));
const AdminPendingVinDetail = lazyWithRetry(() => import("@/pages/admin/pending-vin-detail"));
const AdminSecurity      = lazyWithRetry(() => import("@/pages/admin/security"));
const AdminTransactions     = lazyWithRetry(() => import("@/pages/admin/transactions"));
const AdminAnnouncements    = lazyWithRetry(() => import("@/pages/admin/announcements"));
const AdminAnalytics        = lazyWithRetry(() => import("@/pages/admin/analytics"));
const AdminPlugins          = lazyWithRetry(() => import("@/pages/admin/plugins"));
const Checkout         = lazyWithRetry(() => import("@/pages/checkout"));
const ForgotPassword  = lazyWithRetry(() => import("@/pages/forgot-password"));
const ResetPassword   = lazyWithRetry(() => import("@/pages/reset-password"));
const SetPassword     = lazyWithRetry(() => import("@/pages/set-password"));
const FreeVinDecoder  = lazyWithRetry(() => import("@/pages/free-vin-decoder"));
const Purchases       = lazyWithRetry(() => import("@/pages/purchases"));
const HowItWorks      = lazyWithRetry(() => import("@/pages/how-it-works"));
const FAQ             = lazyWithRetry(() => import("@/pages/faq"));
const Maintenance     = lazyWithRetry(() => import("@/pages/maintenance"));
const AuthForm        = lazyWithRetry(() => import("@/pages/auth").then((m) => ({ default: m.AuthForm })));

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [location]);
  return null;
}

function PageLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}

function withLang(
  Component: React.ComponentType<{ params: { lang: string; [key: string]: string } }>,
  errorScope?: string,
) {
  return function LangWrapper(props: { params: { lang: string; [key: string]: string } }) {
    const [location] = useLocation();
    const resetKey = location.split("?")[0] ?? location;
    const validLangs = ["en", "es", "uk", "ru", "ar", "sq"];
    if (!validLangs.includes(props.params.lang)) {
      return <Redirect to="/en" />;
    }
    const page = (
      <Suspense fallback={<PageLoader />}>
        <Component {...props} />
      </Suspense>
    );
    return (
      <I18nProvider initialLanguage={props.params.lang as "en" | "es" | "uk" | "ru" | "ar" | "sq"}>
        <RouteSEO />
        <Layout>
          {errorScope ? <RouteErrorBoundary scope={errorScope} resetKey={resetKey}>{page}</RouteErrorBoundary> : page}
        </Layout>
      </I18nProvider>
    );
  };
}

function AuthPage({ params, mode }: { params: { lang: string }; mode: "sign-in" | "sign-up" }) {
  const [location] = useLocation();
  const resetKey = location.split("?")[0] ?? location;
  const validLangs = ["en", "es", "uk", "ru", "ar", "sq"];
  const lang = validLangs.includes(params.lang) ? params.lang : "en";

  return (
    <I18nProvider initialLanguage={lang as "en" | "es" | "uk" | "ru" | "ar" | "sq"}>
      <RouteSEO />
      <Layout>
        <RouteErrorBoundary scope="auth" resetKey={resetKey}>
          <Suspense fallback={<PageLoader />}>
            <AuthForm lang={lang} mode={mode} />
          </Suspense>
        </RouteErrorBoundary>
      </Layout>
    </I18nProvider>
  );
}

function AuthSubPage({ lang, children }: { lang: "en" | "es" | "uk" | "ru" | "ar" | "sq"; children: React.ReactNode }) {
  const [location] = useLocation();
  const resetKey = location.split("?")[0] ?? location;
  return (
    <I18nProvider initialLanguage={lang}>
      <RouteSEO />
      <Layout>
        <RouteErrorBoundary scope="auth" resetKey={resetKey}>
          <Suspense fallback={<PageLoader />}>{children}</Suspense>
        </RouteErrorBoundary>
      </Layout>
    </I18nProvider>
  );
}

const HomeLang         = withLang(Home, "home");
const PricingLang      = withLang(Pricing as React.ComponentType<{ params: { lang: string; [key: string]: string } }>, "pricing");
const CheckoutLang     = withLang(Checkout as React.ComponentType<{ params: { lang: string; [key: string]: string } }>, "checkout");
const DashboardLang    = withLang(Dashboard as React.ComponentType<{ params: { lang: string; [key: string]: string } }>, "dashboard");
const VinProcessingLang = withLang(VinProcessing as React.ComponentType<{ params: { lang: string; [key: string]: string } }>, "vin-processing");
const TermsLang           = withLang(Terms as React.ComponentType<{ params: { lang: string; [key: string]: string } }>);
const PrivacyLang         = withLang(Privacy as React.ComponentType<{ params: { lang: string; [key: string]: string } }>);
const FreeVinDecoderLang  = withLang(FreeVinDecoder as React.ComponentType<{ params: { lang: string; [key: string]: string } }>, "free-decoder");
const PurchasesLang       = withLang(Purchases as React.ComponentType<{ params: { lang: string; [key: string]: string } }>, "purchases");
const HowItWorksLang      = withLang(HowItWorks as React.ComponentType<{ params: { lang: string; [key: string]: string } }>);
const FAQLang             = withLang(FAQ as React.ComponentType<{ params: { lang: string; [key: string]: string } }>);
const MaintenanceLang     = withLang(Maintenance as React.ComponentType<{ params: { lang: string; [key: string]: string } }>);

function CountryLang(props: { params: { lang: string; country: string } }) {
  const [location] = useLocation();
  const resetKey = location.split("?")[0] ?? location;
  const validLangs = ["en", "es", "uk", "ru", "ar", "sq"];
  if (!validLangs.includes(props.params.lang)) return <Redirect to="/en" />;
  return (
    <I18nProvider initialLanguage={props.params.lang as "en" | "es" | "uk" | "ru" | "ar" | "sq"}>
      <RouteSEO />
      <Layout>
        <RouteErrorBoundary scope="country" resetKey={resetKey}>
          <Suspense fallback={<PageLoader />}>
            <CountryPage params={props.params} />
          </Suspense>
        </RouteErrorBoundary>
      </Layout>
    </I18nProvider>
  );
}

function VinNumericRedirect({ lang, id }: { lang: string; id: string }) {
  const { isSignedIn, isLoaded } = useAuth();
  const [, setLocation] = useLocation();
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      setLocation(`/${lang}/sign-in`, { replace: true });
      return;
    }

    const qs = window.location.search;
    fetch(`${basePath}/api/vin/resolve/${id}`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(({ vin }: { vin: string }) => {
        setLocation(`/${lang}/vin/${vin}${qs}`, { replace: true });
      })
      .catch(() => {
        setLocation(`/${lang}/dashboard`, { replace: true });
      });
  }, [lang, id, isLoaded, isSignedIn, setLocation, basePath]);

  return <PageLoader />;
}

function stripLegacyShareParam(): void {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (!url.searchParams.has("s")) return;
  url.searchParams.delete("s");
  window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
}

function VinRouteByAuth(props: { params: { lang: string; id: string } }) {
  const { isSignedIn, isLoaded } = useAuth();
  const vin = props.params.id.toUpperCase();

  useEffect(() => {
    stripLegacyShareParam();
  }, [vin]);

  if (!isLoaded) return <PageLoader />;

  // Guests: public locked preview. Signed-in: ownership gate (purchase required per account).
  if (!isSignedIn) {
    return (
      <Suspense fallback={<PageLoader />}>
        <VinPublic params={{ lang: props.params.lang, id: vin }} />
      </Suspense>
    );
  }

  // Signed-in: full report only when API confirms ownership (purchase, pending, or admin).
  return <VinAccessGate params={props.params} vin={vin} />;
}

function VinResultLang(props: { params: { lang: string; id: string } }) {
  const [location] = useLocation();
  const resetKey = location.split("?")[0] ?? location;
  const validLangs = ["en", "es", "uk", "ru", "ar", "sq"];
  if (!validLangs.includes(props.params.lang)) return <Redirect to="/en" />;
  const isVin = isVin17(props.params.id);
  return (
    <I18nProvider initialLanguage={props.params.lang as "en" | "es" | "uk" | "ru" | "ar" | "sq"}>
      <RouteSEO />
      <Layout>
        <RouteErrorBoundary scope="vin" resetKey={resetKey}>
          <Suspense fallback={<PageLoader />}>
            {isVin
              ? <VinRouteByAuth params={props.params} />
              : <VinNumericRedirect lang={props.params.lang} id={props.params.id} />
            }
          </Suspense>
        </RouteErrorBoundary>
      </Layout>
    </I18nProvider>
  );
}

function AdminPage({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const resetKey = location.split("?")[0] ?? location;
  return (
    <RouteErrorBoundary scope="admin" resetKey={resetKey}>
      <Suspense fallback={<PageLoader />}>
        <AdminLayout>{children}</AdminLayout>
      </Suspense>
    </RouteErrorBoundary>
  );
}

function NotFoundLang() {
  const [location] = useLocation();
  const validLangs = ["en", "es", "uk", "ru", "ar", "sq"] as const;
  const match = location.match(/^\/(en|es|uk|ru|ar|sq)(?:\/|$)/);
  const lang = validLangs.includes((match?.[1] ?? "en") as typeof validLangs[number])
    ? (match?.[1] ?? "en") as typeof validLangs[number]
    : "en";

  return (
    <I18nProvider initialLanguage={lang}>
      <RouteSEO />
      <Layout>
        <NotFound />
      </Layout>
    </I18nProvider>
  );
}

function RootLangRedirect() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    let cancelled = false;
    const search = typeof window !== "undefined" ? window.location.search : "";
    const hash = typeof window !== "undefined" ? window.location.hash : "";

    void resolveRootEntryLanguage().then(async (lang) => {
      if (cancelled) return;
      markGeoLanguageEvaluated();
      await ensureDict(lang);
      setLocation(`/${lang}${search}${hash}`, { replace: true });
    });

    return () => {
      cancelled = true;
    };
  }, [setLocation]);

  return <PageLoader />;
}

function UnprefixedPathLangRedirect({ pathname }: { pathname: string }) {
  const [, setLocation] = useLocation();

  useEffect(() => {
    const rest = pathNeedingLangPrefix(pathname);
    if (rest === null) return;

    let cancelled = false;
    const search = typeof window !== "undefined" ? window.location.search : "";
    const hash = typeof window !== "undefined" ? window.location.hash : "";

    void resolveRootEntryLanguage().then(async (lang) => {
      if (cancelled) return;
      markGeoLanguageEvaluated();
      await ensureDict(lang);
      setLocation(`${buildLocalizedPath(lang, rest)}${search}${hash}`, { replace: true });
    });

    return () => {
      cancelled = true;
    };
  }, [pathname, setLocation]);

  return <PageLoader />;
}

type RouteLang = "en" | "es" | "uk" | "ru" | "ar" | "sq";

function parseRouteLang(lang: string): RouteLang {
  const validLangs: RouteLang[] = ["en", "es", "uk", "ru", "ar", "sq"];
  return validLangs.includes(lang as RouteLang) ? lang as RouteLang : "en";
}

function createLegacyCountryRedirect(to: string) {
  function LegacyCountryRedirect() {
    return <Redirect to={to} />;
  }
  return LegacyCountryRedirect;
}

const RedirectUsaCars = createLegacyCountryRedirect("/en/cars/usa");
const RedirectKoreaCars = createLegacyCountryRedirect("/en/cars/korea");
const RedirectCanadaCars = createLegacyCountryRedirect("/en/cars/canada");

function SignInRoute(props: { params: { lang: string } }) {
  return <AuthPage params={props.params} mode="sign-in" />;
}

function SignUpRoute(props: { params: { lang: string } }) {
  return <AuthPage params={props.params} mode="sign-up" />;
}

function ForgotPasswordRoute(props: { params: { lang: string } }) {
  return (
    <AuthSubPage lang={parseRouteLang(props.params.lang)}>
      <ForgotPassword />
    </AuthSubPage>
  );
}

function ResetPasswordRoute(props: { params: { lang: string } }) {
  return (
    <AuthSubPage lang={parseRouteLang(props.params.lang)}>
      <ResetPassword />
    </AuthSubPage>
  );
}

function SetPasswordRoute(props: { params: { lang: string } }) {
  return (
    <AuthSubPage lang={parseRouteLang(props.params.lang)}>
      <SetPassword />
    </AuthSubPage>
  );
}

function createAdminRoute(Page: ComponentType) {
  function AdminRoute() {
    return (
      <AdminPage>
        <Suspense fallback={<PageLoader />}>
          <Page />
        </Suspense>
      </AdminPage>
    );
  }
  return AdminRoute;
}

const AdminOverviewRoute = createAdminRoute(AdminOverview);
const AdminAnalyticsRoute = createAdminRoute(AdminAnalytics);
const AdminUsersRoute = createAdminRoute(AdminUsers);
const AdminLookupsRoute = createAdminRoute(AdminLookups);
const AdminProvidersRoute = createAdminRoute(AdminProviders);
const AdminPricingRoute = createAdminRoute(AdminPricing);
const AdminSettingsRoute = createAdminRoute(AdminSettings);
const AdminPluginsRoute = createAdminRoute(AdminPlugins);
const AdminLogsRoute = createAdminRoute(AdminLogs);
const AdminCouponsRoute = createAdminRoute(AdminCoupons);
const AdminEmailsRoute = createAdminRoute(AdminEmails);
const AdminSecurityRoute = createAdminRoute(AdminSecurity);
const AdminVinCatalogRoute = createAdminRoute(AdminVinCatalog);
const AdminPendingVinChecksRoute = createAdminRoute(AdminPendingVinChecks);
const AdminTransactionsRoute = createAdminRoute(AdminTransactions);
const AdminAnnouncementsRoute = createAdminRoute(AdminAnnouncements);

function AdminUserDetailRoute(props: { params: { userId: string } }) {
  return (
    <AdminPage>
      <Suspense fallback={<PageLoader />}>
        <AdminUserDetail params={props.params} />
      </Suspense>
    </AdminPage>
  );
}

function AdminPendingVinDetailRoute(props: { params: { id: string } }) {
  return (
    <AdminPage>
      <Suspense fallback={<PageLoader />}>
        <AdminPendingVinDetail params={props.params} />
      </Suspense>
    </AdminPage>
  );
}

function AdminVinDetailRoute(props: { params: { vin: string } }) {
  return (
    <AdminPage>
      <Suspense fallback={<PageLoader />}>
        <AdminVinDetail params={props.params} />
      </Suspense>
    </AdminPage>
  );
}

function AppRouter() {
  const [location] = useLocation();
  const pathname = location.split("?")[0] ?? location;
  const unprefixedRest = pathNeedingLangPrefix(pathname);

  if (unprefixedRest !== null) {
    return <UnprefixedPathLangRedirect pathname={pathname} />;
  }

  return (
    <>
      <ScrollToTop />
      <GeoLanguageRedirect />
      <MaintenanceGuard>
      <Switch>
        <Route path="/" component={RootLangRedirect} />

        <Route path="/usa-cars" component={RedirectUsaCars} />
        <Route path="/usa-cars/" component={RedirectUsaCars} />
        <Route path="/korea-cars" component={RedirectKoreaCars} />
        <Route path="/korea-cars/" component={RedirectKoreaCars} />
        <Route path="/canada-cars" component={RedirectCanadaCars} />
        <Route path="/canada-cars/" component={RedirectCanadaCars} />

        {/* Auth routes */}
        <Route path="/:lang/sign-in/*?" component={SignInRoute} />
        <Route path="/:lang/sign-up/*?" component={SignUpRoute} />
        <Route path="/:lang/forgot-password" component={ForgotPasswordRoute} />
        <Route path="/:lang/reset-password" component={ResetPasswordRoute} />
        <Route path="/:lang/set-password" component={SetPasswordRoute} />

        {/* Admin routes — must come before /:lang/* patterns to avoid /adminx being matched as a lang segment */}
        <Route path="/adminx" component={AdminOverviewRoute} />
        <Route path="/adminx/analytics" component={AdminAnalyticsRoute} />
        <Route path="/adminx/users/:userId" component={AdminUserDetailRoute} />
        <Route path="/adminx/users" component={AdminUsersRoute} />
        <Route path="/adminx/lookups" component={AdminLookupsRoute} />
        <Route path="/adminx/providers" component={AdminProvidersRoute} />
        <Route path="/adminx/pricing" component={AdminPricingRoute} />
        <Route path="/adminx/settings" component={AdminSettingsRoute} />
        <Route path="/adminx/plugins" component={AdminPluginsRoute} />
        <Route path="/adminx/logs" component={AdminLogsRoute} />
        <Route path="/adminx/coupons" component={AdminCouponsRoute} />
        <Route path="/adminx/emails" component={AdminEmailsRoute} />
        <Route path="/adminx/security" component={AdminSecurityRoute} />
        <Route path="/adminx/vin-catalog" component={AdminVinCatalogRoute} />
        <Route path="/adminx/pending-vin-checks/:id" component={AdminPendingVinDetailRoute} />
        <Route path="/adminx/pending-vin-checks" component={AdminPendingVinChecksRoute} />
        <Route path="/adminx/vin/:vin" component={AdminVinDetailRoute} />
        <Route path="/adminx/transactions" component={AdminTransactionsRoute} />
        <Route path="/adminx/announcements" component={AdminAnnouncementsRoute} />

        {/* VIN routes */}
        <Route path="/:lang/vin/processing" component={VinProcessingLang} />
        <Route path="/:lang/vin/:id" component={VinResultLang} />

        {/* Country SEO pages */}
        <Route path="/:lang/cars/:country" component={CountryLang} />

        {/* Legal */}
        <Route path="/:lang/terms" component={TermsLang} />
        <Route path="/:lang/privacy" component={PrivacyLang} />

        {/* Main pages */}
        <Route path="/:lang/pricing" component={PricingLang} />
        <Route path="/:lang/checkout" component={CheckoutLang} />
        <Route path="/:lang/dashboard/account" component={DashboardLang} />
        <Route path="/:lang/dashboard/help" component={DashboardLang} />
        <Route path="/:lang/dashboard" component={DashboardLang} />
        <Route path="/:lang/purchases" component={PurchasesLang} />
        <Route path="/:lang/free-vin-decoder" component={FreeVinDecoderLang} />
        <Route path="/:lang/how-it-works" component={HowItWorksLang} />
        <Route path="/:lang/faq" component={FAQLang} />
        <Route path="/:lang/maintenance" component={MaintenanceLang} />
        <Route path="/:lang" component={HomeLang} />

        <Route component={NotFoundLang} />
      </Switch>
      </MaintenanceGuard>
    </>
  );
}

function AppShell() {
  const [location] = useLocation();
  const resetKey = location.split("?")[0] ?? location;

  useEffect(() => {
    sessionStorage.removeItem("kmcheck-chunk-reload");
  }, []);

  return (
    <RouteErrorBoundary scope="app" resetKey={resetKey}>
      <AuthProvider>
        <WarmCache />
        <TooltipProvider>
          <AppRouter />
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </RouteErrorBoundary>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="kmcheck-theme">
      <QueryClientProvider client={queryClient}>
        <WouterRouter base={basePath}>
          <AppShell />
        </WouterRouter>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
