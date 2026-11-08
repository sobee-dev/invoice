// hooks/useProductHistory.ts
"use client";

import { useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { cursorFromUrl } from "@/lib/inventory";
import { inventoryService, InventoryTransaction } from "@/services/inventory";

// Cursor paginated stock history for one product, cached per product.
export function useProductHistory(productId: string) {
  const query = useInfiniteQuery({
    queryKey: ["products", "history", productId],
    queryFn: ({ pageParam }) => inventoryService.getHistory(productId, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => cursorFromUrl(last.next) ?? undefined,
  });

  const items = useMemo(() => {
    const seen = new Set<string>();
    const out: InventoryTransaction[] = [];
    for (const page of query.data?.pages ?? []) {
      for (const tx of page.results) {
        if (!seen.has(tx.id)) {
          seen.add(tx.id);
          out.push(tx);
        }
      }
    }
    return out;
  }, [query.data]);

  return {
    items,
    hasMore: Boolean(query.hasNextPage),
    isLoading: query.isPending,
    isLoadingMore: query.isFetchingNextPage,
    error: query.isError && !query.isFetchNextPageError,
    loadMoreError: query.isFetchNextPageError,
    loadMore: () => {
      if (query.hasNextPage && !query.isFetchingNextPage) query.fetchNextPage();
    },
    reload: () => {
      query.refetch();
    },
  };
}