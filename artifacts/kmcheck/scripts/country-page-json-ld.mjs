/**
 * WebPage + Service JSON-LD for country landing pages (USA / Korea / Canada).
 * Used by prerender (seo-inject) and the client bundle (via Vite import).
 */

const COUNTRY_PAGE_KEYS = new Set(["country_usa", "country_korea", "country_canada"]);

const AREA_SERVED = {
  country_usa: "United States",
  country_korea: "South Korea",
  country_canada: "Canada",
};

/** @param {string} lang BCP 47 tag, e.g. en, sq-AL, uk-UA */
export function buildCountryPageJsonLd({
  pageKey,
  title,
  description,
  canonicalUrl,
  lang,
  ogImage,
}) {
  if (!COUNTRY_PAGE_KEYS.has(pageKey)) return undefined;

  const areaServed = AREA_SERVED[pageKey];
  const webpageId = `${canonicalUrl}#webpage`;
  const serviceId = `${canonicalUrl}#service`;

  const webpage = {
    "@type": "WebPage",
    "@id": webpageId,
    url: canonicalUrl,
    name: title.replace(/\s*\|\s*kmcheck\.com\s*$/i, "").trim(),
    description,
    inLanguage: lang,
    isPartOf: {
      "@type": "WebSite",
      "@id": "https://kmcheck.com/#website",
      name: "kmcheck.com",
      url: "https://kmcheck.com",
    },
  };

  if (ogImage) {
    webpage.primaryImageOfPage = { "@type": "ImageObject", url: ogImage };
  }

  const service = {
    "@type": "Service",
    "@id": serviceId,
    name: title.replace(/\s*\|\s*kmcheck\.com\s*$/i, "").trim(),
    description,
    url: canonicalUrl,
    provider: {
      "@type": "Organization",
      name: "kmcheck.com",
      url: "https://kmcheck.com",
    },
    areaServed: { "@type": "Country", name: areaServed },
    serviceType: "Vehicle history report",
  };

  return {
    "@context": "https://schema.org",
    "@graph": [webpage, service],
  };
}

export function isCountrySeoPageKey(pageKey) {
  return COUNTRY_PAGE_KEYS.has(pageKey);
}
