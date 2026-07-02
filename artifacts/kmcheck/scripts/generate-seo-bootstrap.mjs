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
  seoData,
} from "./seo-inject.mjs";

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
];

const js = `/* auto-generated — do not edit */
(function () {
  var SEO = ${JSON.stringify(seoData)};
  var PATH_MAP = ${JSON.stringify(PATH_TO_SEO_KEY)};
  var OG_LOCALE = ${JSON.stringify(OG_LOCALE_MAP)};
  var SEO_LANGS = ${JSON.stringify(SEO_LANGS)};
  var HREFLANG = ${JSON.stringify({ en: "en", ar: "ar", uk: "uk-UA", ru: "ru", sq: "sq-AL" })};
  var NOINDEX = ${JSON.stringify(NOINDEX)};
  var VALID_COUNTRY_SLUGS = ${JSON.stringify(["usa", "korea", "canada"])};
  var BASE = ${JSON.stringify(basePath)};

  function resolvePageKey(rest) {
    if (PATH_MAP[rest]) return PATH_MAP[rest];
    if (rest.indexOf("/cars/") === 0) {
      var parts = rest.split("/").filter(Boolean);
      var slug = parts[1] ? parts[1].toLowerCase() : "";
      if (VALID_COUNTRY_SLUGS.indexOf(slug) !== -1) {
        if (slug === "korea") return "country_korea";
        if (slug === "canada") return "country_canada";
        return "country_usa";
      }
      return "not_found";
    }
    if (rest.indexOf("/vin/") === 0) return "vin_result";
    return "not_found";
  }

  function isNoIndexPath(rest, pageKey) {
    if (pageKey === "not_found") return true;
    if (NOINDEX.indexOf(rest) !== -1) return true;
    if (rest === "/vin/processing" || rest.indexOf("/vin/processing/") === 0) return true;
    return false;
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

  function applySeoFromUrl() {
    var ORIGIN = location.origin;
    var pathname = stripBase(location.pathname);
    var m = pathname.match(/^\\/(en|ar|uk|ru|sq)(\\/.*)?$/);
    var lang = m ? m[1] : "en";
    var rest = m && m[2] ? m[2].replace(/\\/$/, "") : "";
    var pageKey = resolvePageKey(rest);
    var page = SEO[pageKey] || SEO.not_found || SEO.home;
    var seo = (page && page[lang]) || (page && page.en) || SEO.home.en;
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
