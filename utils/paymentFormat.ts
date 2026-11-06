// utils/paymentFormat.ts

export function toNumber(value: number | string | null | undefined): number {
  const n = typeof value === "string" ? parseFloat(value) : (value ?? 0);
  return typeof n === "number" && Number.isFinite(n) ? n : 0;
}

/** "5.000" becomes "5", "2.500" becomes "2.5". */
export function formatQty(value: number | string | null | undefined): string {
  return String(parseFloat(toNumber(value).toFixed(3)));
}