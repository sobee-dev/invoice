// hooks/useInventoryTotals.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { productService } from "@/services/products";

export function useInventoryTotals() {
  const query = useQuery({
    queryKey: ["products", "inventory-totals"],
    queryFn: () => productService.inventoryTotals(),
  });

  return {
    totals: query.data ?? null,
    isLoading: query.isPending,
    error: query.isError && !query.data,
    reload: () => {
      query.refetch();
    },
  };
}