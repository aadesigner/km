import { Router } from "express";
import { db, usersTable, vinLookupsTable, paymentsTable } from "@workspace/db";
import { eq, desc, count, sum, and, gte, ne, type SQL } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";
import { authSessionUserSelect } from "../lib/authUserSelect.js";
import { recordedTransactionWhere } from "../lib/recordedPayments.js";
import { transformVinPhotoData } from "../lib/imageProxy.js";
import { mediaVersionFromUpdatedAt } from "../lib/vinImageCache.js";
import { summarizeVinLookupData } from "../lib/vinLookupSummary.js";
import { parseUserCountryCode } from "../lib/userCountry.js";
import {
  MAX_COUNTRY_CHANGES_PER_DAY,
  countryChangesRemaining,
  nextCountryChangeCount,
} from "../lib/countryChangeLimit.js";

function proxyVinRow(row: Record<string, unknown>): Record<string, unknown> {
  const mediaVersion = mediaVersionFromUpdatedAt(
    row.updatedAt as Date | string | null | undefined,
  );
  const { providerName: _providerName, ...rest } = row;
  const result: Record<string, unknown> = { ...rest };

  if (result.data && typeof result.data === "object" && !Array.isArray(result.data)) {
    result.data = transformVinPhotoData(result.data, mediaVersion);
  }

  return result;
}

const router = Router();

/** User-facing lists exclude admin-revoked lookups (row kept in DB for audit). */
function activeUserLookupWhere(userId: string): SQL {
  return and(eq(vinLookupsTable.userId, userId), ne(vinLookupsTable.status, "revoked"))!;
}

// GET /user/profile
router.get("/user/profile", requireAuth, async (req, res) => {
  const userId = req.userId!;

  const [user] = await db
    .select({
      ...authSessionUserSelect,
      countryChangeDay: usersTable.countryChangeDay,
      countryChangeCount: usersTable.countryChangeCount,
    })
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const [checksResult] = await db.select({ total: count() }).from(vinLookupsTable).where(activeUserLookupWhere(userId));
  const [spentResult] = await db.select({ total: sum(paymentsTable.amount) }).from(paymentsTable)
    .where(recordedTransactionWhere(eq(paymentsTable.userId, userId)));

  res.setHeader("Cache-Control", "private, no-store");
  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    isBanned: user.isBanned,
    isAdmin: user.isAdmin,
    countryCode: user.countryCode ?? null,
    countryChangesRemaining: countryChangesRemaining(user.countryChangeDay, user.countryChangeCount),
    countryChangesLimit: MAX_COUNTRY_CHANGES_PER_DAY,
    totalChecks: checksResult?.total ?? 0,
    totalSpent: Number(spentResult?.total ?? 0),
    createdAt: user.createdAt,
  });
});

// PATCH /user/profile — update informational profile fields (country)
router.patch("/user/profile", requireAuth, async (req, res) => {
  const userId = req.userId!;
  const { countryCode: rawCountry } = req.body as { countryCode?: string | null };

  if (rawCountry === undefined) {
    res.status(400).json({ error: "No fields to update" });
    return;
  }

  const countryCode = parseUserCountryCode(rawCountry);
  if (rawCountry !== null && rawCountry !== "" && !countryCode) {
    res.status(400).json({ error: "Invalid country", code: "INVALID_COUNTRY" });
    return;
  }

  const [current] = await db
    .select({
      countryCode: usersTable.countryCode,
      countryChangeDay: usersTable.countryChangeDay,
      countryChangeCount: usersTable.countryChangeCount,
    })
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);

  if (!current) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const previous = current.countryCode ?? null;
  const next = countryCode;
  const remainingBefore = countryChangesRemaining(current.countryChangeDay, current.countryChangeCount);

  // No-op save — do not consume a daily change.
  if (previous === next) {
    res.setHeader("Cache-Control", "private, no-store");
    res.json({
      id: userId,
      countryCode: previous,
      countryChangesRemaining: remainingBefore,
      countryChangesLimit: MAX_COUNTRY_CHANGES_PER_DAY,
    });
    return;
  }

  if (remainingBefore <= 0) {
    res.status(429).json({
      error: "You can change country / nationality at most twice per day.",
      code: "COUNTRY_CHANGE_LIMIT",
      countryChangesRemaining: 0,
      countryChangesLimit: MAX_COUNTRY_CHANGES_PER_DAY,
    });
    return;
  }

  const bump = nextCountryChangeCount(current.countryChangeDay, current.countryChangeCount);

  const [user] = await db
    .update(usersTable)
    .set({
      countryCode: next,
      countryChangeDay: bump.day,
      countryChangeCount: bump.count,
      updatedAt: new Date(),
    })
    .where(eq(usersTable.id, userId))
    .returning(authSessionUserSelect);

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.setHeader("Cache-Control", "private, no-store");
  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    isBanned: user.isBanned,
    isAdmin: user.isAdmin,
    countryCode: user.countryCode ?? null,
    countryChangesRemaining: countryChangesRemaining(bump.day, bump.count),
    countryChangesLimit: MAX_COUNTRY_CHANGES_PER_DAY,
    createdAt: user.createdAt,
  });
});

