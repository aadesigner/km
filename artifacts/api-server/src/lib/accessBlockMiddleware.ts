import type { Request, Response, NextFunction } from "express";
import {
  checkAccessBlock,
  resolveBlockCountryFromRequest,
  resolveBlockIpFromRequest,
} from "./accessBlocks.js";
import { isExemptAccessBlockPath } from "./accessBlockPolicy.js";

export async function accessBlockMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (isExemptAccessBlockPath(req.path)) {
    next();
    return;
  }

  if (req.isAdmin) {
    next();
    return;
  }

  const ip = resolveBlockIpFromRequest(req);
  const country = resolveBlockCountryFromRequest(req);
  const result = await checkAccessBlock(ip, country);

  if (result.blocked) {
    res.status(403).json({
      error: result.reason === "country"
        ? "Access from your region is not permitted."
        : "Access from your network is not permitted.",
      code: result.reason === "country" ? "country_blocked" : "ip_blocked",
    });
    return;
  }

  next();
}
