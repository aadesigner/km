import type { Request, Response, NextFunction } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { readSessionUserId } from "./auth.js";

declare global {
  namespace Express {
    interface Request {
      isAdmin?: boolean;
    }
  }
}

/** Attach session userId + isAdmin for downstream middleware and rate limiters. */
export async function requestContextMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = await readSessionUserId(req);
    if (!userId) {
      next();
      return;
    }
    req.userId = userId;
    const [user] = await db
      .select({ isAdmin: usersTable.isAdmin })
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);
    if (user?.isAdmin) req.isAdmin = true;
    next();
  } catch {
    next();
  }
}

export function isRequestAdmin(req: Request): boolean {
  return req.isAdmin === true;
}
