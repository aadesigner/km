export type PrefixRule = { prefix: string; model: string; body?: string; drive?: string };

/** Pre-sort once at module load — avoids per-decode sorting cost. */
export function compilePrefixRules(rules: PrefixRule[]): PrefixRule[] {
  return [...rules].sort((a, b) => b.prefix.length - a.prefix.length);
}

export function matchLongestPrefix(vin: string, rules: readonly PrefixRule[]): PrefixRule | null {
  for (const rule of rules) {
    if (vin.startsWith(rule.prefix)) return rule;
  }
  return null;
}
