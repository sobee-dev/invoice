// hooks/useDocuments.ts
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DocumentRowData, DocumentStatus, DocumentType, fetchDocumentPage } from "@/lib/documents";

interface UseDocumentsOptions {
  type: DocumentType | "all";
  status: DocumentStatus | "all";
  search?: string;
  customer?: string;
  enabled?: boolean; // hold off until filters from the URL have been read
}

export function useDocuments({ type, status, search = "", customer, enabled = true }: UseDocumentsOptions) {
  const [rows, setRows] = useState<DocumentRowData[]>([]);
  const [count, setCount] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState(false);

  // Only the newest request may write state, so a slow response for an old
  // filter can never replace the current list.
  const latest = useRef(0);
  const loadedPage = useRef(1);

  const load = useCallback(
    async (page: number) => {
      const id = ++latest.current;
      if (page === 1) setIsLoading(true);
      else setIsLoadingMore(true);
      setError(false);

      try {
        const result = await fetchDocumentPage({ page, type, status, search, customer });
        if (id !== latest.current) return;

        loadedPage.current = page;
        setRows((prev) => {
          if (page === 1) return result.rows;
          const seen = new Set(prev.map((r) => r.id));
          return [...prev, ...result.rows.filter((r) => !seen.has(r.id))];
        });
        setCount(result.count);
        setHasMore(result.hasMore);
      } catch {
        if (id !== latest.current) return;
        setError(true);
        if (page === 1) {
          setRows([]);
          setCount(null);
          setHasMore(false);
        }
      } finally {
        if (id === latest.current) {
          setIsLoading(false);
          setIsLoadingMore(false);
        }
      }
    },
    [type, status, search, customer],
  );

  // Runs on mount and again whenever a filter changes.
  useEffect(() => {
    if (enabled) load(1);
  }, [enabled, load]);

  const loadMore = useCallback(() => load(loadedPage.current + 1), [load]);
  const reload = useCallback(() => load(1), [load]);

  return { rows, count, hasMore, isLoading, isLoadingMore, error, loadMore, reload };
}