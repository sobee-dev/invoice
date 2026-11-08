// hooks/useCustomerDocuments.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { Document, documentService } from "@/services/documents";

const MAX_PAGES = 10;

async function fetchCustomerDocuments(customerId: string): Promise<{ docs: Document[]; partial: boolean }> {
  let page = 1;
  let all: Document[] = [];
  let hasNext = true;

  while (hasNext && page <= MAX_PAGES) {
    const res: any = await documentService.list({ customer: customerId, ordering: "-document_date", page });
    const results: Document[] = Array.isArray(res) ? res : res?.results ?? [];
    all = all.concat(results);
    hasNext = !Array.isArray(res) && Boolean(res?.next);
    page += 1;
  }
  // partial is true when there were more pages than we load
  return { docs: all, partial: hasNext };
}

export function useCustomerDocuments(customerId: string) {
  const query = useQuery({
    queryKey: ["documents", "customer", customerId],
    queryFn: () => fetchCustomerDocuments(customerId),
  });

  return {
    docs: query.data?.docs ?? [],
    isLoading: query.isPending,
    error: query.isError,
    partial: query.data?.partial ?? false,
    reload: () => {
      query.refetch();
    },
  };
}