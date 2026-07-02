import express, { type Express, type Request, type Response } from "express";
import { existsSync, statSync } from "node:fs";
import path from "node:path";
import { logger } from "./logger.js";

const ONE_YEAR_SEC = 31_536_000;
const ONE_DAY_SEC = 86_400;

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
  const fallback = path.join(publicDir, "index.html");
  if (existsSync(fallback)) {
    res.setHeader("Cache-Control", "no-cache");
    res.sendFile(fallback);
    return true;
  }
  return false;
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

  app.get(/^(?!\/api\/).*/, (req: Request, res: Response) => {
    if (req.method !== "GET" && req.method !== "HEAD") {
      res.status(405).end();
      return;
    }
    const urlPath = req.path === "/" ? "/index.html" : req.path;
    if (!sendSpaFile(publicDir, urlPath, res)) {
      res.status(404).send("Not found");
    }
  });

  logger.info({ publicDir }, "Serving static site");
  return publicDir;
}
