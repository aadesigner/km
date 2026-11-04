declare module "../../scripts/country-page-json-ld.mjs" {
  export function buildCountryPageJsonLd(params: {
    pageKey: string;
    title: string;
    description: string;
    canonicalUrl: string;
    lang: string;
    ogImage?: string;
  }): Record<string, unknown>;

  export function buildPricingPageJsonLd(params: {
    name: string;
    description: string;
    canonicalUrl: string;
    price: number;
    currency?: string;
    origin?: string;
  }): Record<string, unknown>;

  export function buildHomeOrganizationJsonLd(
    origin: string,
    description: string,
  ): Record<string, unknown>;
}
