import express, { type Express, type Request, type Response, type NextFunction } from "express";
import compression from "compression";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { isAllowedOrigin } from "./lib/allowedOrigins.js";
import { clientGuard } from "./lib/clientGuard.js";
import { publicAbuseLimiter } from "./lib/publicAbuseLimiter.js";
import { maintenanceMiddleware } from "./lib/maintenanceMiddleware.js";
import { accessBlockMiddleware } from "./lib/accessBlockMiddleware.js";
import { requestContextMiddleware } from "./lib/requestContextMiddleware.js";
import { mountStaticSite } from "./lib/staticSite.js";

const app: Express = express();

app.set("trust proxy", 1);

app.use(compression({ threshold: 1024 }));

const CORS_METHODS = "GET,HEAD,POST,PUT,PATCH,DELETE,OPTIONS";
const CORS_HEADERS = "Content-Type,Authorization,X-Requested-With,X-Kmcheck-Client";

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://www.paypal.com",
          "https://www.paypalobjects.com",
          "https://www.google.com",
          "https://www.gstatic.com",
          "https://js.paypal.com",
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://fonts.googleapis.com",
          "https://www.paypal.com",
        ],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        connectSrc: ["'self'", "https://www.paypal.com", "https://api.paypal.com"],
        frameSrc: ["'self'", "https://www.paypal.com", "https://www.google.com"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    frameguard: { action: "deny" },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  }),
);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (!origin) return next();
  if (isAllowedOrigin(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", CORS_METHODS);
    res.setHeader("Access-Control-Allow-Headers", CORS_HEADERS);
    if (req.method === "OPTIONS") return res.sendStatus(204);
    return next();
  }
  res.status(403).json({ error: "CORS: origin not allowed" });
});

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cookieParser());
app.use((req, res, next) => {
  const isLargeCatalogBody =
    req.path.startsWith("/api/admin/vin-catalog")
    && (req.method === "PATCH" || req.method === "POST")
    && !req.path.endsWith("/import")
    && !req.path.endsWith("/import-json");
  const limit = isLargeCatalogBody ? "15mb" : "50kb";
  express.json({ limit })(req, res, (err) => {
    if (err) return next(err);
    express.urlencoded({ extended: true, limit })(req, res, next);
  });
});

app.use("/api", requestContextMiddleware);
app.use("/api", publicAbuseLimiter);
app.use("/api", accessBlockMiddleware);
app.use("/api", clientGuard);
app.use("/api", maintenanceMiddleware);
app.use("/api", router);

mountStaticSite(app);

app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
  const message = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? err.stack : undefined;
  logger.error({ err, stack, method: req.method, url: req.url }, "Unhandled error");
  if (!res.headersSent) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default app;
