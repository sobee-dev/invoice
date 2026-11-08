// components/Providers.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { ThrottleBanner } from "@/components/ThrottleBanner";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { BusinessProvider } from "@/context/BusinessContext";
import { SubscriptionProvider } from "@/context/SubscriptionContext";
import { setMutationHandler } from "@/lib/axios";

function CacheGuard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const previousId = useRef<string | null>(user?.id ?? null);

  // Never let one person's cached data appear for the next person.
  useEffect(() => {
    const id = user?.id ?? null;
    if (previousId.current !== id) {
      queryClient.clear();
      previousId.current = id;
    }
  }, [user?.id, queryClient]);

  // Any successful write marks the whole cache stale. Lists on screen refetch
  // at once, lists you come back to refetch when you open them. Nothing else
  // makes cached data stale.
  useEffect(() => {
    setMutationHandler(() => {
      queryClient.invalidateQueries();
    });
    return () => setMutationHandler(null);
  }, [queryClient]);

  return null;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: Infinity,    // cached data stays fresh until a write invalidates it
            gcTime: 60 * 60_000,    // unused data stays in memory for an hour
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CacheGuard />
        <BusinessProvider>
          <SubscriptionProvider>
            {children}
            <ThrottleBanner />
          </SubscriptionProvider>
        </BusinessProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}