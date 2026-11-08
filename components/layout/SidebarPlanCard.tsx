// components/layout/SidebarPlanCard.tsx
"use client";

import Link from "next/link";
import { Icon } from "@/components/layout/Icon";
import { useSubscriptionContext } from "@/context/SubscriptionContext";
import { TRIAL_DAYS, usageLine } from "@/lib/plan";
import { ROUTES } from "@/lib/routes";
import { daysUntil, plural, subscriptionEndIso } from "@/utils/subscription";

export function SidebarPlanCard({ onNavigate }: { onNavigate?: () => void }) {
  const { subscription, isLoading } = useSubscriptionContext();

  if (isLoading && !subscription) {
    return <div className="h-[92px] max-sm:h-[76px] animate-pulse rounded-xl border border-outline-variant bg-surface-container-low" />;
  }

  // The status call failed. Still give the owner a way into billing.
  if (!subscription) {
    return (
      <Link
        href={ROUTES.billing}
        onClick={onNavigate}
        className="block rounded-xl border border-outline-variant bg-white p-4 text-xs font-semibold text-primary hover:bg-surface-container-low max-sm:p-3 max-sm:text-[11px]"
      >
        Manage subscription
      </Link>
    );
  }

  const free = subscription.plan === "free";
  const trial = subscription.plan === "trial";
  const days = daysUntil(subscriptionEndIso(subscription));
  const daysLeft = days === null ? null : Math.max(0, days);
  const invoiceLimit = subscription.limits.invoices;

  let caption: string;
  let progress = 100;

  if (subscription.checkoutPending) {
    caption = "Confirming your payment";
  } else if (free) {
    caption = usageLine(subscription, "invoices") ?? "Free plan";
    progress = invoiceLimit ? Math.min(100, (subscription.usage.invoices / invoiceLimit) * 100) : 0;
  } else if (trial) {
    caption = daysLeft === null ? "Trial" : `Trial ends in ${daysLeft} ${plural(daysLeft, "day")}`;
    progress = daysLeft === null ? 100 : Math.min(100, (daysLeft / TRIAL_DAYS) * 100);
  } else if (daysLeft === null) {
    caption = "Active";
  } else if (subscription.cancelAtPeriodEnd) {
    caption = `Ends in ${daysLeft} ${plural(daysLeft, "day")}`;
    progress = Math.min(100, (daysLeft / 30) * 100);
  } else {
    caption = `Renews in ${daysLeft} ${plural(daysLeft, "day")}`;
    progress = Math.min(100, (daysLeft / 30) * 100);
  }

  const full = free && progress >= 100;

  return (
    <Link
      href={ROUTES.billing}
      onClick={onNavigate}
      className={`block rounded-xl border bg-white p-4 max-sm:p-3 transition-colors hover:bg-surface-container-low ${
        full ? "border-error" : "border-outline-variant"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-on-surface-variant max-sm:text-[10px]">
          Plan: {subscription.planName}
        </span>
        <Icon name="auto_awesome" size={16} mobileSize={14} filled className="text-secondary" />
      </div>
      <div className="mt-3 max-sm:mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-container-high">
        <div className={`h-full rounded-full ${full ? "bg-error" : "bg-primary"}`} style={{ width: `${progress}%` }} />
      </div>
      <p className={`mt-2 text-[11px] max-sm:text-[10px] ${full ? "font-semibold text-error" : "text-on-surface-variant"}`}>{caption}</p>
      {(free || trial) && <p className="mt-1 text-[11px] font-bold text-primary max-sm:text-[10px]">See plans</p>}
    </Link>
  );
}