// hooks/useClientList.ts
"use client";

import { useCallback } from "react";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { Customer, CustomerSort, CustomerStatus, customerService } from "@/services/customers";

interface UseClientListOptions {
  search?: string;
  status?: CustomerStatus | "all";
  sort: CustomerSort;
}

// One page of clients at a time. Search, status and sort run on the server, so
// they cover every client and not only the ones already loaded.
// useCustomers is left as it was for pages that need the full list.
export function useClientList({ search = "", status = "all", sort }: UseClientListOptions) {
  const fetchPage = useCallback(
    (page: number) =>
      customerService.list({
        page,
        search: search || undefined,
        status: status === "all" ? undefined : status,
        sort,
      }),
    [search, status, sort],
  );

  return usePaginatedList<Customer>(fetchPage);
}