// hooks/useReports.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { customerService } from "@/services/customers";
import { reportService } from "@/services/reports";

type LoadState = "loading" | "ready" | "error";

// A failed background refresh keeps showing the last good data.
function stateOf(query: { isPending: boolean; isError: boolean; data: unknown }): LoadState {
  if (query.isPending) return "loading";
  if (query.isError && !query.data) return "error";
  return "ready";
}

export function useReportsDashboard() {
  const query = useQuery({ queryKey: ["reports", "dashboard"], queryFn: () => reportService.getDashboard() });
  return {
    report: query.data ?? null,
    state: stateOf(query),
    reload: () => {
      query.refetch();
    },
  };
}

export function useCustomerAnalytics() {
  const query = useQuery({
    queryKey: ["reports", "customer-analytics"],
    queryFn: () => customerService.fetchCustomerAnalytics(),
  });
  return {
    data: query.data ?? null,
    state: stateOf(query),
    reload: () => {
      query.refetch();
    },
  };
}