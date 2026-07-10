import { describe, expect, it } from "vitest";
import { parse } from "regexparam";

function firstMatch(routes: string[], path: string): string | null {
  for (const route of routes) {
    const { pattern } = parse(route);
    if (pattern.exec(path)) return route;
  }
  return null;
}

const ADMIN_ROUTES = [
  "/adminx",
  "/adminx/analytics",
  "/adminx/users/:userId",
  "/adminx/users",
  "/adminx/lookups",
  "/adminx/providers",
  "/adminx/pricing",
  "/adminx/settings",
  "/adminx/plugins",
  "/adminx/logs",
  "/adminx/coupons",
  "/adminx/emails",
  "/adminx/security",
  "/adminx/vin-catalog",
  "/adminx/pending-vin-checks/:id",
  "/adminx/pending-vin-checks",
  "/adminx/vin/:vin",
  "/adminx/transactions",
  "/adminx/announcements",
  "/adminx/:rest+",
];

describe("admin route matching", () => {
  it("maps bare /adminx to overview, not catch-all", () => {
    expect(firstMatch(ADMIN_ROUTES, "/adminx")).toBe("/adminx");
    expect(firstMatch(ADMIN_ROUTES, "/adminx/")).toBe("/adminx");
  });

  it("maps known subpaths to their routes", () => {
    expect(firstMatch(ADMIN_ROUTES, "/adminx/users")).toBe("/adminx/users");
    expect(firstMatch(ADMIN_ROUTES, "/adminx/pending-vin-checks")).toBe("/adminx/pending-vin-checks");
  });

  it("uses catch-all only for unknown subpaths", () => {
    expect(firstMatch(ADMIN_ROUTES, "/adminx/unknown-page")).toBe("/adminx/:rest+");
  });

  it("does not treat /adminx as a language home route", () => {
    const publicWinner = firstMatch(["/:lang/sign-in/*?", "/:lang", "/adminx"], "/adminx");
    expect(publicWinner).toBe("/adminx");
  });
});
