export const ADMIN_THEME_STORAGE_KEY = "kmcheck-admin-theme";

export const ADMIN_THEME_IDS = ["studio", "command"] as const;

export type AdminThemeId = (typeof ADMIN_THEME_IDS)[number];

export type AdminThemeMeta = {
  id: AdminThemeId;
  name: string;
  vibe: string;
  /** Swatch colors for the picker preview (hex). */
  swatches: [string, string, string];
  /** Google font families to warm (empty = Inter only). */
  googleFonts?: string[];
};

export const ADMIN_THEMES: AdminThemeMeta[] = [
  {
    id: "studio",
    name: "Studio",
    vibe: "Soft green · light rail",
    swatches: ["#16a34a", "#f7faf8", "#ffffff"],
  },
  {
    id: "command",
    name: "Command",
    vibe: "Dark rail · ops contrast",
    swatches: ["#22c55e", "#0b1220", "#f4f6f8"],
    googleFonts: ["IBM+Plex+Sans:wght@400;500;600;700"],
  },
];

/** Map retired theme ids so existing localStorage still lands somewhere sensible. */
const LEGACY_THEME_MAP: Record<string, AdminThemeId> = {
  classic: "studio",
  aurora: "studio",
  ledger: "studio",
  midnight: "command",
  terminal: "command",
  signal: "command",
  noir: "command",
  editorial: "studio",
  atelier: "studio",
  velocity: "command",
};

export function isAdminThemeId(value: unknown): value is AdminThemeId {
  return typeof value === "string" && (ADMIN_THEME_IDS as readonly string[]).includes(value);
}

export function readStoredAdminTheme(): AdminThemeId {
  if (typeof window === "undefined") return "studio";
  try {
    const raw = window.localStorage.getItem(ADMIN_THEME_STORAGE_KEY);
    if (isAdminThemeId(raw)) return raw;
    if (typeof raw === "string" && raw in LEGACY_THEME_MAP) {
      return LEGACY_THEME_MAP[raw]!;
    }
  } catch {
    /* ignore */
  }
  return "studio";
}

export function writeStoredAdminTheme(id: AdminThemeId): void {
  try {
    window.localStorage.setItem(ADMIN_THEME_STORAGE_KEY, id);
  } catch {
    /* ignore */
  }
}

const FONT_LINK_ID = "kmcheck-admin-theme-fonts";

/** Load Google fonts for themes that need them (admin-only). */
export function ensureAdminThemeFonts(id: AdminThemeId): void {
  if (typeof document === "undefined") return;
  const theme = ADMIN_THEMES.find((t) => t.id === id);
  const families = theme?.googleFonts ?? [];
  const existing = document.getElementById(FONT_LINK_ID) as HTMLLinkElement | null;

  if (families.length === 0) {
    existing?.remove();
    return;
  }

  const href =
    `https://fonts.googleapis.com/css2?${families.map((f) => `family=${f}`).join("&")}&display=swap`;

  if (existing) {
    if (existing.href !== href) existing.href = href;
    return;
  }

  const preconnect1 = document.createElement("link");
  preconnect1.rel = "preconnect";
  preconnect1.href = "https://fonts.googleapis.com";
  preconnect1.id = `${FONT_LINK_ID}-pc1`;

  const preconnect2 = document.createElement("link");
  preconnect2.rel = "preconnect";
  preconnect2.href = "https://fonts.gstatic.com";
  preconnect2.crossOrigin = "anonymous";
  preconnect2.id = `${FONT_LINK_ID}-pc2`;

  if (!document.getElementById(`${FONT_LINK_ID}-pc1`)) {
    document.head.appendChild(preconnect1);
  }
  if (!document.getElementById(`${FONT_LINK_ID}-pc2`)) {
    document.head.appendChild(preconnect2);
  }

  const link = document.createElement("link");
  link.id = FONT_LINK_ID;
  link.rel = "stylesheet";
  link.href = href;
  document.head.appendChild(link);
}
