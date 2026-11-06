// hooks/useInitialQuery.ts
"use client";

import { useEffect, useState } from "react";

// Reads the query string once, on the client. It avoids useSearchParams, which needs a Suspense boundary at build time.
// Returns null until the value has been read.
export function useInitialQuery(): URLSearchParams | null {
  const [params, setParams] = useState<URLSearchParams | null>(null);
  useEffect(() => {
    setParams(new URLSearchParams(window.location.search));
  }, []);
  return params;
}