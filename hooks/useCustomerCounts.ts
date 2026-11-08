// hooks/useCustomerCounts.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { customerService } from "@/services/customers";

export function useCustomerCounts() {
  const query = useQuery({
    queryKey: ["customers", "counts"],
    queryFn: () => customerService.counts(),
  });
  return { counts: query.data ?? null };
}