// GET /user/history
router.get("/user/history", requireAuth, async (req, res) => {
  const userId = req.userId!;
  const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10));
  const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit ?? "20"), 10)));
  const offset = (page - 1) * limit;
  const summaryView = String(req.query.view ?? "").toLowerCase() === "summary";

  const [rows, [{ total }]] = await Promise.all([
    db.select().from(vinLookupsTable)
      .where(activeUserLookupWhere(userId))
      .orderBy(desc(vinLookupsTable.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(vinLookupsTable).where(activeUserLookupWhere(userId)),
  ]);

  const items = rows.map((row) => {
    const rowObj = row as unknown as Record<string, unknown>;
    if (summaryView && rowObj.data) {
      rowObj.data = summarizeVinLookupData(rowObj.data);
    }
    return proxyVinRow(rowObj);
  });
  res.setHeader("Cache-Control", "private, no-store");
  res.json({ items, total, page, limit });
});

// GET /user/payments
router.get("/user/payments", requireAuth, async (req, res) => {
  const userId = req.userId!;
  const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10));
  const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit ?? "20"), 10)));
  const offset = (page - 1) * limit;

  const fulfilledForUser = recordedTransactionWhere(eq(paymentsTable.userId, userId));

  const [items, [{ total }]] = await Promise.all([
    db.select().from(paymentsTable)
      .where(fulfilledForUser)
      .orderBy(desc(paymentsTable.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(paymentsTable).where(fulfilledForUser),
  ]);

  res.setHeader("Cache-Control", "private, no-store");
  res.json({ items, total, page, limit });
});

// GET /user/stats
router.get("/user/stats", requireAuth, async (req, res) => {
  const userId = req.userId!;
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [totalChecks, totalSpent, checksThisMonth, completedPayments, paymentCurrencyRow] = await Promise.all([
    db.select({ total: count() }).from(vinLookupsTable).where(activeUserLookupWhere(userId)),
    db.select({ total: sum(paymentsTable.amount) }).from(paymentsTable)
      .where(recordedTransactionWhere(eq(paymentsTable.userId, userId))),
    db.select({ total: count() }).from(vinLookupsTable)
      .where(and(activeUserLookupWhere(userId), gte(vinLookupsTable.createdAt, monthStart))),
    db.select({ total: count() }).from(paymentsTable)
      .where(recordedTransactionWhere(eq(paymentsTable.userId, userId))),
    db.select({ currency: paymentsTable.currency }).from(paymentsTable)
      .where(recordedTransactionWhere(eq(paymentsTable.userId, userId)))
      .orderBy(desc(paymentsTable.createdAt))
      .limit(1),
  ]);

  res.setHeader("Cache-Control", "private, no-store");
  res.json({
    totalChecks: totalChecks[0]?.total ?? 0,
    totalSpent: Number(totalSpent[0]?.total ?? 0),
    checksThisMonth: checksThisMonth[0]?.total ?? 0,
    completedPayments: completedPayments[0]?.total ?? 0,
    paymentCurrency: paymentCurrencyRow[0]?.currency ?? "USD",
    recentChecks: [],
  });
});

// DELETE /user/vin/:id — user deletes their own failed lookup
router.delete("/user/vin/:id", requireAuth, async (req, res) => {
  const userId = req.userId!;
  const id = parseInt(String(req.params.id ?? ""), 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const [lookup] = await db.select().from(vinLookupsTable)
    .where(eq(vinLookupsTable.id, id))
    .limit(1);

  if (!lookup) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  if (lookup.userId !== userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  if (lookup.status !== "error") {
    res.status(400).json({ error: "Only failed lookups can be deleted" });
    return;
  }

  await db.delete(vinLookupsTable).where(eq(vinLookupsTable.id, id));
  res.status(204).send();
});

export default router;
