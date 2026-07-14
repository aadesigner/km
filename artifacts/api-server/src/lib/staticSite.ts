import express, { type Express, type Request, type Response } from "express";
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { parseVinPagePath } from "@workspace/vin-page-seo";
import { logger } from "./logger.js";
import { vinHasReportData } from "./vinService.js";
import { buildVinSeoFromCatalogData } from "./vinPageSeo.js";
import { buildImageProxyUrl } from "./imageProxy.js";
import { buildVinOnlyFallbackSeo, injectVinPageSeoIntoHtml } from "./vinSeoHtmlInject.js";
import { isKnownSpaPath } from "./spaKnownPaths.js";

const ONE_YEAR_SEC = 31_536_000;
const ONE_DAY_SEC = 86_400;

/** Missing build assets must 404 — never return index.html (breaks dynamic import). */
const STATIC_ASSET_PATH_RE = /\.(?:js|mjs|css|map|woff2?|png|jpe?g|webp|svg|ico|gif|txt|xml)$/i;

function isStaticAssetRequest(reqPath: string): boolean {
  const path = reqPath.toLowerCase();
  return path.includes("/assets/") || STATIC_ASSET_PATH_RE.test(path);
}

function resolvePublicDir(): string | null {
  const fromEnv = process.env.PUBLIC_DIR?.trim();
  if (fromEnv && existsSync(fromEnv)) return fromEnv;

  const candidates = [
    path.resolve(process.cwd(), "artifacts/kmcheck/dist/public"),
    path.resolve(process.cwd(), "../kmcheck/dist/public"),
    path.resolve(process.cwd(), "dist/public"),
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

function setCacheHeaders(res: Response, maxAgeSec: number, immutable = false): void {
  const cacheControl = immutable
    ? `public, max-age=${maxAgeSec}, immutable`
    : `public, max-age=${maxAgeSec}, stale-while-revalidate=${maxAgeSec}`;
  res.setHeader("Cache-Control", cacheControl);
  res.setHeader("Expires", new Date(Date.now() + maxAgeSec * 1000).toUTCString());
}

function cachePolicyForFile(filePath: string): { maxAgeSec: number; immutable: boolean } | null {
  const base = path.basename(filePath).toLowerCase();
  if (filePath.endsWith(".html")) {
    return { maxAgeSec: 0, immutable: false };
  }

  if (
    base === "favicon.ico"
    || base.startsWith("favicon-")
    || base === "favicon.png"
    || base === "apple-touch-icon.png"
    || filePath.includes(`${path.sep}assets${path.sep}`)
  ) {
    return { maxAgeSec: ONE_YEAR_SEC, immutable: true };
  }

  if (/\.(?:js|css|woff2?|png|jpe?g|webp|svg|ico|txt|xml)$/.test(filePath)) {
    return { maxAgeSec: ONE_DAY_SEC, immutable: false };
  }

  return null;
}

function applyStaticCacheHeaders(res: Response, filePath: string): void {
  const policy = cachePolicyForFile(filePath);
  if (!policy) return;
  if (policy.maxAgeSec <= 0) {
    res.setHeader("Cache-Control", "no-cache");
    return;
  }
  setCacheHeaders(res, policy.maxAgeSec, policy.immutable);
}

function requestOrigin(req: Request): string {
  const fromEnv = process.env.SITE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  const host = req.headers.host;
  if (!host) return "https://kmcheck.com";
  const forwarded = req.headers["x-forwarded-proto"];
  const proto = (typeof forwarded === "string" ? forwarded.split(",")[0] : forwarded)
    ?? (req.secure ? "https" : "http");
  return `${proto}://${host}`.replace(/\/$/, "");
}

let cachedIndexHtml: string | null = null;

function loadIndexHtml(publicDir: string): string {
  if (!cachedIndexHtml) {
    cachedIndexHtml = readFileSync(path.join(publicDir, "index.html"), "utf8");
  }
  return cachedIndexHtml;
}

async function injectVinCatalogSeo(html: string, reqPath: string, origin: string): Promise<string> {
  const parsed = parseVinPagePath(reqPath.replace(/\/$/, "") || "/");
  if (!parsed) return html;

  try {
    const report = await vinHasReportData(parsed.vin);
    if (!report) {
      const seo = buildVinOnlyFallbackSeo(parsed.lang, parsed.vin, origin);
      return injectVinPageSeoIntoHtml(html, seo, parsed.lang, origin);
    }

    const d = report.dataSource;
    const photos = Array.isArray(d.photos) ? (d.photos as string[]).filter(Boolean) : [];
    const thumbnailUrl = photos[0]
      ? buildImageProxyUrl(photos[0], { mediaVersion: report.mediaVersion })
      : null;

    const seo = buildVinSeoFromCatalogData(parsed.lang, parsed.vin, d, {
      thumbnailUrl,
      origin,
    });
    return injectVinPageSeoIntoHtml(html, seo, parsed.lang, origin);
  } catch (err) {
    logger.warn({ err, path: reqPath }, "VIN SEO HTML inject failed");
    return html;
  }
}

function sendSpaFile(publicDir: string, reqPath: string, res: Response): boolean {
  const safe = path.normalize(reqPath).replace(/^(\.\.(\/|\\|$))+/, "");
  const direct = path.join(publicDir, safe);
  if (existsSync(direct) && statSync(direct).isFile()) {
    applyStaticCacheHeaders(res, direct);
    res.sendFile(direct);
    return true;
  }
  const withIndex = path.join(publicDir, safe, "index.html");
  if (existsSync(withIndex) && statSync(withIndex).isFile()) {
    res.setHeader("Cache-Control", "no-cache");
    res.sendFile(withIndex);
    return true;
  }
  return false;
}

async function sendSpaFallback(publicDir: string, reqPath: string, req: Request, res: Response): Promise<boolean> {
  const fallback = path.join(publicDir, "index.html");
  if (!existsSync(fallback)) return false;

  res.setHeader("Cache-Control", "no-cache");
  const origin = requestOrigin(req);
  let html = loadIndexHtml(publicDir);
  html = await injectVinCatalogSeo(html, req.path, origin);
  res.type("html").send(html);
  return true;
}

/** Real HTTP 404 shell — SPA NotFound can still hydrate; do not use English-home SEO. */
function sendHardNotFound(publicDir: string, req: Request, res: Response): boolean {
  const fallback = path.join(publicDir, "index.html");
  if (!existsSync(fallback)) return false;

  res.setHeader("Cache-Control", "no-cache");
  let html = loadIndexHtml(publicDir);
  html = html
    .replace(/\n?\s*<meta name="robots"[^>]*>/gi, "")
    .replace(/<title>[^<]*<\/title>/i, "<title>Page Not Found | kmcheck.com</title>");
  if (!/<meta name="robots"/i.test(html)) {
    html = html.replace(
      /<\/title>/i,
      `</title>\n    <meta name="robots" content="noindex, nofollow" />`,
    );
  }
  res.status(404).type("html").send(html);
  return true;
}

/** Serve built kmcheck frontend (production / Railway single-service deploy). */
export function mountStaticSite(app: Express): string | null {
  if (process.env.SERVE_STATIC === "false") return null;

  const publicDir = resolvePublicDir();
  if (!publicDir) {
    if (process.env.NODE_ENV === "production") {
      logger.warn("PUBLIC_DIR not found — API-only mode (no static site)");
    }
    return null;
  }

  app.use(
    express.static(publicDir, {
      index: false,
      maxAge: process.env.NODE_ENV === "production" ? "1d" : 0,
      setHeaders(res, filePath) {
        applyStaticCacheHeaders(res, filePath);
      },
    }),
  );

  app.get(/^(?!\/api\/).*/, async (req: Request, res: Response) => {
    if (req.method !== "GET" && req.method !== "HEAD") {
      res.status(405).end();
      return;
    }
    const urlPath = req.path === "/" ? "/index.html" : req.path;
    if (sendSpaFile(publicDir, urlPath, res)) return;
    if (isStaticAssetRequest(req.path)) {
      res.status(404).type("text/plain").send("Not found");
      return;
    }
    // Unknown routes: real 404 (not English home with status 200).
    if (!isKnownSpaPath(req.path)) {
      if (sendHardNotFound(publicDir, req, res)) return;
      res.status(404).send("Not found");
      return;
    }
    if (await sendSpaFallback(publicDir, urlPath, req, res)) return;
    res.status(404).send("Not found");
  });

  logger.info({ publicDir }, "Serving static site");
  return publicDir;
}
