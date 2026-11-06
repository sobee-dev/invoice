// lib/planPricing.ts
//
// Public copy of the prices in billing/plans.py, for pages that cannot call the
// authenticated plans endpoint (the landing page). If MONTHLY_PRICE_NGN,
// INTERVAL_MONTHS or INTERVAL_DISCOUNT_PERCENT change in the backend, change them here too.

export type PublicTier = "business" | "enterprise";
export type PublicInterval = "monthly" | "biannually" | "annually";

export const MONTHLY_PRICE_NGN: Record<PublicTier, number> = {
  business: 9000,
  enterprise: 29000,
};

export const INTERVALS: { key: PublicInterval; label: string; months: number; discount: number }[] = [
  { key: "monthly", label: "Monthly", months: 1, discount: 0 },
  { key: "biannually", label: "6 months", months: 6, discount: 10 },
  { key: "annually", label: "Yearly", months: 12, discount: 20 },
];

export const fmtNgn = (n: number) => `₦${Math.round(n).toLocaleString("en-NG")}`;

// Same math as get_price_ngn: monthly price times the months, less the discount.
export function priceFor(tier: PublicTier, interval: PublicInterval) {
  const iv = INTERVALS.find((i) => i.key === interval)!;
  const full = MONTHLY_PRICE_NGN[tier] * iv.months;
  const total = Math.round((full * (100 - iv.discount)) / 100);
  return {
    total,
    perMonth: Math.round(total / iv.months),
    saving: full - total,
    months: iv.months,
    discount: iv.discount,
  };
}