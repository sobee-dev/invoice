// utils/subscription.ts
import type { SubscriptionInfo, SubscriptionStatus } from "@/services/billing";

export const STATUS_LABEL: Record<SubscriptionStatus, string> = {
  trialing: "Trial",
  active: "Active",
  past_due: "Payment due",
  canceled: "Canceled",
};

// The date the current access window closes: trial end during a trial,
// otherwise the end of the paid period.
export function subscriptionEndIso(sub: SubscriptionInfo): string | null {
  return sub.plan === "trial" ? sub.trialEndsAt : sub.currentPeriodEnd;
}

// Whole days from now, rounded up. Negative once the date has passed.
export function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return null;
  return Math.ceil((ms - Date.now()) / 86_400_000);
}

export function plural(n: number, word: string): string {
  return n === 1 ? word : `${word}s`;
}