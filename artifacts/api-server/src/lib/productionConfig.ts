/** Refuse to start in production without API client guard configured. */
export function assertProductionConfig(): void {
  if (process.env.NODE_ENV !== "production") return;
  if (!process.env.CLIENT_GUARD_TOKEN?.trim()) {
    throw new Error("CLIENT_GUARD_TOKEN is required in production");
  }
}

export function exitOnProductionConfigFailure(): void {
  try {
    assertProductionConfig();
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  }
}
