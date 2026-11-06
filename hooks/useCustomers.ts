// hooks/useCustomers.ts
"use client";

import { useCallback, useEffect, useState } from "react";
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
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(false);
    try {
      setCustomers(await fetchAllCustomers());
    } catch {
      setCustomers([]);
      setError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { customers, isLoading, error, reload: load };
}