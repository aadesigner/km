/**
 * Generates public/seo-bootstrap.js — synchronous SEO on first paint + SPA navigations.
 */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  SEO_LANGS,
  PATH_TO_SEO_KEY,
  OG_LOCALE_MAP,
  HREFLANG_MAP,
  seoData,
} from "./seo-inject.mjs";
import { LANG_PATH_ALT } from "./languages.mjs";
import { vinSeoBootstrapSnippet } from "./vin-seo-templates.mjs";
import {
  faviconAssetsForPageKey,
  DEFAULT_FAVICONS,
  COUNTRY_PAGE_FAVICON_SLUGS,
} from "./country-favicon-config.mjs";

const dir = dirname(fileURLToPath(import.meta.url));
const root = join(dir, "..");
const basePath = (process.env.BASE_PATH ?? "/").replace(/\/$/, "");

const NOINDEX = [
  "/sign-in",
  "/sign-up",
  "/dashboard",
  "/checkout",
  "/purchases",
  "/forgot-password",
  "/reset-password",
  "/set-password",
  "/vin/processing",
];

const NOINDEX_PREFIXES = ["/adminx", "/dashboard"];

const countryPageFavicons = Object.fromEntries(
  Object.keys(COUNTRY_PAGE_FAVICON_SLUGS).map((pageKey) => [
    pageKey,
    faviconAssetsForPageKey(pageKey),
  ]),
);

