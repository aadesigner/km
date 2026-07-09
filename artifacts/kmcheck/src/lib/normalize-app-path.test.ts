import { describe, expect, it } from "vitest";
import { normalizeAppPath, splitRouterLocation } from "./normalize-app-path";

describe("normalizeAppPath", () => {
  it("strips trailing slashes", () => {
    expect(normalizeAppPath("/adminx/users/")).toBe("/adminx/users");
    expect(normalizeAppPath("/adminx/")).toBe("/adminx");
  });

  it("collapses repeated slashes", () => {
    expect(normalizeAppPath("/adminx//users")).toBe("/adminx/users");
  });

  it("leaves root and normalized paths unchanged", () => {
    expect(normalizeAppPath("/")).toBe("/");
    expect(normalizeAppPath("/adminx/users")).toBe("/adminx/users");
  });
});

describe("splitRouterLocation", () => {
  it("preserves query strings and hashes", () => {
    expect(splitRouterLocation("/adminx/users/?tab=1#x")).toEqual({
      pathname: "/adminx/users/",
      suffix: "?tab=1#x",
    });
  });
});
