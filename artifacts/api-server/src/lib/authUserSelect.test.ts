import { describe, expect, it } from "vitest";
import { toPublicUser, type AuthSessionUser } from "./authPublicUser.js";
import { authSessionUserSelect, oauthUserSelect } from "./authUserSelect.js";

describe("authPublicUser", () => {
  const baseUser: AuthSessionUser = {
    id: "user-1",
    email: "user@example.com",
    name: "Test User",
    avatarUrl: "https://cdn.example/avatar.png",
    passwordHash: "$2b$12$hash",
    isAdmin: true,
    isBanned: false,
    createdAt: new Date("2024-01-15T10:00:00.000Z"),
  };

  it("maps session user to the public API shape used by login/register/me", () => {
    expect(toPublicUser(baseUser)).toEqual({
      id: "user-1",
      email: "user@example.com",
      name: "Test User",
      avatarUrl: "https://cdn.example/avatar.png",
      isAdmin: true,
      isBanned: false,
      hasPassword: true,
      createdAt: baseUser.createdAt,
    });
  });

  it("exposes hasPassword false for OAuth-only accounts", () => {
    expect(toPublicUser({ ...baseUser, passwordHash: null }).hasPassword).toBe(false);
  });
});

describe("authUserSelect", () => {
  it("includes every column required for password login and session refresh", () => {
    const keys = Object.keys(authSessionUserSelect).sort();
    expect(keys).toEqual([
      "avatarUrl",
      "createdAt",
      "email",
      "id",
      "isAdmin",
      "isBanned",
      "name",
      "passwordHash",
    ]);
  });

  it("extends session select with OAuth linking columns", () => {
    const keys = Object.keys(oauthUserSelect).sort();
    expect(keys).toEqual([
      "authProvider",
      "avatarUrl",
      "createdAt",
      "email",
      "facebookId",
      "googleId",
      "id",
      "isAdmin",
      "isBanned",
      "linkedinId",
      "name",
      "passwordHash",
    ]);
  });

  it("does not reference presence-only columns", () => {
    const keys = [
      ...Object.keys(authSessionUserSelect),
      ...Object.keys(oauthUserSelect),
    ];
    expect(keys.some((key) => key.includes("lastSeen") || key.includes("last_seen"))).toBe(false);
  });
});
