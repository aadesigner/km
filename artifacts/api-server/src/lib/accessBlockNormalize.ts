export function normalizeBlockedIp(raw: string): string | null {
  const trimmed = raw.trim().replace(/^::ffff:/i, "");
  if (!trimmed || trimmed === "unknown") return null;
  const ipv4 = /^(?:\d{1,3}\.){3}\d{1,3}$/;
  const ipv6 = /^[0-9a-f:]+$/i;
  if (!ipv4.test(trimmed) && !ipv6.test(trimmed)) return null;
  return trimmed;
}

export function normalizeBlockedCountry(raw: string): string | null {
  const code = raw.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(code) || code === "XX" || code === "T1") return null;
  return code;
}
