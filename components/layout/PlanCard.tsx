'use client';

import { useSubscriptionContext } from '@/context/SubscriptionContext';
import { Icon } from './Icon';

function fmt(iso: string | null) {
  if (!iso) return '';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// storagePercent is optional: the API has no storage figure yet, so the bar only
// renders once a caller supplies one.
export function PlanCard({ storagePercent }: { storagePercent?: number }) {
  const { subscription } = useSubscriptionContext();
  if (!subscription) return null;

  const detail =
    storagePercent !== undefined ? `${storagePercent}% of storage used`
    : subscription.status === 'trialing' ? `Trial ends ${fmt(subscription.trialEndsAt)}`
    : subscription.status === 'past_due' ? 'Payment past due'
    : subscription.status === 'canceled' ? 'Subscription canceled'
    : subscription.cancelAtPeriodEnd ? `Ends ${fmt(subscription.currentPeriodEnd)}`
    : `Renews ${fmt(subscription.currentPeriodEnd)}`;

  return (
    <div className="absolute inset-x-4 bottom-6 rounded-xl border border-outline-variant/60 bg-surface p-4">
      <div className="flex h-5 items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-on-surface-variant">
          Plan: {subscription.planTier}
        </span>
        <Icon name="auto_awesome" size={16} filled className="text-secondary" />
      </div>
      {storagePercent !== undefined && (
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-outline-variant/70">
          <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, Math.max(0, storagePercent))}%` }} />
        </div>
      )}
      <p className="mt-2 text-[10px] leading-[15px] text-on-surface-variant">{detail}</p>
    </div>
  );
}
