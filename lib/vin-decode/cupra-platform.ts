/**
 * Cupra platform codes on VSS/VS7 (shared WMI with SEAT).
 * Keep lightweight — model resolution stays in global-brands.ts.
 */

const CUPRA_PLATFORM: Record<string, string> = {
  VSSZZZKM: "KM", // Formentor
  VSSZZZK1: "K1", // Born
  VSSZZZKP: "MEB", // Born
  VSSZZZKN: "KL", // León
  VS7ZZZKM: "KM", // Terramar / Formentor plant
  VS7ZZZKN: "KL",
};

export function matchCupraPlatform(vin: string): string | null {
  const u = vin.toUpperCase();
  for (const len of [8, 7]) {
    const hit = CUPRA_PLATFORM[u.slice(0, len)];
    if (hit) return hit;
  }
  return null;
}
