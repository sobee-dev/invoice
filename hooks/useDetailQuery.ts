// hooks/useDetailQuery.ts
"use client";

import { useQuery } from "@tanstack/react-query";

export type DetailState = "loading" | "ready" | "missing" | "error";

// One record cached under its own key. A 404 is final and is not retried.
// A failed background refresh keeps showing the last good data.
export function useDetailQuery<T>(queryKey: readonly unknown[], queryFn: () => Promise<T>) {
  const query = useQuery({
    queryKey,
    queryFn,
    retry: (failureCount, err) => (err as any)?.response?.status !== 404 && failureCount < 1,
  });

  let state: DetailState = "ready";
  if (query.data === undefined) {
    if (query.isPending) state = "loading";
    else state = (query.error as any)?.response?.status === 404 ? "missing" : "error";
  }

  return {
    data: query.data ?? null,
    state,
    reload: () => {
      query.refetch();
    },
  };
}