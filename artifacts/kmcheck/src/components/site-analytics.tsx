import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { fetchPublicSettings, PUBLIC_SETTINGS_QUERY_KEY } from "@/lib/public-settings";
import { isPublicAnalyticsPath, removeInjectedAnalytics } from "@/lib/analytics-scope";

const GTM_HEAD_ATTR = "data-kmcheck-gtm-head";
const GTM_BODY_ATTR = "data-kmcheck-gtm-body";
const GA_LOADER_ATTR = "data-kmcheck-ga-loader";
const GA_CONFIG_ATTR = "data-kmcheck-ga-config";

const CLARITY_LOADER_ATTR = "data-kmcheck-clarity";

type AnalyticsPublicSettings = {
  analyticsGtmEnabled?: boolean;
  analyticsGtmContainerId?: string | null;
  analyticsGaEnabled?: boolean;
  analyticsGaMeasurementId?: string | null;
  analyticsClarityEnabled?: boolean;
  analyticsClarityProjectId?: string | null;
};

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    clarity?: ClarityStub;
  }
}

type ClarityStub = ((...args: unknown[]) => void) & { q?: unknown[][] };

function injectGtm(containerId: string) {
  if (!document.querySelector(`script[${GTM_HEAD_ATTR}]`)) {
    const script = document.createElement("script");
    script.setAttribute(GTM_HEAD_ATTR, containerId);
    script.innerHTML = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${containerId}');`;
    document.head.appendChild(script);
  }

  if (!document.querySelector(`noscript[${GTM_BODY_ATTR}]`)) {
    const noscript = document.createElement("noscript");
    noscript.setAttribute(GTM_BODY_ATTR, containerId);
    noscript.innerHTML = `<iframe src="https://www.googletagmanager.com/ns.html?id=${containerId}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`;
    document.body.insertBefore(noscript, document.body.firstChild);
  }
}

function injectGa(measurementId: string) {
  window.dataLayer = window.dataLayer || [];
  if (!window.gtag) {
    window.gtag = function gtag(...args: unknown[]) {
      window.dataLayer!.push(args);
    };
  }

  if (!document.querySelector(`script[${GA_LOADER_ATTR}]`)) {
    const loader = document.createElement("script");
    loader.async = true;
    loader.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
    loader.setAttribute(GA_LOADER_ATTR, measurementId);
    document.head.appendChild(loader);
  }

  if (!document.querySelector(`script[${GA_CONFIG_ATTR}]`)) {
    const config = document.createElement("script");
    config.setAttribute(GA_CONFIG_ATTR, measurementId);
    config.innerHTML = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${measurementId}',{send_page_view:false});`;
    document.head.appendChild(config);
  }
}

function injectClarity(projectId: string) {
  if (document.querySelector(`script[${CLARITY_LOADER_ATTR}]`)) return;

  // Clarity's tag script calls window.clarity() immediately — stub must exist first (official snippet).
  if (!window.clarity) {
    const stub: ClarityStub = (...args: unknown[]) => {
      (stub.q = stub.q ?? []).push(args);
    };
    window.clarity = stub;
  }

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.clarity.ms/tag/${encodeURIComponent(projectId)}`;
  script.setAttribute(CLARITY_LOADER_ATTR, projectId);
  const first = document.getElementsByTagName("script")[0];
  if (first?.parentNode) {
    first.parentNode.insertBefore(script, first);
  } else {
    document.head.appendChild(script);
  }
}

function trackPageView(path: string, gaId: string | null, gtmEnabled: boolean) {
  if (!isPublicAnalyticsPath(path)) return;

  if (gtmEnabled) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: "pageview",
      page_path: path,
      page_title: document.title,
    });
  }

  if (gaId && window.gtag) {
    window.gtag("event", "page_view", {
      page_path: path,
      page_title: document.title,
      send_to: gaId,
    });
  }
}

async function fetchAnalyticsSettings(): Promise<AnalyticsPublicSettings> {
  const d = await fetchPublicSettings();
  return {
    analyticsGtmEnabled: !!d.analyticsGtmEnabled,
    analyticsGtmContainerId: (d.analyticsGtmContainerId as string | null) ?? null,
    analyticsGaEnabled: !!d.analyticsGaEnabled,
    analyticsGaMeasurementId: (d.analyticsGaMeasurementId as string | null) ?? null,
    analyticsClarityEnabled: !!d.analyticsClarityEnabled,
    analyticsClarityProjectId: (d.analyticsClarityProjectId as string | null) ?? null,
  };
}

/** Injects GTM / GA / Clarity on public marketing routes only (never /adminx or /:lang/dashboard). */
export function SiteAnalytics() {
  const [location] = useLocation();
  const injectedRef = useRef(false);
  const configRef = useRef<{ gtm: string | null; ga: string | null; clarity: string | null }>({
    gtm: null,
    ga: null,
    clarity: null,
  });
  const trackable = isPublicAnalyticsPath(location);

  const { data: settings } = useQuery({
    queryKey: PUBLIC_SETTINGS_QUERY_KEY,
    queryFn: fetchAnalyticsSettings,
    staleTime: 5 * 60_000,
  });

  const gtmId = settings?.analyticsGtmEnabled && settings.analyticsGtmContainerId
    ? settings.analyticsGtmContainerId
    : null;
  const gaId = settings?.analyticsGaEnabled && settings.analyticsGaMeasurementId
    ? settings.analyticsGaMeasurementId
    : null;
  const clarityId = settings?.analyticsClarityEnabled && settings.analyticsClarityProjectId
    ? settings.analyticsClarityProjectId
    : null;

  useEffect(() => {
    if (!trackable) {
      removeInjectedAnalytics();
      injectedRef.current = false;
      configRef.current = { gtm: null, ga: null, clarity: null };
      return;
    }
    if (!gtmId && !gaId && !clarityId) return;

    if (gtmId) injectGtm(gtmId);
    if (gaId) injectGa(gaId);
    if (clarityId) injectClarity(clarityId);

    configRef.current = { gtm: gtmId, ga: gaId, clarity: clarityId };
    injectedRef.current = true;

    trackPageView(location, gaId, !!gtmId);
  }, [gtmId, gaId, clarityId, trackable]); // eslint-disable-line react-hooks/exhaustive-deps -- inject + first pageview only

  useEffect(() => {
    if (!trackable || !injectedRef.current) return;
    const { gtm, ga } = configRef.current;
    if (!gtm && !ga) return;
    trackPageView(location, ga, !!gtm);
  }, [location, trackable]);

  return null;
}
