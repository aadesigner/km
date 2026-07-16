export const API_B2B_REGIONS = [
  {
    slug: "usa-cars",
    flag: "us",
    accent: "#1B4D3E",
    seoLabel: "USA",
    nameKey: "regionUsa" as const,
    blurbKey: "regionUsaBlurb" as const,
  },
  {
    slug: "canada-cars",
    flag: "ca",
    accent: "#C8102E",
    seoLabel: "Canada",
    nameKey: "regionCanada" as const,
    blurbKey: "regionCanadaBlurb" as const,
  },
  {
    slug: "korea-cars",
    flag: "kr",
    accent: "#0047A0",
    seoLabel: "Korea",
    nameKey: "regionKorea" as const,
    blurbKey: "regionKoreaBlurb" as const,
  },
  {
    slug: "dubai-cars",
    flag: "ae",
    accent: "#00732F",
    seoLabel: "Dubai",
    nameKey: "regionDubai" as const,
    blurbKey: "regionDubaiBlurb" as const,
  },
  {
    slug: "china-cars",
    flag: "cn",
    accent: "#DE2910",
    seoLabel: "China",
    nameKey: "regionChina" as const,
    blurbKey: "regionChinaBlurb" as const,
  },
] as const;

export type ApiB2bRegionSlug = (typeof API_B2B_REGIONS)[number]["slug"];

export function findApiB2bRegion(slug: string) {
  return API_B2B_REGIONS.find((r) => r.slug === slug) ?? null;
}

export const API_B2B_PATHS = [
  "",
  "/plans",
  "/contact",
  "/vin-decoder",
  ...API_B2B_REGIONS.map((r) => `/${r.slug}`),
] as const;
