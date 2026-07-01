import { describe, expect, it } from "vitest";
import { validatePassword } from "./passwordPolicy.js";

describe("validatePassword", () => {
  it("rejects short passwords", () => {
    const r = validatePassword("ab1");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("PASSWORD_TOO_SHORT");
  });

  it("rejects missing letter", () => {
    const r = validatePassword("12345678");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("PASSWORD_NEEDS_LETTER");
  });

  it("rejects missing number", () => {
    const r = validatePassword("password");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("PASSWORD_NEEDS_NUMBER");
  });

  it("accepts strong enough passwords without requiring uppercase", () => {
    expect(validatePassword("password1").ok).toBe(true);
    expect(validatePassword("PASSWORD1").ok).toBe(true);
    expect(validatePassword("MySecure9").ok).toBe(true);
  });
});
