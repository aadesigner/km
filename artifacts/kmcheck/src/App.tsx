import { Switch, Route, Redirect, Router as WouterRouter, useLocation, Link } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { I18nProvider } from "@/i18n/context";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { Layout } from "@/components/layout";
import { useEffect, Suspense, type ReactNode } from "react";
import { lazyWithRetry } from "@/lib/lazy-with-retry";
import { RouteSEO } from "@/components/seo";
import NotFound from "@/pages/not-found";
import { isVin17 } from "@/lib/vin-route";
import { WarmCache } from "@/components/warm-cache";
import { SiteAnalytics } from "@/components/site-analytics";
import { PresenceHeartbeat } from "@/components/presence-heartbeat";
import { RouteErrorBoundary } from "@/components/error-boundary";
import { MaintenanceGuard } from "@/components/maintenance-guard";
import { GeoLanguageRedirect } from "@/components/geo-language-redirect";
import { VinAccessGate } from "@/components/vin-access-gate";
import { ensureDict } from "@/i18n/context";
import {
  pathNeedingLangPrefix,
  buildLocalizedPath,
  markGeoLanguageEvaluated,
  getStoredLangPreference,
} from "@/lib/lang-preference";
import { resolveRootEntryLanguage } from "@/lib/geo-language-client";
import { SUPPORTED_LANGS, isSupportedLang, type Language, LANG_PATH_ALT } from "@/lib/languages";
import { normalizeAppPath, splitRouterLocation } from "@/lib/normalize-app-path";
import { isAdminAppPath, matchAdminRoute } from "@/lib/admin-routes";

import Home from "@/pages/home";
import { AdminLayout } from "@/pages/admin/layout";
import AdminNotFound from "@/pages/admin/not-found";
import AdminOverview from "@/pages/admin/index";
// Lazy-loaded
const Pricing       = lazyWithRetry(() => import("@/pages/pricing"));
const Dashboard     = lazyWithRetry(() => import("@/pages/dashboard"));
const VinResult     = lazyWithRetry(() => import("@/pages/vin-result"));
const VinPublic     = lazyWithRetry(() => import("@/pages/vin-public"));
const VinProcessing = lazyWithRetry(() => import("@/pages/vin-processing"));
const CountryPage   = lazyWithRetry(() => import("@/pages/country"));
const Terms         = lazyWithRetry(() => import("@/pages/terms"));
const Privacy       = lazyWithRetry(() => import("@/pages/privacy"));
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
import { AuthForm } from "@/pages/auth";

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
    const validLangs = SUPPORTED_LANGS as readonly string[];
    if (!validLangs.includes(props.params.lang)) {
      return <Redirect to="/en" />;
    }
    const page = (
      <Suspense fallback={<PageLoader />}>
        <Component {...props} />
      </Suspense>
    );
    return (
      <I18nProvider initialLanguage={props.params.lang as Language}>
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
  const validLangs = SUPPORTED_LANGS as readonly string[];
  const lang = validLangs.includes(params.lang) ? params.lang : "en";

  return (
    <I18nProvider initialLanguage={lang as Language}>
      <RouteSEO />
      <Layout>
        <RouteErrorBoundary scope="auth" resetKey={resetKey}>
          <AuthForm lang={lang} mode={mode} />
        </RouteErrorBoundary>
      </Layout>
    </I18nProvider>
  );
}

function AuthSubPage({ lang, children }: { lang: Language; children: React.ReactNode }) {
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
  const validLangs = SUPPORTED_LANGS as readonly string[];
  if (!validLangs.includes(props.params.lang)) return <Redirect to="/en" />;
  return (
    <I18nProvider initialLanguage={props.params.lang as Language}>
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

/** Signed-in report route by numeric lookup ID (checkout redirects here while status is fulfilling). */
function VinLookupRoute(props: { params: { lang: string; id: string } }) {
  const { isSignedIn, isLoaded } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      setLocation(`/${props.params.lang}/sign-in`, { replace: true });
    }
  }, [isLoaded, isSignedIn, setLocation, props.params.lang]);

  if (!isLoaded) return <PageLoader />;
  if (!isSignedIn) return <PageLoader />;

  return (
    <Suspense fallback={<PageLoader />}>
      <VinResult params={props.params} />
    </Suspense>
  );
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
  const validLangs = SUPPORTED_LANGS as readonly string[];
  if (!validLangs.includes(props.params.lang)) return <Redirect to="/en" />;
  const isVin = isVin17(props.params.id);
  return (
    <I18nProvider initialLanguage={props.params.lang as Language}>
      <RouteSEO />
      <Layout>
        <RouteErrorBoundary scope="vin" resetKey={resetKey}>
          <Suspense fallback={<PageLoader />}>
            {isVin
              ? <VinRouteByAuth params={props.params} />
              : <VinLookupRoute params={props.params} />
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
  const adminLang = getStoredLangPreference() ?? "en";
  return (
    <I18nProvider initialLanguage={adminLang}>
      <RouteErrorBoundary scope="admin" resetKey={resetKey}>
        <AdminLayout>{children}</AdminLayout>
      </RouteErrorBoundary>
    </I18nProvider>
  );
}


function NotFoundLang() {
  const [location] = useLocation();
  const { pathname } = splitRouterLocation(location);
  const validLangs = SUPPORTED_LANGS;
  const match = location.match(new RegExp(`^/(${LANG_PATH_ALT})(?:/|$)`));
  const lang = validLangs.includes((match?.[1] ?? "en") as typeof validLangs[number])
    ? (match?.[1] ?? "en") as typeof validLangs[number]
    : "en";

  // Safety net: unprefixed paths (e.g. /pricing) should redirect, not 404.
  const unprefixedRest = pathNeedingLangPrefix(pathname);
  if (unprefixedRest !== null) {
    return <UnprefixedPathLangRedirect pathname={pathname} />;
  }

  // Safety net: admin paths are handled by AdminSwitch — never public 404.
  if (isAdminAppPath(pathname)) {
    return <AdminSwitch />;
  }

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
      try {
        await ensureDict(lang);
      } catch {
        // Navigate anyway — English fallback strings apply if locale bundle failed.
      }
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
      try {
        await ensureDict(lang);
      } catch {
        // Navigate anyway — English fallback strings apply if locale bundle failed.
      }
      setLocation(`${buildLocalizedPath(lang, rest)}${search}${hash}`, { replace: true });
    });

    return () => {
      cancelled = true;
    };
  }, [pathname, setLocation]);

  return <PageLoader />;
}

