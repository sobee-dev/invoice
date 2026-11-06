// lib/customers.ts
import type { PaymentMethodPreference } from "@/services/customers";

export const PAYMENT_OPTIONS: { key: string; label: string }[] = [
  { key: "cash", label: "Cash" },
  { key: "bank_transfer", label: "Bank transfer" },
  { key: "card", label: "Card" },
  { key: "check", label: "Check" },
];

export function paymentLabel(pref: PaymentMethodPreference): string {
  return PAYMENT_OPTIONS.find((o) => o.key === pref)?.label ?? String(pref);
}

// The same suggestions the mobile form offers.
export const TAG_SUGGESTIONS = [
  "Enterprise", "High-Priority", "SMB", "Retail", "Corporate", "Logistics", "VIP", "New Client", "Partner",
];