// components/billing/PlanBanners.tsx
"use client";

import Link from "next/link";
import { Icon } from "@/components/layout/Icon";
import { useSubscriptionContext } from "@/context/SubscriptionContext";
import { isFreePlan, trialLevel, TrialLevel, usageLine } from "@/lib/plan";
import { ROUTES } from "@/lib/routes";

const TONE: Record<TrialLevel, string> = {
  soft: "border-outline-variant bg-primary-fixed text-primary",
  strong: "border-secondary/40 bg-tertiary-fixed text-on-surface",
  final: "border-error/40 bg-error-container text-error",
};

function trialText(level: TrialLevel, days: number): string {
  const label = days === 1 ? "1 day" : `${days} days`;
  if (level === "final") return "Your trial ends within a day. After that your account moves to the Free plan, with limits on invoices, products and staff.";
  if (level === "strong") return `Only ${label} left in your trial. After that your account moves to the Free plan.`;
  return `${label} left in your free trial. Everything in Business is unlocked until it ends.`;
}

// Mounted once in AppShell, so it sits above every owner page.
// Soft above 5 days left, strong at 5 or fewer, final at 1 or fewer.
export function TrialBanner() {
  const { subscription } = useSubscriptionContext();
  const level = trialLevel(subscription);
  if (!subscription || !level) return null;

  return (
    <div role="status" className={`mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl  px-5 py-3 max-sm:mb-4 max-sm:gap-2 max-sm:px-3 max-sm:py-2 ${TONE[level]}`}>
      <span className="flex items-center gap-3 text-body-md font-medium max-sm:gap-2 max-sm:text-xs">
        <Icon name={level === "final" ? "hourglass_bottom" : "schedule"} size={20} />
        {trialText(level, subscription.daysLeftInTrial ?? 0)}
      </span>
      <Link href={ROUTES.billing} className="text-sm font-bold underline max-sm:text-xs">
        See plans
      </Link>
    </div>
  );
}

// Dashboard header area, Free only.
export function UsageBanner() {
  const { subscription, canCreate } = useSubscriptionContext();
  if (!subscription || !isFreePlan(subscription)) return null;

  const atLimit = !canCreate("invoices") || !canCreate("products");

  return (
    <div
      role="status"
      className={`mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border px-5 py-3 max-sm:mt-3 max-sm:gap-2 max-sm:px-3 max-sm:py-2 ${
        atLimit ? "border-error/40 bg-error-container text-error" : "border-outline-variant bg-white text-on-surface"
      }`}
    >
      <span className="flex flex-wrap items-center gap-x-6 gap-y-1 text-body-md max-sm:gap-x-3 max-sm:text-xs">
        <span className="font-semibold">Free plan</span>
        <span>{usageLine(subscription, "invoices")}</span>
        <span>{usageLine(subscription, "products")}</span>
      </span>
      <Link href={ROUTES.billing} className="text-sm font-bold text-primary underline max-sm:text-xs">
        Upgrade
      </Link>
    </div>
  );
}