// hooks/useProductCounts.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { productService } from "@/services/products";

export function useProductCounts() {
  const query = useQuery({
    queryKey: ["products", "counts"],
    queryFn: () => productService.counts(),
  });
  return { counts: query.data ?? null };
}