// hooks/useAsyncSearch.ts
"use client";

import { useEffect, useRef, useState } from "react";

// Runs a search a moment after typing stops. Only the newest request may write results,
// so a slow answer for an old term never replaces a newer one.
export function useAsyncSearch<T>(
  query: string,
  fetcher: (term: string) => Promise<T[]>,
  enabled = true,
  delayMs = 300,
) {
  const [results, setResults] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const latest = useRef(0);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    const term = query.trim();
    if (!enabled || !term) {
      latest.current += 1;
      setResults([]);
      setLoading(false);
      return;
    }

    const request = ++latest.current;
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const found = await fetcherRef.current(term);
        if (request === latest.current) setResults(found);
      } catch {
        if (request === latest.current) setResults([]);
      } finally {
        if (request === latest.current) setLoading(false);
      }
    }, delayMs);

    return () => clearTimeout(timer);
  }, [query, enabled, delayMs]);

  return { results, loading };
}