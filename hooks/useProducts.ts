// hooks/useProducts.ts
"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchAllProducts, ProductData } from "@/lib/products";

export function useProducts() {
  const [products, setProducts] = useState<ProductData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(false);
    try {
      setProducts(await fetchAllProducts());
    } catch {
      setProducts([]);
      setError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { products, isLoading, error, reload: load };
}