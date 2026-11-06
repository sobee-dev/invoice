// lib/products.ts
import { productService, Product as RawProduct } from "@/services/products";

// The backend sends decimals as strings. Convert once, here.
export interface ProductData
  extends Omit<RawProduct, "unitPrice" | "quantityOnHand" | "totalSold" | "availableToSell"> {
  unitPrice: number;
  quantityOnHand: number;
  totalSold: number;
  availableToSell: number;
}

export function normalizeProduct(p: RawProduct): ProductData {
  return {
    ...p,
    unitPrice: Number(p.unitPrice) || 0,
    quantityOnHand: Number(p.quantityOnHand) || 0,
    totalSold: Number(p.totalSold ?? 0) || 0,
    availableToSell: Number(p.availableToSell) || 0,
  };
}

export type StockState = "out" | "low" | "ok";

// isLowStock comes from the backend, which owns the reorder-level logic.
export function stockState(p: ProductData): StockState {
  if (p.availableToSell <= 0) return "out";
  if (p.isLowStock) return "low";
  return "ok";
}

export async function fetchAllProducts(): Promise<ProductData[]> {
  let page = 1;
  let all: RawProduct[] = [];
  let hasNext = true;

  while (hasNext) {
    const res: any = await productService.list({ page });
    const results: RawProduct[] = Array.isArray(res) ? res : res?.results ?? [];
    all = all.concat(results);
    hasNext = !Array.isArray(res) && Boolean(res?.next);
    page += 1;
  }

  return all.map(normalizeProduct);
}