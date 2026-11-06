// components/billing/PlanSummaryCard.tsx
"use client";

import { Badge, BadgeTone } from "@/components/ui/Badge";
import { SectionCard } from "@/components/ui/SectionCard";
import { nextTier } from "@/lib/plan";
import { planBullets, startingPriceLabel, upgradeLines } from "@/lib/planDisplay";
import { PlanOption, ResourceKey, SubscriptionInfo } from "@/services/billing";
import { fmtLongDate } from "@/utils/formatDate";
import { STATUS_LABEL } from "@/utils/subscription";

const ROWS: { key: ResourceKey; label: string }[] = [
  { key: "invoices", label: "Invoices this month" },
  { key: "products", label: "Products" },
  { key: "staff", label: "Staff accounts" },
];

const STATUS_TONE: Record<SubscriptionInfo["status"], BadgeTone> = {
  active: "green",
  trialing: "blue",
  past_due: "orange",
  canceled: "red",
};

const date = (iso: string | null) => (iso ? fmtLongDate(new Date(iso)) : null);

function UsageRow({ sub, k, label }: { sub: SubscriptionInfo; k: ResourceKey; label: string }) {
  const used = sub.usage[k];
  const limit = sub.limits[k];

  if (limit === 0) {
    return (
      <li className="flex items-center justify-between text-body-md">
        <span className="text-on-surface">{label}</span>
        <span className="text-on-surface-variant">Not included</span>
      </li>
    );
  }

  const pct = limit === null ? 0 : Math.min(100, Math.round((used / limit) * 100));
  const full = limit !== null && used >= limit;

  return (
    <li>
      <div className="flex items-center justify-between text-body-md">
        <span className="text-on-surface">{label}</span>
        <span className={full ? "font-bold text-error" : "text-on-surface-variant"}>
          {limit === null ? `${used} used, unlimited` : `${used} of ${limit}`}
        </span>
      </div>
      {limit !== null && (
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-container">
          <div className={`h-full rounded-full ${full ? "bg-error" : "bg-primary-container"}`} style={{ width: `${pct}%` }} />
        </div>
      )}
    </li>
  );
}

export function PlanSummaryCard({ subscription: sub, plans }: { subscription: SubscriptionInfo; plans: PlanOption[] | null }) {
  const tier = nextTier(sub.plan);
  const next = tier ? plans?.find((p) => p.tier === tier) ?? null : null;
  const from = next ? startingPriceLabel(next) : null;
  const lines = next ? (sub.plan === "trial" ? planBullets(next).slice(0, 5) : upgradeLines(sub, next)) : [];

  const paidPlan = sub.plan === "business" || sub.plan === "enterprise";
  const renewal =
    sub.plan === "trial" && sub.trialEndsAt
      ? `Trial ends on ${date(sub.trialEndsAt)}`
      : sub.currentPeriodEnd && paidPlan
        ? sub.billingMethod === "one_off"
          ? `Paid through ${date(sub.currentPeriodEnd)}. Pay again before then to add more time.`
          : sub.cancelAtPeriodEnd
            ? `Ends on ${date(sub.currentPeriodEnd)}. It will not renew.`
            : `Renews on ${date(sub.currentPeriodEnd)}`
        : null;

  return (
    <SectionCard
      title="Current plan"
      action={<Badge tone={STATUS_TONE[sub.status]}>{STATUS_LABEL[sub.status]}</Badge>}
    >
      <p className="text-4xl font-bold text-primary">
        {sub.planName}
        {sub.billingIntervalLabel && (
          <span className="ml-3 text-base font-semibold text-on-surface-variant">{sub.billingIntervalLabel}</span>
        )}
      </p>
      {renewal && <p className="mt-1 text-body-md text-on-surface-variant">{renewal}</p>}
      {sub.plan === "trial" && sub.daysLeftInTrial !== null && (
        <p className="mt-1 text-body-md font-semibold text-primary">
          {sub.daysLeftInTrial === 1 ? "1 day" : `${sub.daysLeftInTrial} days`} left
        </p>
      )}

      {sub.checkoutPending && (
        <p role="status" className="mt-4 rounded-lg bg-surface-container-low p-3 text-body-md text-on-surface">
          A payment is waiting to be confirmed. Your plan will update as soon as it clears.
        </p>
      )}

      <ul className="mt-5 space-y-4">
        {ROWS.map((r) => <UsageRow key={r.key} sub={sub} k={r.key} label={r.label} />)}
      </ul>
      {sub.limits.invoices !== null && sub.invoicesResetAt && (
        <p className="mt-3 text-xs text-on-surface-variant">Your invoice count resets on {date(sub.invoicesResetAt)}.</p>
      )}

      {next && lines.length > 0 && (
        <div className="mt-6 rounded-lg bg-primary-fixed/40 p-4">
          <p className="text-sm font-bold text-primary">
            {sub.plan === "trial" ? `Keep these on ${next.name} after your trial` : `Next step: ${next.name}`}
            {from !== null && <span className="ml-2 font-semibold text-on-surface-variant">from {from}</span>}
          </p>
          <ul className="mt-2 space-y-1 text-body-md text-on-surface">
            {lines.map((l) => <li key={l}>{l}</li>)}
          </ul>
          <a href="#plans" className="mt-3 inline-block text-sm font-bold text-primary underline">
            Compare plans
          </a>
        </div>
      )}
    </SectionCard>
  );
}