import { Switch, Route, Redirect, Router as WouterRouter, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { I18nProvider } from "@/i18n/context";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { Layout } from "@/components/layout";
import { useEffect, lazy, Suspense, type ReactNode } from "react";
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

// Lazy-loaded
const Home          = lazy(() => import("@/pages/home"));
const Pricing       = lazy(() => import("@/pages/pricing"));
const Dashboard     = lazy(() => import("@/pages/dashboard"));
const VinResult     = lazy(() => import("@/pages/vin-result"));
const VinPublic     = lazy(() => import("@/pages/vin-public"));
const VinProcessing = lazy(() => import("@/pages/vin-processing"));
const CountryPage   = lazy(() => import("@/pages/country"));
const Terms         = lazy(() => import("@/pages/terms"));
const Privacy       = lazy(() => import("@/pages/privacy"));
const AdminLayout   = lazy(() => import("@/pages/admin/layout").then(m => ({ default: m.AdminLayout })));
const AdminOverview  = lazy(() => import("@/pages/admin/index"));
const AdminUsers     = lazy(() => import("@/pages/admin/users"));
const AdminUserDetail = lazy(() => import("@/pages/admin/user-detail"));
const AdminLookups   = lazy(() => import("@/pages/admin/lookups"));
const AdminProviders = lazy(() => import("@/pages/admin/providers"));
const AdminPricing   = lazy(() => import("@/pages/admin/pricing"));
const AdminSettings  = lazy(() => import("@/pages/admin/settings"));
const AdminLogs      = lazy(() => import("@/pages/admin/logs"));
const AdminCoupons   = lazy(() => import("@/pages/admin/coupons"));
const AdminEmails    = lazy(() => import("@/pages/admin/emails"));
const AdminVinCatalog    = lazy(() => import("@/pages/admin/vin-catalog"));
const AdminVinDetail     = lazy(() => import("@/pages/admin/vin-detail"));
const AdminPendingVinChecks = lazy(() => import("@/pages/admin/pending-vin-checks"));
const AdminPendingVinDetail = lazy(() => import("@/pages/admin/pending-vin-detail"));
const AdminSecurity      = lazy(() => import("@/pages/admin/security"));
const AdminTransactions     = lazy(() => import("@/pages/admin/transactions"));
const AdminAnnouncements    = lazy(() => import("@/pages/admin/announcements"));
const AdminAnalytics        = lazy(() => import("@/pages/admin/analytics"));
const AdminPlugins          = lazy(() => import("@/pages/admin/plugins"));
const Checkout         = lazy(() => import("@/pages/checkout"));
const ForgotPassword  = lazy(() => import("@/pages/forgot-password"));
const ResetPassword   = lazy(() => import("@/pages/reset-password"));
const SetPassword     = lazy(() => import("@/pages/set-password"));
const FreeVinDecoder  = lazy(() => import("@/pages/free-vin-decoder"));
const Purchases       = lazy(() => import("@/pages/purchases"));
const HowItWorks      = lazy(() => import("@/pages/how-it-works"));
const FAQ             = lazy(() => import("@/pages/faq"));
const Maintenance     = lazy(() => import("@/pages/maintenance"));
const AuthForm        = lazy(() => import("@/pages/auth").then((m) => ({ default: m.AuthForm })));

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
    const validLangs = ["en", "ar", "uk", "ru", "sq"];
    if (!validLangs.includes(props.params.lang)) {
      return <Redirect to="/en" />;
    }
    const page = (
      <Suspense fallback={<PageLoader />}>
        <Component {...props} />
      </Suspense>
    );
    return (
      <I18nProvider initialLanguage={props.params.lang as "en" | "ar" | "uk" | "ru" | "sq"}>
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
  const validLangs = ["en", "ar", "uk", "ru", "sq"];
  const lang = validLangs.includes(params.lang) ? params.lang : "en";

  return (
    <I18nProvider initialLanguage={lang as "en" | "ar" | "uk" | "ru" | "sq"}>
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

function AuthSubPage({ lang, children }: { lang: "en" | "ar" | "uk" | "ru" | "sq"; children: React.ReactNode }) {
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
  const validLangs = ["en", "ar", "uk", "ru", "sq"];
  if (!validLangs.includes(props.params.lang)) return <Redirect to="/en" />;
  return (
    <I18nProvider initialLanguage={props.params.lang as "en" | "ar" | "uk" | "ru" | "sq"}>
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

function VinRouteByAuth(props: { params: { lang: string; id: string } }) {
  const { isSignedIn, isLoaded } = useAuth();
  const vin = props.params.id.toUpperCase();
  const shareParam = typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get("s") ?? ""
    : "";

  if (!isLoaded) return <PageLoader />;

  // Guests and explicit share links always use the public locked/unlocked page.
  if (!isSignedIn || shareParam) {
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
  const validLangs = ["en", "ar", "uk", "ru", "sq"];
  if (!validLangs.includes(props.params.lang)) return <Redirect to="/en" />;
  const isVin = isVin17(props.params.id);
  return (
    <I18nProvider initialLanguage={props.params.lang as "en" | "ar" | "uk" | "ru" | "sq"}>
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
  const validLangs = ["en", "ar", "uk", "ru", "sq"] as const;
  const match = location.match(/^\/(en|ar|uk|ru|sq)(?:\/|$)/);
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

        {["usa", "korea", "canada"].map(c => (
          <Route key={c} path={`/${c}-cars`} component={() => <Redirect to={`/en/cars/${c}`} />} />
        ))}
        {["usa", "korea", "canada"].map(c => (
          <Route key={`${c}/`} path={`/${c}-cars/`} component={() => <Redirect to={`/en/cars/${c}`} />} />
        ))}

        {/* Auth routes */}
        <Route path="/:lang/sign-in/*?" component={(p) => <AuthPage params={p.params} mode="sign-in" />} />
        <Route path="/:lang/sign-up/*?" component={(p) => <AuthPage params={p.params} mode="sign-up" />} />
        <Route path="/:lang/forgot-password" component={(p) => {
          const validLangs = ["en", "ar", "uk", "ru", "sq"];
          const lang = validLangs.includes(p.params.lang) ? p.params.lang as "en" | "ar" | "uk" | "ru" | "sq" : "en";
          return (
            <AuthSubPage lang={lang}>
              <ForgotPassword />
            </AuthSubPage>
          );
        }} />
        <Route path="/:lang/reset-password" component={(p) => {
          const validLangs = ["en", "ar", "uk", "ru", "sq"];
          const lang = validLangs.includes(p.params.lang) ? p.params.lang as "en" | "ar" | "uk" | "ru" | "sq" : "en";
          return (
            <AuthSubPage lang={lang}>
              <ResetPassword />
            </AuthSubPage>
          );
        }} />
        <Route path="/:lang/set-password" component={(p) => {
          const validLangs = ["en", "ar", "uk", "ru", "sq"];
          const lang = validLangs.includes(p.params.lang) ? p.params.lang as "en" | "ar" | "uk" | "ru" | "sq" : "en";
          return (
            <AuthSubPage lang={lang}>
              <SetPassword />
            </AuthSubPage>
          );
        }} />

        {/* Admin routes — must come before /:lang/* patterns to avoid /adminx being matched as a lang segment */}
        <Route path="/adminx"             component={() => <AdminPage><Suspense fallback={<PageLoader />}><AdminOverview /></Suspense></AdminPage>} />
        <Route path="/adminx/analytics"   component={() => <AdminPage><Suspense fallback={<PageLoader />}><AdminAnalytics /></Suspense></AdminPage>} />
        <Route path="/adminx/users/:userId" component={(p) => <AdminPage><Suspense fallback={<PageLoader />}><AdminUserDetail params={p.params as { userId: string }} /></Suspense></AdminPage>} />
        <Route path="/adminx/users"       component={() => <AdminPage><Suspense fallback={<PageLoader />}><AdminUsers /></Suspense></AdminPage>} />
        <Route path="/adminx/lookups"     component={() => <AdminPage><Suspense fallback={<PageLoader />}><AdminLookups /></Suspense></AdminPage>} />
        <Route path="/adminx/providers"   component={() => <AdminPage><Suspense fallback={<PageLoader />}><AdminProviders /></Suspense></AdminPage>} />
        <Route path="/adminx/pricing"     component={() => <AdminPage><Suspense fallback={<PageLoader />}><AdminPricing /></Suspense></AdminPage>} />
        <Route path="/adminx/settings"    component={() => <AdminPage><Suspense fallback={<PageLoader />}><AdminSettings /></Suspense></AdminPage>} />
        <Route path="/adminx/plugins"     component={() => <AdminPage><Suspense fallback={<PageLoader />}><AdminPlugins /></Suspense></AdminPage>} />
        <Route path="/adminx/logs"        component={() => <AdminPage><Suspense fallback={<PageLoader />}><AdminLogs /></Suspense></AdminPage>} />
        <Route path="/adminx/coupons"     component={() => <AdminPage><Suspense fallback={<PageLoader />}><AdminCoupons /></Suspense></AdminPage>} />
        <Route path="/adminx/emails"      component={() => <AdminPage><Suspense fallback={<PageLoader />}><AdminEmails /></Suspense></AdminPage>} />
        <Route path="/adminx/security"   component={() => <AdminPage><Suspense fallback={<PageLoader />}><AdminSecurity /></Suspense></AdminPage>} />
        <Route path="/adminx/vin-catalog"   component={() => <AdminPage><Suspense fallback={<PageLoader />}><AdminVinCatalog /></Suspense></AdminPage>} />
        <Route path="/adminx/pending-vin-checks/:id" component={(p) => <AdminPage><Suspense fallback={<PageLoader />}><AdminPendingVinDetail params={p.params as { id: string }} /></Suspense></AdminPage>} />
        <Route path="/adminx/pending-vin-checks" component={() => <AdminPage><Suspense fallback={<PageLoader />}><AdminPendingVinChecks /></Suspense></AdminPage>} />
        <Route path="/adminx/vin/:vin"      component={(p) => <AdminPage><Suspense fallback={<PageLoader />}><AdminVinDetail params={p.params as { vin: string }} /></Suspense></AdminPage>} />
        <Route path="/adminx/transactions"       component={() => <AdminPage><Suspense fallback={<PageLoader />}><AdminTransactions /></Suspense></AdminPage>} />
        <Route path="/adminx/announcements"      component={() => <AdminPage><Suspense fallback={<PageLoader />}><AdminAnnouncements /></Suspense></AdminPage>} />

        {/* VIN routes */}
        <Route path="/:lang/vin/processing" component={(p) => <VinProcessingLang params={p.params as { lang: string; [key: string]: string }} />} />
        <Route path="/:lang/vin/:id" component={(p) => <VinResultLang params={p.params as { lang: string; id: string }} />} />

        {/* Country SEO pages */}
        <Route path="/:lang/cars/:country" component={(p) => <CountryLang params={p.params as { lang: string; country: string }} />} />

        {/* Legal */}
        <Route path="/:lang/terms"   component={(p) => <TermsLang   params={p.params as { lang: string; [key: string]: string }} />} />
        <Route path="/:lang/privacy" component={(p) => <PrivacyLang params={p.params as { lang: string; [key: string]: string }} />} />

        {/* Main pages */}
        <Route path="/:lang/pricing"          component={(p) => <PricingLang         params={p.params as { lang: string; [key: string]: string }} />} />
        <Route path="/:lang/checkout"         component={(p) => <CheckoutLang        params={p.params as { lang: string; [key: string]: string }} />} />
        <Route path="/:lang/dashboard/account" component={(p) => <DashboardLang       params={p.params as { lang: string; [key: string]: string }} />} />
        <Route path="/:lang/dashboard/help"    component={(p) => <DashboardLang       params={p.params as { lang: string; [key: string]: string }} />} />
        <Route path="/:lang/dashboard"        component={(p) => <DashboardLang       params={p.params as { lang: string; [key: string]: string }} />} />
        <Route path="/:lang/purchases"        component={(p) => <PurchasesLang       params={p.params as { lang: string; [key: string]: string }} />} />
        <Route path="/:lang/free-vin-decoder" component={(p) => <FreeVinDecoderLang  params={p.params as { lang: string; [key: string]: string }} />} />
        <Route path="/:lang/how-it-works"    component={(p) => <HowItWorksLang      params={p.params as { lang: string; [key: string]: string }} />} />
        <Route path="/:lang/faq"             component={(p) => <FAQLang             params={p.params as { lang: string; [key: string]: string }} />} />
        <Route path="/:lang/maintenance"     component={(p) => <MaintenanceLang     params={p.params as { lang: string; [key: string]: string }} />} />
        <Route path="/:lang"           component={(p) => <HomeLang      params={p.params as { lang: string; [key: string]: string }} />} />

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
