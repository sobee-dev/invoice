// components/ads/AdBanner.tsx
"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useSubscriptionContext } from "@/context/SubscriptionContext";
import { showAds } from "@/lib/plan";
import { ROUTES } from "@/lib/routes";

// The three places ads are allowed. Never add one to an editor or a document detail page.
export type AdPlacement = "dashboard-footer" | "products-list" | "docs-list";

// Placeholder until a real ad SDK is wired in. It renders nothing unless the plan is known to be Free.
export function AdBanner({ placement, className = "" }: { placement: AdPlacement; className?: string }) {
  const { user } = useAuth();
  const { subscription } = useSubscriptionContext();
  if (!showAds(subscription)) return null;

  // Only the owner can change the plan, so staff never see the upgrade link.
  const canUpgrade = user?.role === "owner";

  return (
    <aside
      aria-label="Advertisement"
      data-ad-placement={placement}
      className={`flex min-h-[90px] items-center justify-between gap-4 rounded-xl border border-dashed border-outline-variant bg-surface-container-low px-6 py-4 max-sm:min-h-[64px] max-sm:gap-3 max-sm:px-4 max-sm:py-3 ${className}`}
    >
      <div>
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-on-surface-variant">Ad</span>
        <p className="mt-1 text-body-md text-on-surface-variant max-sm:text-xs">Your ad could be here.</p>
      </div>
      {canUpgrade && (
        <Link href={ROUTES.billing} className="shrink-0 text-sm font-semibold text-primary hover:underline max-sm:text-xs">
          Remove ads
        </Link>
      )}
    </aside>
  );
}