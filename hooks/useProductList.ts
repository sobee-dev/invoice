// hooks/useProductList.ts
"use client";

import { useCallback } from "react";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { normalizeProduct, ProductData } from "@/lib/products";
import { ProductStockFilter, productService } from "@/services/products";

interface UseProductListOptions {
  search?: string;
  stock?: ProductStockFilter;
}

// One page of products at a time. Search and the stock filter run on the
// server, so they cover every product and not only the ones already loaded.
// useProducts is left as it was for pages that need the full catalogue.
export function useProductList({ search = "", stock }: UseProductListOptions) {
  const fetchPage = useCallback(
    async (page: number) => {
      const res = await productService.list({ page, search: search || undefined, stock });
      return { ...res, results: res.results.map(normalizeProduct) as ProductData[] };
    },
    [search, stock],
  );

  return usePaginatedList<ProductData>(fetchPage);
}