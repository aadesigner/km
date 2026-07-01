import express, { type Express, type Request, type Response } from "express";
import { existsSync, statSync } from "node:fs";
import path from "node:path";
import { logger } from "./logger.js";

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

function sendSpaFile(publicDir: string, reqPath: string, res: Response): boolean {
  const safe = path.normalize(reqPath).replace(/^(\.\.(\/|\\|$))+/, "");
  const direct = path.join(publicDir, safe);
  if (existsSync(direct) && statSync(direct).isFile()) {
    res.sendFile(direct);
    return true;
  }
  const withIndex = path.join(publicDir, safe, "index.html");
  if (existsSync(withIndex) && statSync(withIndex).isFile()) {
    res.sendFile(withIndex);
    return true;
  }
  const fallback = path.join(publicDir, "index.html");
  if (existsSync(fallback)) {
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
      maxAge: process.env.NODE_ENV === "production" ? "1h" : 0,
      setHeaders(res, filePath) {
        if (filePath.endsWith(".html")) {
          res.setHeader("Cache-Control", "no-cache");
        }
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
