// app/(owner)/team/page.tsx
"use client";

import Link from "next/link";
import { TeamContent } from "@/components/team/TeamContent";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { btnNavy } from "@/components/ui/buttonStyles";
import { useSubscriptionContext } from "@/context/SubscriptionContext";
import { canUseStaff } from "@/lib/plan";
import { ROUTES } from "@/lib/routes";

export default function TeamPage() {
  const { subscription } = useSubscriptionContext();

  if (!canUseStaff(subscription)) {
    return (
      <div className="space-y-6">
        <PageHeader title="Team management" subtitle="Manage your staff members and what they can access." />
        <div className="rounded-xl border border-outline-variant bg-white shadow-card">
          <EmptyState
            icon="lock"
            title="Staff accounts are not on the Free plan"
            description="Upgrade to add team members, each with their own sign in."
            action={
              <Link href={ROUTES.billing} className={btnNavy}>
                See plans
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  return <TeamContent />;
}