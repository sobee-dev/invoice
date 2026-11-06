// lib/planDisplay.ts
import type { PlanLimits, PlanOption, SubscriptionInfo } from "@/services/billing";

// For numbers the app computes itself, such as invoice totals. Plan prices never go through this:
// the backend sends them as ready-made labels (priceLabel, monthlyEquivalentLabel, startingPriceLabel).
export const fmtNgn = (n: number) => `₦${Math.round(n).toLocaleString("en-NG")}`;

export function planBullets(plan: PlanOption): string[] {
  const l = plan.limits;
  const out: string[] = [];

  out.push(l.invoices === null ? "Unlimited invoices" : `${l.invoices} invoices a month`);
  out.push(l.products === null ? "Unlimited products" : `Up to ${l.products} products`);
  out.push(l.staff === null ? "Unlimited staff accounts" : l.staff === 0 ? "No staff accounts" : `Up to ${l.staff} staff accounts`);
  if (l.branches === null) out.push("Multiple branches");
  else if (l.branches > 1) out.push(`${l.branches} branches`);

  const templates = plan.features?.templates?.length ?? 1;
  out.push(templates > 1 ? "All invoice templates" : "Classic template only");
  if (plan.tier !== "free") out.push("No ads and no BillBuzz footer on documents");
  return out;
}

const more = (cur: number | null, next: number | null) =>
  cur !== null && (next === null || next > cur);

// What changes when moving from the current plan to the next one.
export function upgradeLines(sub: SubscriptionInfo, next: PlanOption): string[] {
  const cur: PlanLimits = sub.limits;
  const n = next.limits;
  const out: string[] = [];

  if (more(cur.invoices, n.invoices))
    out.push(n.invoices === null ? `Unlimited invoices (now ${cur.invoices} a month)` : `${n.invoices} invoices a month (now ${cur.invoices})`);
  if (more(cur.products, n.products))
    out.push(n.products === null ? `Unlimited products (now ${cur.products})` : `Up to ${n.products} products (now ${cur.products})`);
  if (more(cur.staff, n.staff))
    out.push(cur.staff === 0 ? "Staff accounts with their own sign in" : n.staff === null ? "Unlimited staff accounts" : `Up to ${n.staff} staff accounts`);
  if (cur.branches !== null && (n.branches === null || n.branches > cur.branches))
    out.push("Multiple branches");
  if (sub.plan === "free") out.push("All invoice templates, no ads and no BillBuzz footer");
  return out;
}

// "₦6,000 / month", the lowest monthly equivalent for a paid plan. Comes from the backend.
export function startingPriceLabel(plan: PlanOption): string | null {
  return plan.startingPriceLabel ?? null;
}