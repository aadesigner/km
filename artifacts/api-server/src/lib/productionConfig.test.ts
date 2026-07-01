import { afterEach, describe, expect, it, vi } from "vitest";
import { assertProductionConfig, exitOnProductionConfigFailure } from "./productionConfig.js";

describe("assertProductionConfig", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("no-ops outside production", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(() => assertProductionConfig()).not.toThrow();
  });

  it("throws in production without CLIENT_GUARD_TOKEN", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("CLIENT_GUARD_TOKEN", "");
    expect(() => assertProductionConfig()).toThrow(/CLIENT_GUARD_TOKEN/);
  });

  it("exitOnProductionConfigFailure calls process.exit when misconfigured", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("CLIENT_GUARD_TOKEN", "");
    const exitSpy = vi.spyOn(process, "exit").mockImplementation((() => undefined) as typeof process.exit);
    exitOnProductionConfigFailure();
    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
  });

  it("passes in production with CLIENT_GUARD_TOKEN", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("CLIENT_GUARD_TOKEN", "secret-token");
    expect(() => assertProductionConfig()).not.toThrow();
  });
});
