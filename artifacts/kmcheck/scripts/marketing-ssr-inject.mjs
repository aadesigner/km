/**
 * Marketing page SSR body injection — mirrors @workspace/marketing-page-seo for Node scripts.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { MARKETING_SSR_PAGE_KEYS } from "./marketing-ssr-keys.mjs";

const __dir = dirname(fileURLToPath(import.meta.url));

let marketingSsrData = null;

function loadMarketingSsrData() {
  if (marketingSsrData) return marketingSsrData;
  marketingSsrData = JSON.parse(
    readFileSync(join(__dir, "../src/lib/marketing-ssr-data.json"), "utf8"),
  );
  return marketingSsrData;
}

function escapeMarketingHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function marketingSsrDataKey(pageKey, rest) {
  if (pageKey === "api_b2b") {
    if (!rest || rest === "/api-b2b") return "api_b2b";
    return `api_b2b${rest.replace(/^\/api-b2b/, "").replace(/\//g, "_")}`;
  }
  if (MARKETING_SSR_PAGE_KEYS.includes(pageKey)) return pageKey;
  return null;
}

export function resolveMarketingSsrContent(pageKey, rest, lang) {
  const data = loadMarketingSsrData();
  const key = marketingSsrDataKey(pageKey, rest);
  if (!key) return null;
  const page = data[key];
  if (!page) return null;
  const entry = page[lang] ?? page.en;
  if (!entry?.h1?.trim() || !entry.lead?.trim()) return null;
  return entry;
}

function buildMarketingSsrStyleBlock() {
  return `<style id="kmcheck-page-ssr-style">
      .kmcheck-page-ssr{max-width:48rem;margin:1.5rem auto 2rem;padding:0 1rem;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;line-height:1.6;color:#0f172a}
      .kmcheck-page-ssr h1{margin:0 0 .75rem;font-size:1.75rem;line-height:1.2;font-weight:800}
      .kmcheck-page-ssr .lead{margin:.75rem 0 1rem;font-size:1.05rem;color:#334155}
      .kmcheck-page-ssr ul{margin:.75rem 0 1.25rem;padding-left:1.25rem}
      .kmcheck-page-ssr li{margin:.35rem 0}
      .kmcheck-page-ssr section{margin-top:1.25rem}
      .kmcheck-page-ssr h2{margin:0 0 .35rem;font-size:1.1rem;line-height:1.3;font-weight:700}
      .kmcheck-page-ssr p{margin:.5rem 0}
      .dark .kmcheck-page-ssr{color:#f8fafc}
      .dark .kmcheck-page-ssr .lead{color:#cbd5e1}
    </style>`;
}

function buildMarketingSsrBodyBlock(content) {
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

  return `<main id="kmcheck-page-ssr" class="kmcheck-page-ssr">
      <article>
        <h1>${escapeMarketingHtml(content.h1)}</h1>
        <p class="lead">${escapeMarketingHtml(content.lead)}</p>
${bulletBlock}
${sections}
      </article>
    </main>`;
}

export function removeMarketingSsrFromHtml(html) {
  return html
    .replace(/\n?\s*<style id="kmcheck-page-ssr-style"[^>]*>[\s\S]*?<\/style>/g, "")
    .replace(/\n?\s*<main id="kmcheck-page-ssr"[\s\S]*?<\/main>/g, "");
}

export function injectMarketingSsrIntoHtml(html, content) {
  if (!content?.h1?.trim() || !content.lead?.trim()) return html;

  let out = removeMarketingSsrFromHtml(html);
  const bodyBlock = buildMarketingSsrBodyBlock(content);

  out = out.replace(
    /<div id="root">[\s\S]*?<\/div>\s*(?=<script type="module")/i,
    `<div id="root">\n    ${bodyBlock}\n    </div>\n    `,
  );

  if (!out.includes('id="kmcheck-page-ssr-style"')) {
    out = out.replace(/<\/head>/i, `${buildMarketingSsrStyleBlock()}\n  </head>`);
  }

  return out;
}
