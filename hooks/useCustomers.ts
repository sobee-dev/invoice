// hooks/useCustomers.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { Customer, customerService } from "@/services/customers";

async function fetchAllCustomers(): Promise<Customer[]> {
  let page = 1;
  let all: Customer[] = [];
  let hasNext = true;

  while (hasNext) {
    // "recent" is newest first, the same order the old -created_at gave.
    const res: any = await customerService.list({ page, sort: "recent" });
    const results: Customer[] = Array.isArray(res) ? res : res?.results ?? [];
    all = all.concat(results);
    hasNext = !Array.isArray(res) && Boolean(res?.next);
    page += 1;
  }
  return all;
}

export function useCustomers() {
  const query = useQuery({ queryKey: ["customers", "all"], queryFn: fetchAllCustomers });

  return {
    customers: query.data ?? [],
    isLoading: query.isPending,
    error: query.isError,
    reload: () => {
      query.refetch();
    },
  };
}