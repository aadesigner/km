export function isPlausibleModel(model: string | null, vin: string): boolean {
  if (!model) return false;
  const m = model.trim();
  if (m.length < 2 || m.length > 48) return false;
  const compact = m.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  if (compact.length >= 10 && /^[A-Z0-9]+$/.test(compact) && !/[AEIOU]/.test(compact)) return false;
  if (compact.length >= 6 && vin.toUpperCase().includes(compact)) return false;
  return true;
}

export function isPlausibleMake(make: string | null, vin: string): boolean {
  if (!make) return false;
  const m = make.trim();
  if (m.length < 2 || m.length > 32) return false;
  const compact = m.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  if (compact.length >= 8 && /^[A-Z0-9]+$/.test(compact) && !/[AEIOU]/.test(compact)) return false;
  if (compact.length >= 6 && vin.toUpperCase().includes(compact)) return false;
  return true;
}
