'use client';

// hooks/useSubscription.ts
import { useAuth } from '@/context/AuthContext';
import { billingService, SubscriptionInfo } from '@/services/billing';
import { useCallback, useEffect, useRef, useState } from 'react';

export function useSubscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const hasData = useRef(false);
  const latest = useRef(0);

  const refresh = useCallback(async () => {
    if (!user) {
      // No session, so no point hitting a protected endpoint that will 401.
      latest.current++;
      hasData.current = false;
      setSubscription(null);
      setIsLoading(false);
      return;
    }

    const id = ++latest.current;
    // Only the first load shows a loading state. Later refreshes happen quietly.
    if (!hasData.current) setIsLoading(true);

    try {
      const info = await billingService.getStatus();
      if (id !== latest.current) return;
      hasData.current = true;
      setSubscription(info);
    } catch {
      // Keep the last good value. A failed first load leaves it null.
    } finally {
      if (id === latest.current) setIsLoading(false);
    }
  }, [user]);

  // refresh changes identity with the user, so this re-fires on login and logout.
  useEffect(() => { refresh(); }, [refresh]);

  // Usage numbers go stale while a tab sleeps, so re-read when it comes back.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [refresh]);

  return { subscription, isLoading, refresh };
}