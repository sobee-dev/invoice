// hooks/useProducts.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchAllProducts } from "@/lib/products";

export function useProducts() {
  const query = useQuery({ queryKey: ["products", "all"], queryFn: fetchAllProducts });

  return {
    products: query.data ?? [],
    isLoading: query.isPending,
    error: query.isError,
    reload: () => {
      query.refetch();
    },
  };
}