function parseRouteLang(lang: string): Language {
  return isSupportedLang(lang) ? lang : "en";
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

function AdminRouteShell({ children, lazy = false }: { children: ReactNode; lazy?: boolean }) {
  return (
    <AdminPage>
      {lazy ? (
        <Suspense fallback={<PageLoader />}>
          {children}
        </Suspense>
      ) : children}
    </AdminPage>
  );
}

function AdminRouteOutlet() {
  const [location] = useLocation();
  const { pathname } = splitRouterLocation(location);
  const match = matchAdminRoute(pathname);

  switch (match.id) {
    case "overview":
      return (
        <AdminRouteShell>
          <AdminOverview />
        </AdminRouteShell>
      );
    case "not-found":
      return (
        <AdminRouteShell>
          <AdminNotFound />
        </AdminRouteShell>
      );
    case "analytics":
      return (
        <AdminRouteShell lazy>
          <AdminAnalytics />
        </AdminRouteShell>
      );
    case "users":
      return (
        <AdminRouteShell lazy>
          <AdminUsers />
        </AdminRouteShell>
      );
    case "user-detail":
      return (
        <AdminRouteShell lazy>
          <AdminUserDetail params={{ userId: match.userId }} />
        </AdminRouteShell>
      );
    case "lookups":
      return (
        <AdminRouteShell lazy>
          <AdminLookups />
        </AdminRouteShell>
      );
    case "providers":
      return (
        <AdminRouteShell lazy>
          <AdminProviders />
        </AdminRouteShell>
      );
    case "pricing":
      return (
        <AdminRouteShell lazy>
          <AdminPricing />
        </AdminRouteShell>
      );
    case "settings":
      return (
        <AdminRouteShell lazy>
          <AdminSettings />
        </AdminRouteShell>
      );
    case "plugins":
      return (
        <AdminRouteShell lazy>
          <AdminPlugins />
        </AdminRouteShell>
      );
    case "logs":
      return (
        <AdminRouteShell lazy>
          <AdminLogs />
        </AdminRouteShell>
      );
    case "coupons":
      return (
        <AdminRouteShell lazy>
          <AdminCoupons />
        </AdminRouteShell>
      );
    case "emails":
      return (
        <AdminRouteShell lazy>
          <AdminEmails />
        </AdminRouteShell>
      );
    case "security":
      return (
        <AdminRouteShell lazy>
          <AdminSecurity />
        </AdminRouteShell>
      );
    case "vin-catalog":
      return (
        <AdminRouteShell lazy>
          <AdminVinCatalog />
        </AdminRouteShell>
      );
    case "pending-vin-checks":
      return (
        <AdminRouteShell lazy>
          <AdminPendingVinChecks />
        </AdminRouteShell>
      );
    case "pending-vin-detail":
      return (
        <AdminRouteShell lazy>
          <AdminPendingVinDetail params={{ id: match.checkId }} />
        </AdminRouteShell>
      );
    case "vin-detail":
      return (
        <AdminRouteShell lazy>
          <AdminVinDetail params={{ vin: match.vin }} />
        </AdminRouteShell>
      );
    case "transactions":
      return (
        <AdminRouteShell lazy>
          <AdminTransactions />
        </AdminRouteShell>
      );
    case "announcements":
      return (
        <AdminRouteShell lazy>
          <AdminAnnouncements />
        </AdminRouteShell>
      );
    default:
      return (
        <AdminRouteShell>
          <AdminOverview />
        </AdminRouteShell>
      );
  }
}

/** Isolated admin router — never competes with /:lang in the public Switch. */
function AdminSwitch() {
  return (
    <>
      <ScrollToTop />
      <MaintenanceGuard>
        <AdminRouteOutlet />
      </MaintenanceGuard>
    </>
  );
}

function AppRouter() {
  const [location] = useLocation();
  const { pathname, suffix } = splitRouterLocation(location);
  const normalized = normalizeAppPath(pathname);

  if (normalized !== pathname) {
    return <Redirect to={`${normalized}${suffix}`} />;
  }

  const unprefixedRest = pathNeedingLangPrefix(pathname);

  if (unprefixedRest !== null) {
    return <UnprefixedPathLangRedirect pathname={pathname} />;
  }

  if (isAdminAppPath(pathname)) {
    return <AdminSwitch />;
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

  return (
    <RouteErrorBoundary scope="app" resetKey={resetKey}>
      <AuthProvider>
        <PresenceHeartbeat />
        <SiteAnalytics />
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
