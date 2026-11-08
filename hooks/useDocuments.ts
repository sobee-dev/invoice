// hooks/useDocuments.ts
"use client";

import { useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { DocumentRowData, DocumentStatus, DocumentType, fetchDocumentPage } from "@/lib/documents";

interface UseDocumentsOptions {
  type: DocumentType | "all";
  status: DocumentStatus | "all";
  search?: string;
  customer?: string;
  enabled?: boolean; // hold off until filters from the URL have been read
}

export function useDocuments({ type, status, search = "", customer, enabled = true }: UseDocumentsOptions) {
  const query = useInfiniteQuery({
    queryKey: ["documents", "list", { type, status, search, customer: customer ?? null }],
    queryFn: ({ pageParam }) => fetchDocumentPage({ page: pageParam, type, status, search, customer }),
    initialPageParam: 1,
    getNextPageParam: (last, all) => (last.hasMore ? all.length + 1 : undefined),
    enabled,
  });

  const rows = useMemo(() => {
    const seen = new Set<string>();
    const out: DocumentRowData[] = [];
    for (const page of query.data?.pages ?? []) {
      for (const row of page.rows) {
        if (!seen.has(row.id)) {
          seen.add(row.id);
          out.push(row);
        }
      }
    }
    return out;
  }, [query.data]);

  const pages = query.data?.pages ?? [];
  const count = pages.length > 0 ? pages[pages.length - 1].count : null;

  return {
    rows,
    count,
    hasMore: Boolean(query.hasNextPage),
    isLoading: query.isPending,
    isLoadingMore: query.isFetchingNextPage,
    error: query.isError,
    loadMore: () => {
      if (query.hasNextPage && !query.isFetchingNextPage) query.fetchNextPage();
    },
    reload: () => {
      query.refetch();
    },
  };
}