// hooks/usePaginatedList.ts
"use client";

import { useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";

export interface PageResult<T> {
  count?: number;
  next: string | null;
  results: T[];
}

interface Options {
  enabled?: boolean; // hold off until the first filters are ready
}

/**
 * Loads one page at a time and caches every filter combination under its own
 * key. Pass a key that contains every filter, so a new filter gets a new
 * cache entry instead of overwriting the old one. Coming back to a list you
 * already opened shows it at once and refreshes it quietly.
 */
export function usePaginatedList<T extends { id: string }>(
  queryKey: readonly unknown[],
  fetchPage: (page: number) => Promise<PageResult<T>>,
  { enabled = true }: Options = {},
) {
  const query = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) => fetchPage(pageParam),
    initialPageParam: 1,
    getNextPageParam: (last, all) => (last.next ? all.length + 1 : undefined),
    enabled,
  });

  const items = useMemo(() => {
    const seen = new Set<string>();
    const out: T[] = [];
    for (const page of query.data?.pages ?? []) {
      for (const item of page.results) {
        if (!seen.has(item.id)) {
          seen.add(item.id);
          out.push(item);
        }
      }
    }
    return out;
  }, [query.data]);

  const pages = query.data?.pages ?? [];
  const count = pages.length > 0 ? pages[pages.length - 1].count ?? null : null;

  return {
    items,
    count,
    hasMore: Boolean(query.hasNextPage),
    isLoading: query.isPending,
    isLoadingMore: query.isFetchingNextPage,
    isRefreshing: query.isRefetching && !query.isFetchingNextPage,
    error: query.isError && !query.isFetchNextPageError,
    loadMoreError: query.isFetchNextPageError,
    loadMore: () => {
      if (query.hasNextPage && !query.isFetchingNextPage) query.fetchNextPage();
    },
    reload: () => {
      query.refetch();
    },
    refresh: () => {
      query.refetch();
    },
  };
}