const js = `/* auto-generated — do not edit */
(function () {
  var SEO = ${JSON.stringify(seoData)};
  var PATH_MAP = ${JSON.stringify(PATH_TO_SEO_KEY)};
  var OG_LOCALE = ${JSON.stringify(OG_LOCALE_MAP)};
  var SEO_LANGS = ${JSON.stringify(SEO_LANGS)};
  var HREFLANG = ${JSON.stringify(HREFLANG_MAP)};
  var NOINDEX = ${JSON.stringify(NOINDEX)};
  var NOINDEX_PREFIXES = ${JSON.stringify(NOINDEX_PREFIXES)};
  var VALID_COUNTRY_SLUGS = ${JSON.stringify(["usa", "korea", "canada", "china", "uae"])};
  var BASE = ${JSON.stringify(basePath)};
  var DEFAULT_FAVICONS = ${JSON.stringify(DEFAULT_FAVICONS)};
  var COUNTRY_PAGE_FAVICONS = ${JSON.stringify(countryPageFavicons)};
  var VIN_INDEX_RE = /^\\/vin\\/([A-HJ-NPR-Z0-9]{17})$/i;

  ${vinSeoBootstrapSnippet()}

  function resolvePageKey(rest) {
    if (PATH_MAP[rest]) return PATH_MAP[rest];
    if (rest.indexOf("/cars/") === 0) {
      var parts = rest.split("/").filter(Boolean);
      var slug = parts[1] ? parts[1].toLowerCase() : "";
      if (VALID_COUNTRY_SLUGS.indexOf(slug) !== -1) {
        if (slug === "korea") return "country_korea";
        if (slug === "canada") return "country_canada";
        if (slug === "china") return "country_china";
        if (slug === "uae") return "country_uae";
        return "country_usa";
      }
      return "not_found";
    }
    if (rest.indexOf("/vin/") === 0) return "vin_result";
    return "not_found";
  }

  function isNoIndexPath(rest, pageKey) {
    if (pageKey === "not_found") return true;
    if (VIN_INDEX_RE.test(rest)) return false;
    if (NOINDEX.indexOf(rest) !== -1) return true;
    for (var i = 0; i < NOINDEX_PREFIXES.length; i++) {
      var p = NOINDEX_PREFIXES[i];
      if (rest === p || rest.indexOf(p + "/") === 0) return true;
    }
    if (rest === "/vin/processing" || rest.indexOf("/vin/processing/") === 0) return true;
    return rest.indexOf("/vin/") === 0;
  }

  function stripBase(pathname) {
    if (!BASE) return pathname;
    if (pathname === BASE) return "/";
    if (pathname.indexOf(BASE + "/") === 0) return pathname.slice(BASE.length) || "/";
    return pathname;
  }

  function upsertMeta(key, content, attr) {
    attr = attr || "name";
    var el = document.querySelector("meta[" + attr + '="' + key + '"]');
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute(attr, key);
      document.head.appendChild(el);
    }
    el.setAttribute("content", content);
  }

  function upsertLink(rel, href, extra) {
    if (!href || !String(href).trim()) return;
    var sel = 'link[rel="' + rel + '"]';
    if (extra) {
      for (var k in extra) sel += '[' + k + '="' + extra[k] + '"]';
    }
    var el = document.querySelector(sel);
    if (!el) {
      el = document.createElement("link");
      el.rel = rel;
      if (extra) for (var k2 in extra) el.setAttribute(k2, extra[k2]);
      document.head.appendChild(el);
    }
    el.href = href;
  }

  function removeAlternates() {
    document.querySelectorAll('link[rel="alternate"][hreflang]').forEach(function (el) {
      el.remove();
    });
    document.querySelectorAll('meta[property="og:locale:alternate"]').forEach(function (el) {
      el.remove();
    });
  }

  function resolveFavicons(pageKey) {
    var assets = COUNTRY_PAGE_FAVICONS[pageKey] || DEFAULT_FAVICONS;
    var base = BASE.replace(/\\/$/, "");
    return {
      icon16: base + assets.icon16,
      icon32: base + assets.icon32,
      apple: base + assets.apple,
    };
  }

  function removeOgImages() {
    document.querySelectorAll('meta[property="og:image"]').forEach(function (el) { el.remove(); });
    document.querySelectorAll('meta[property="og:image:secure_url"]').forEach(function (el) { el.remove(); });
    document.querySelectorAll('meta[property="og:image:alt"]').forEach(function (el) { el.remove(); });
    document.querySelectorAll('meta[name="twitter:image"]').forEach(function (el) { el.remove(); });
  }

  function resolveOgImage(pageKey, lang) {
    if (!OG_PAGE_KEYS[pageKey]) return null;
    var base = BASE.replace(/\\/$/, "");
    return base + "/seo/og/" + pageKey + "-" + lang + ".webp";
  }

  var OG_PAGE_KEYS = ${JSON.stringify(Object.fromEntries(
    ["home", "country_usa", "country_korea", "country_canada", "country_china", "country_uae"].map((k) => [k, true]),
  ))};

  function applyFavicons(pageKey) {
    var favicons = resolveFavicons(pageKey);
    upsertLink("icon", favicons.icon32, { type: "image/png", sizes: "32x32" });
    upsertLink("icon", favicons.icon16, { type: "image/png", sizes: "16x16" });
    upsertLink("apple-touch-icon", favicons.apple, { sizes: "180x180" });
  }

  function applySeoFromUrl() {
    var ORIGIN = location.origin;
    var pathname = stripBase(location.pathname);
    var m = pathname.match(/^\\/(${LANG_PATH_ALT})(\\/.*)?$/);
    var lang = m ? m[1] : "en";
    var rest = m && m[2] ? m[2].replace(/\\/$/, "") : "";
    var vinSeo = VIN_INDEX_RE.test(rest) ? vinSeoFallback(rest, lang) : null;
    var pageKey = resolvePageKey(rest);
    var page = SEO[pageKey] || SEO.not_found || SEO.home;
    var seo = vinSeo || (page && page[lang]) || (page && page.en) || SEO.home.en;
    var noIndex = isNoIndexPath(rest, pageKey);

    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.title = seo.title;
    upsertMeta("description", seo.description);
    upsertMeta("robots", noIndex ? "noindex, nofollow" : "index, follow");
    upsertMeta("og:title", seo.title, "property");
    upsertMeta("og:description", seo.description, "property");
    upsertMeta("og:type", "website", "property");
    upsertMeta("og:locale", OG_LOCALE[lang] || OG_LOCALE.en, "property");
    upsertMeta("og:site_name", "kmcheck.com", "property");
    upsertMeta("twitter:card", "summary_large_image");
    upsertMeta("twitter:title", seo.title);
    upsertMeta("twitter:description", seo.description);

    removeOgImages();
    var ogImageRel = resolveOgImage(pageKey, lang);
    if (ogImageRel) {
      var absoluteOg = ORIGIN + ogImageRel;
      upsertMeta("og:image", absoluteOg, "property");
      upsertMeta("twitter:image", absoluteOg);
      if (absoluteOg.indexOf("https://") === 0) {
        upsertMeta("og:image:secure_url", absoluteOg, "property");
      }
      upsertMeta("og:image:alt", seo.title, "property");
    }

    var canonical = ORIGIN + (rest ? "/" + lang + rest : "/" + lang);
    upsertLink("canonical", canonical);
    upsertMeta("og:url", canonical, "property");

    removeAlternates();
    if (!noIndex) {
      SEO_LANGS.forEach(function (l) {
        var href = ORIGIN + (rest ? "/" + l + rest : "/" + l);
        upsertLink("alternate", href, { hreflang: HREFLANG[l] });
      });
      upsertLink("alternate", ORIGIN + (rest ? "/en" + rest : "/en"), { hreflang: "x-default" });
      SEO_LANGS.forEach(function (l) {
        if (l !== lang) upsertMeta("og:locale:alternate", OG_LOCALE[l], "property");
      });
    }

    applyFavicons(pageKey);
  }

  applySeoFromUrl();

  window.addEventListener("popstate", applySeoFromUrl);
  var pushState = history.pushState;
  var replaceState = history.replaceState;
  history.pushState = function () {
    pushState.apply(history, arguments);
    applySeoFromUrl();
  };
  history.replaceState = function () {
    replaceState.apply(history, arguments);
    applySeoFromUrl();
  };
})();
`;

writeFileSync(join(root, "public", "seo-bootstrap.js"), js, "utf8");
console.log("Wrote public/seo-bootstrap.js");
