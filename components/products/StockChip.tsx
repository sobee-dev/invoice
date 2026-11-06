// components/products/StockChip.tsx
import { ProductData, stockState } from "@/lib/products";

const STYLES = {
  out: { label: "Out of stock", classes: "bg-status-deleted-bg text-status-deleted-fg" },
  low: { label: "Low stock", classes: "bg-status-warn-bg text-status-warn-fg" },
  ok: { label: "In stock", classes: "bg-status-paid-bg text-status-paid-fg" },
  inactive: { label: "Inactive", classes: "bg-status-draft-bg text-status-draft-fg" },
} as const;

export function StockChip({ product }: { product: ProductData }) {
  const style = product.isActive ? STYLES[stockState(product)] : STYLES.inactive;
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${style.classes}`}>
      {style.label}
    </span>
  );
}