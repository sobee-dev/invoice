// hooks/useCustomerDocuments.ts
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Document, documentService } from "@/services/documents";

const MAX_PAGES = 10;

export function useCustomerDocuments(customerId: string) {
  const [docs, setDocs] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [partial, setPartial] = useState(false); // true when there were more pages than we load
  const latest = useRef(0);

  const load = useCallback(async () => {
    const request = ++latest.current;
    setIsLoading(true);
    setError(false);

    try {
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

      if (request !== latest.current) return;
      setDocs(all);
      setPartial(hasNext);
    } catch {
      if (request !== latest.current) return;
      setDocs([]);
      setPartial(false);
      setError(true);
    } finally {
      if (request === latest.current) setIsLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    load();
  }, [load]);

  return { docs, isLoading, error, partial, reload: load };
}