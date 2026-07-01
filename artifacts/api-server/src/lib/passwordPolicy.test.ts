import { describe, expect, it } from "vitest";
import { validatePassword } from "./passwordPolicy.js";

describe("validatePassword", () => {
  it("rejects short passwords", () => {
    const r = validatePassword("Ab1");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("PASSWORD_TOO_SHORT");
  });

  it("rejects missing lowercase", () => {
    const r = validatePassword("PASSWORD1");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("PASSWORD_NEEDS_LOWERCASE");
  });

  it("rejects missing uppercase", () => {
    const r = validatePassword("password1");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("PASSWORD_NEEDS_UPPERCASE");
  });

  it("rejects missing number", () => {
    const r = validatePassword("Passworddd");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("PASSWORD_NEEDS_NUMBER");
  });

  it("accepts strong enough passwords", () => {
    expect(validatePassword("Password1").ok).toBe(true);
    expect(validatePassword("MySecure9").ok).toBe(true);
  });
});
