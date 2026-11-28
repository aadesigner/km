export type CreditPackId = "pack3" | "pack5" | "pack10";

export interface CreditPack {
  id: CreditPackId;
  credits: number;
  unitPrice: number;
  totalPrice: number;
  currency: "EUR";
}

function pack(id: CreditPackId, credits: number, unitPrice: number): CreditPack {
  return {
    id,
    credits,
    unitPrice,
    totalPrice: Math.round(unitPrice * credits * 100) / 100,
    currency: "EUR",
  };
}

/** Display order for pricing carousel (lowest volume → highest). */
export const CREDIT_PACK_IDS: CreditPackId[] = ["pack3", "pack5", "pack10"];

export const CREDIT_PACKS: Record<CreditPackId, CreditPack> = {
  pack3: pack("pack3", 3, 13.99),
  pack5: pack("pack5", 5, 12.99),
  pack10: pack("pack10", 10, 9.99),
};

export function isCreditPackId(value: unknown): value is CreditPackId {
  return typeof value === "string" && (CREDIT_PACK_IDS as readonly string[]).includes(value);
}

export function getCreditPack(packId: CreditPackId): CreditPack {
  return CREDIT_PACKS[packId];
}

/** PayPal / POK amount string (always 2 decimal places). */
export function creditPackAmountValue(pack: CreditPack): string {
  return pack.totalPrice.toFixed(2);
}
