// context/SubscriptionContext.tsx
"use client";

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { PlanLimitDialog } from "@/components/billing/PlanLimitDialog";
import { useSubscription } from "@/hooks/useSubscription";
import { canCreate as canCreatePlan } from "@/lib/plan";
import { PlanLimitInfo, setPlanLimitHandler } from "@/lib/planLimit";
import { ResourceKey, SubscriptionInfo } from "@/services/billing";

interface SubscriptionContextValue {
  subscription: SubscriptionInfo | null;
  isLoading: boolean;
  refresh: () => Promise<void> | void;
  canCreate: (resource: ResourceKey) => boolean;
  // Opens the shared plan limit dialog, which has a button to the billing page.
  showPlanLimit: (info?: PlanLimitInfo) => void;
}

const SubscriptionContext = createContext<SubscriptionContextValue | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { subscription, isLoading, refresh } = useSubscription();
  const [limitInfo, setLimitInfo] = useState<PlanLimitInfo | null>(null);

  const showPlanLimit = useCallback((info: PlanLimitInfo = {}) => setLimitInfo(info), []);
  const canCreate = useCallback((r: ResourceKey) => canCreatePlan(subscription, r), [subscription]);

  // axios reports every 403 plan_limit_reached here. Refresh quietly so stale usage fixes itself.
  useEffect(() => {
    setPlanLimitHandler((info) => {
      setLimitInfo(info);
      refresh();
    });
    return () => setPlanLimitHandler(null);
  }, [refresh]);

  const value = useMemo(
    () => ({ subscription, isLoading, refresh, canCreate, showPlanLimit }),
    [subscription, isLoading, refresh, canCreate, showPlanLimit],
  );

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
      <PlanLimitDialog info={limitInfo} onClose={() => setLimitInfo(null)} />
    </SubscriptionContext.Provider>
  );
}

export function useSubscriptionContext() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error("useSubscriptionContext must be used within a SubscriptionProvider");
  return ctx;
}