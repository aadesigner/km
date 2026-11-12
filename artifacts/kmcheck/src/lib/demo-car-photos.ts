/**
 * Demo car photos live in public/demo-cars (copied to dist on build).
 * Refresh: node artifacts/kmcheck/scripts/fetch-demo-car-photos.mjs
 */
export function demoCarPhotoUrl(file: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${base}/demo-cars/${encodeURIComponent(file)}`;
}

/** Same mapping used when Carstat illustrative demos ship the wrong vehicle photos. */
const STOCK_BY_MAKE_MODEL: Array<{ test: RegExp; file: string }> = [
  { test: /honda.*cr[-\s]?v/i, file: "honda-crv.jpg" },
  { test: /toyota.*rav\s?4/i, file: "toyota-rav4.jpg" },
  { test: /ford.*f[-\s]?150/i, file: "ford-f150.jpg" },
  { test: /nissan.*altima/i, file: "nissan-altima.jpg" },
  { test: /chevrolet|chevy.*malibu/i, file: "chevy-malibu.jpg" },
  { test: /bmw.*3\s?20/i, file: "bmw-320i.jpg" },
  { test: /mercedes.*c[-\s]?class|mercedes.*c\s?200|mercedes.*c\s?180/i, file: "mercedes-c-class.jpg" },
  { test: /volkswagen|vw.*tiguan/i, file: "vw-tiguan.jpg" },
  { test: /hyundai.*tucson/i, file: "hyundai-tucson.jpg" },
  { test: /hyundai.*grandeur/i, file: "hyundai-grandeur.jpg" },
  { test: /kia.*sportage/i, file: "kia-sportage.jpg" },
  { test: /kia.*carnival/i, file: "kia-carnival.jpg" },
  { test: /kia.*k8/i, file: "kia-k8.jpg" },
  { test: /honda.*civic/i, file: "honda-civic.jpg" },
  { test: /toyota.*prius/i, file: "toyota-prius.jpg" },
  { test: /subaru.*forester/i, file: "subaru-forester.jpg" },
  { test: /nissan.*qashqai/i, file: "nissan-qashqai.jpg" },
];

export function stockPhotoForMakeModel(
  make: string | null | undefined,
  model: string | null | undefined,
): string | null {
  const blob = `${make ?? ""} ${model ?? ""}`.trim();
  if (!blob) return null;
  for (const row of STOCK_BY_MAKE_MODEL) {
    if (row.test.test(blob)) return demoCarPhotoUrl(row.file);
  }
  return null;
}

/** Known Carstat demo media that belongs to another make (Jeep / Genesis). */
const MISATTRIBUTED_MEDIA_MAKES: Record<string, string[]> = {
  "017760110fc426b7d79008da1c0427467829a05cd60dcfdb3ca4a5a9a0b39f42": ["jeep"],
  "0d61f374ace5f42d797b32d1a5d778ed5d32141eb814a58eaa4260951c6d4069": ["jeep"],
  "1b318fc67535e0fd24862870e53e535c992d7a1aec2b786dee4e1f78f69fe804": ["jeep"],
  "0e4b387392c55a9b232be41ae36dbbf82c1b7e3724e16e032408f48ad85b229f": ["genesis"],
};

function mediaHash(url: string): string | null {
  const m = url.match(/\/vhr\/media\/([a-f0-9]{32,})(?:\.[a-z0-9]+)?(?:\?|$)/i);
  return m?.[1]?.toLowerCase() ?? null;
}

function makeTokens(make: string | null | undefined): string[] {
  const raw = (make ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  if (!raw) return [];
  return raw.split(/\s+/).filter(Boolean);
}

export function photoMatchesVehicleMake(url: string, make: string | null | undefined): boolean {
  const hash = mediaHash(url);
  if (!hash) return true;
  const owners = MISATTRIBUTED_MEDIA_MAKES[hash];
  if (!owners?.length) return true;
  const tokens = makeTokens(make);
  if (tokens.length === 0) return false;
  return owners.some((owner) => tokens.some((t) => t.includes(owner) || owner.includes(t)));
}

/**
 * Drop known wrong-make Carstat demo frames; if the gallery empties, use stock art.
 * Also replaces absolute `/demo-cars/...` paths from the API with BASE_URL-aware URLs.
 */
export function sanitizeReportPhotosForVehicle(opts: {
  photos: string[];
  make?: string | null;
  model?: string | null;
}): string[] {
  const stock = stockPhotoForMakeModel(opts.make, opts.model);
  const filtered = opts.photos
    .map((url) => {
      if (url.startsWith("/demo-cars/")) {
        const file = url.slice("/demo-cars/".length);
        return demoCarPhotoUrl(decodeURIComponent(file));
      }
      return url;
    })
    .filter((url) => photoMatchesVehicleMake(url, opts.make));

  if (filtered.length === 0 && stock && opts.photos.length > 0) return [stock];
  if (filtered.length === 0 && stock && opts.photos.some((u) => u.includes("/demo-cars/"))) {
    return [stock];
  }
  return filtered;
}
