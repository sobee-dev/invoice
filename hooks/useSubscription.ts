'use client';

// hooks/useSubscription.ts
import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { billingService } from '@/services/billing';

export const subscriptionKey = ['subscription'] as const;

export function useSubscription() {
  const { user } = useAuth();

  // No session means no request, because the endpoint is protected and would 401.
  // A failed refresh keeps the last good value, and a failed first load leaves it null.
  const query = useQuery({
    queryKey: subscriptionKey,
    queryFn: () => billingService.getStatus(),
    enabled: Boolean(user),
    staleTime: 30_000,
    refetchOnWindowFocus: true, // usage numbers go stale while a tab sleeps
  });

  const { refetch } = query;
  const refresh = useCallback(async () => {
    if (user) await refetch();
  }, [user, refetch]);

  return {
    subscription: user ? query.data ?? null : null,
    isLoading: Boolean(user) && query.isPending,
    refresh,
  };
}