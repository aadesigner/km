import { describe, expect, it } from "vitest";
import { db, usersTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import {
  authSessionUserSelect,
  oauthUserSelect,
  toPublicUser,
} from "./authUserSelect.js";
import { signJwt, verifyJwt } from "./auth.js";

const hasDatabase = Boolean(process.env.DATABASE_URL);
const hasJwtSecret = Boolean(process.env.JWT_SECRET);

describe.skipIf(!hasDatabase)("authUserSelect integration", () => {
  it("loads session users without optional presence columns", async () => {
    const [row] = await db
      .select(authSessionUserSelect)
      .from(usersTable)
      .limit(1);

    expect(row).toBeDefined();
    expect(row!.id).toBeTruthy();
    expect(row!.email).toMatch(/@/);
    expect(toPublicUser(row!)).toMatchObject({
      id: row!.id,
      email: row!.email,
      hasPassword: Boolean(row!.passwordHash),
    });
  });

  it("loads OAuth user rows with provider ids", async () => {
    const [row] = await db
      .select(oauthUserSelect)
      .from(usersTable)
      .where(
        sql`${usersTable.googleId} is not null or ${usersTable.facebookId} is not null or ${usersTable.linkedinId} is not null`,
      )
      .limit(1);

    if (!row) {
      // No social-linked accounts in this DB — query shape still valid.
      const [any] = await db.select(oauthUserSelect).from(usersTable).limit(1);
      expect(any).toBeDefined();
      return;
    }

    expect(row.authProvider).toBeTruthy();
  });

  it("supports login lookup by email with the same column set", async () => {
    const [seed] = await db
      .select({ email: usersTable.email })
      .from(usersTable)
      .where(sql`${usersTable.passwordHash} is not null`)
      .limit(1);

    expect(seed?.email).toBeTruthy();

    const [user] = await db
      .select(authSessionUserSelect)
      .from(usersTable)
      .where(eq(usersTable.email, seed!.email))
      .limit(1);

    expect(user?.email).toBe(seed!.email);
  });
});

describe.skipIf(!hasDatabase || !hasJwtSecret)("auth session JWT integration", () => {
  it("signs and verifies tokens used by login/register/OAuth", async () => {
    const [row] = await db.select({ id: usersTable.id }).from(usersTable).limit(1);
    expect(row?.id).toBeTruthy();

    const token = await signJwt(row!.id, 30);
    const payload = await verifyJwt(token);
    expect(payload.sub).toBe(row!.id);
    expect(payload.jti).toBeTruthy();
  });
});
