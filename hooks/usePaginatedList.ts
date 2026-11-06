// hooks/usePaginatedList.ts  (same file on mobile and web)
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface PageResult<T> {
  count?: number;
  next: string | null;
  results: T[];
}

interface Options {
  enabled?: boolean; // hold off until the first filters are ready
}

/**
 * Loads one page at a time. fetchPage must be wrapped in useCallback so its
 * identity only changes when a filter changes: a new identity throws the list
 * away and starts again from page 1.
 *
 * Only the newest request may write state, so a slow response for an old
 * filter can never replace the current list.
 */
export function usePaginatedList<T extends { id: string }>(
  fetchPage: (page: number) => Promise<PageResult<T>>,
  { enabled = true }: Options = {},
) {
  const [items, setItems] = useState<T[]>([]);
  const [count, setCount] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState(false);

  const latest = useRef(0);
  const nextPage = useRef(1);
  const busy = useRef(false);
  const hasMoreRef = useRef(false);

  const loadFirst = useCallback(
    async (mode: "initial" | "refresh") => {
      const id = ++latest.current;
      busy.current = true;
      if (mode === "refresh") setIsRefreshing(true);
      else setIsLoading(true);
      setIsLoadingMore(false);
      setError(false);
      setLoadMoreError(false);

      try {
        const res = await fetchPage(1);
        if (id !== latest.current) return;
        nextPage.current = 2;
        hasMoreRef.current = Boolean(res.next);
        setItems(res.results);
        setCount(res.count ?? null);
        setHasMore(hasMoreRef.current);
      } catch {
        if (id !== latest.current) return;
        setError(true);
        if (mode === "initial") {
          setItems([]);
          setCount(null);
          hasMoreRef.current = false;
          setHasMore(false);
        }
      } finally {
        if (id === latest.current) {
          busy.current = false;
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [fetchPage],
  );

  const loadMore = useCallback(async () => {
    if (busy.current || !hasMoreRef.current) return;
    const id = latest.current;
    busy.current = true;
    setIsLoadingMore(true);
    setLoadMoreError(false);

    try {
      const res = await fetchPage(nextPage.current);
      if (id !== latest.current) return;
      nextPage.current += 1;
      hasMoreRef.current = Boolean(res.next);
      setItems((prev) => {
        const seen = new Set(prev.map((i) => i.id));
        return [...prev, ...res.results.filter((i) => !seen.has(i.id))];
      });
      if (res.count != null) setCount(res.count);
      setHasMore(hasMoreRef.current);
    } catch {
      if (id !== latest.current) return;
      setLoadMoreError(true);
    } finally {
      if (id === latest.current) {
        busy.current = false;
        setIsLoadingMore(false);
      }
    }
  }, [fetchPage]);

  // Runs on mount and again whenever a filter changes.
  useEffect(() => {
    if (enabled) loadFirst("initial");
  }, [enabled, loadFirst]);

  const reload = useCallback(() => loadFirst("initial"), [loadFirst]);
  const refresh = useCallback(() => loadFirst("refresh"), [loadFirst]);

  return {
    items,
    count,
    hasMore,
    isLoading,
    isLoadingMore,
    isRefreshing,
    error,
    loadMoreError,
    loadMore,
    reload,
    refresh,
  };
}