/** Volkswagen Group passenger / commercial WMIs (EU ZZZ-format and US). */
export function isVagWmi(wmi: string): boolean {
  const w = wmi.toUpperCase().slice(0, 3);
  return w.startsWith("WVW") || w.startsWith("WVG") || w.startsWith("WV1") || w.startsWith("WV2");
}

/** Normalize alternate VAG plant WMIs so shared WVW prefix tables apply. */
export function normalizeVagVinForPremium(vin: string): string {
  const upper = vin.toUpperCase();
  if (upper.startsWith("WVG")) return `WVW${upper.slice(3)}`;
  return upper;
}
