import { describe, expect, it, beforeAll, afterAll } from "vitest";
import type { Server } from "node:http";
import app from "../app.js";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { signJwt, COOKIE_NAME } from "../lib/auth.js";

const hasDatabase = Boolean(process.env.DATABASE_URL);
const hasJwtSecret = Boolean(process.env.JWT_SECRET);

describe.skipIf(!hasDatabase || !hasJwtSecret)("auth routes integration", () => {
  let server: Server;
  let baseUrl: string;
  const browserHeaders = {
    Origin: "http://127.0.0.1:8090",
    "Sec-Fetch-Site": "same-origin",
  };

  beforeAll(async () => {
    process.env.CLIENT_GUARD_ENFORCE = "false";
    await new Promise<void>((resolve) => {
      server = app.listen(0, "127.0.0.1", () => resolve());
    });
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Failed to bind test server");
    baseUrl = `http://127.0.0.1:${address.port}/api`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  });

  it("GET /auth/me returns null without a session cookie", async () => {
    const res = await fetch(`${baseUrl}/auth/me`, { headers: browserHeaders });
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ user: null });
  });

  it("POST /auth/login rejects invalid credentials with 401", async () => {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: "POST",
      headers: { ...browserHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({ email: "missing-user@example.com", password: "WrongPass123!" }),
    });
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toMatchObject({ error: expect.any(String) });
  });

  it("POST /auth/register validates required fields with 400", async () => {
    const res = await fetch(`${baseUrl}/auth/register`, {
      method: "POST",
      headers: { ...browserHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({ email: "not-an-email", password: "short" }),
    });
    expect(res.status).toBe(400);
  });

  it("GET /auth/me returns the signed-in user for a valid session cookie", async () => {
    const [row] = await db
      .select({ id: usersTable.id, email: usersTable.email, isAdmin: usersTable.isAdmin })
      .from(usersTable)
      .limit(1);
    expect(row?.id).toBeTruthy();

    const token = await signJwt(row!.id, 30);
    const res = await fetch(`${baseUrl}/auth/me`, {
      headers: {
        ...browserHeaders,
        Cookie: `${COOKIE_NAME}=${token}`,
      },
    });
    expect(res.status).toBe(200);
    const body = await res.json() as { user: { id: string; email: string; isAdmin: boolean; hasPassword: boolean } | null; sessionExpiresAt?: string };
    expect(body.user).toMatchObject({
      id: row!.id,
      email: row!.email,
      isAdmin: row!.isAdmin,
    });
    expect(typeof body.user?.hasPassword).toBe("boolean");
    expect(body.sessionExpiresAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("GET /auth/google responds without a server error when OAuth is disabled", async () => {
    const res = await fetch(`${baseUrl}/auth/google?lang=en`, {
      redirect: "manual",
      headers: browserHeaders,
    });
    expect([302, 503]).toContain(res.status);
    expect(res.status).not.toBe(500);
  });
});
