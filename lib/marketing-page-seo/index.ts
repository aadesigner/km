export type MarketingSsrSection = { title: string; body: string };

export type MarketingSsrContent = {
  h1: string;
  lead: string;
  bullets?: string[];
  sections?: MarketingSsrSection[];
};

/** Page keys with generated SSR body content (indexable marketing routes). */
export const MARKETING_SSR_PAGE_KEYS = [
  "home",
  "pricing",
  "free_decoder",
  "how_it_works",
  "faq",
  "country_usa",
  "country_korea",
  "country_canada",
  "country_china",
  "country_uae",
  "api_b2b",
] as const;

export type MarketingSsrPageKey = (typeof MARKETING_SSR_PAGE_KEYS)[number];

export type MarketingSsrData = Record<
  string,
  Partial<Record<string, MarketingSsrContent>>
>;

/** Map SPA pageKey + route rest to marketing-ssr-data.json bucket key. */
export function marketingSsrDataKey(pageKey: string, rest: string): string | null {
  if (pageKey === "api_b2b") {
    if (!rest || rest === "/api-b2b") return "api_b2b";
    return `api_b2b${rest.replace(/^\/api-b2b/, "").replace(/\//g, "_")}`;
  }
  if (MARKETING_SSR_PAGE_KEYS.includes(pageKey as MarketingSsrPageKey)) {
    return pageKey;
  }
  return null;
}

export function escapeMarketingHtml(value: string): string {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function buildMarketingSsrStyleBlock(): string {
  return `<style id="kmcheck-page-ssr-style">
      #root{position:relative;min-height:100vh}
      #root .app-boot-shell{position:relative;z-index:1;min-height:100vh}
      .kmcheck-page-ssr{position:absolute!important;width:1px!important;height:1px!important;padding:0!important;margin:-1px!important;overflow:hidden!important;clip:rect(0,0,0,0)!important;white-space:nowrap!important;border:0!important}
    </style>`;
}

export function buildMarketingSsrBodyBlock(content: MarketingSsrContent): string {
  const bullets = (content.bullets ?? [])
    .filter(Boolean)
    .map((item) => `          <li>${escapeMarketingHtml(item)}</li>`)
    .join("\n");

  const bulletBlock = bullets
    ? `        <ul>\n${bullets}\n        </ul>`
    : "";

  const sections = (content.sections ?? [])
    .filter((section) => section.title?.trim() && section.body?.trim())
    .map(
      (section) => `        <section>
          <h2>${escapeMarketingHtml(section.title)}</h2>
          <p>${escapeMarketingHtml(section.body)}</p>
        </section>`,
    )
    .join("\n");

  return `<main id="kmcheck-page-ssr" class="kmcheck-page-ssr" aria-hidden="true">
      <article>
        <h1>${escapeMarketingHtml(content.h1)}</h1>
        <p class="lead">${escapeMarketingHtml(content.lead)}</p>
${bulletBlock}
${sections}
      </article>
    </main>`;
}

export function removeMarketingSsrFromHtml(html: string): string {
  return html
    .replace(/\n?\s*<style id="kmcheck-page-ssr-style"[^>]*>[\s\S]*?<\/style>/g, "")
    .replace(/\n?\s*<main id="kmcheck-page-ssr"[\s\S]*?<\/main>/g, "");
}

export function injectMarketingSsrIntoHtml(
  html: string,
  content: MarketingSsrContent | null | undefined,
): string {
  if (!content?.h1?.trim() || !content.lead?.trim()) return html;

  let out = removeMarketingSsrFromHtml(html);
  const bodyBlock = buildMarketingSsrBodyBlock(content);

  out = out.replace(
    /(<div id="root">)([\s\S]*?)(<\/div>\s*(?=<script type="module"))/i,
    `$1$2\n    ${bodyBlock}\n  $3`,
  );

  if (!out.includes('id="kmcheck-page-ssr-style"')) {
    out = out.replace(/<\/head>/i, `${buildMarketingSsrStyleBlock()}\n  </head>`);
  }

  return out;
}

export function resolveMarketingSsrContent(
  data: MarketingSsrData,
  pageKey: string,
  rest: string,
  lang: string,
): MarketingSsrContent | null {
  const key = marketingSsrDataKey(pageKey, rest);
  if (!key) return null;
  const page = data[key];
  if (!page) return null;
  const entry = page[lang] ?? page.en;
  if (!entry?.h1?.trim() || !entry.lead?.trim()) return null;
  return entry;
}
