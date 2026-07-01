import { describe, expect, it } from "vitest";
import { getPasswordStrength, isPasswordStrongEnough } from "./password-policy";

describe("password-policy", () => {
  it("rejects weak passwords", () => {
    expect(isPasswordStrongEnough("password")).toBe(false);
    expect(isPasswordStrongEnough("12345678")).toBe(false);
    expect(isPasswordStrongEnough("abcdefgh")).toBe(false);
  });

  it("accepts passwords meeting policy without requiring uppercase", () => {
    expect(isPasswordStrongEnough("password1")).toBe(true);
    expect(isPasswordStrongEnough("PASSWORD1")).toBe(true);
    expect(isPasswordStrongEnough("Password1")).toBe(true);
  });

  it("scores strength progressively", () => {
    expect(getPasswordStrength("")).toBe(0);
    expect(getPasswordStrength("password1")).toBeGreaterThanOrEqual(3);
  });
});
