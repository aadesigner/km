import { describe, expect, it } from "vitest";
import { getPasswordStrength, isPasswordStrongEnough } from "./password-policy";

describe("password-policy", () => {
  it("rejects weak passwords", () => {
    expect(isPasswordStrongEnough("pass")).toBe(false);
    expect(isPasswordStrongEnough("123456")).toBe(false);
    expect(isPasswordStrongEnough("abcdef")).toBe(false);
  });

  it("accepts medium passwords (6+ chars, letter and number)", () => {
    expect(isPasswordStrongEnough("pass12")).toBe(true);
    expect(isPasswordStrongEnough("abc123")).toBe(true);
    expect(isPasswordStrongEnough("PASSWORD1")).toBe(true);
  });

  it("scores strength progressively", () => {
    expect(getPasswordStrength("")).toBe(0);
    expect(getPasswordStrength("pass12")).toBeGreaterThanOrEqual(3);
  });
});
