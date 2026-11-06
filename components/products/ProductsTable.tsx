// components/products/ProductsTable.tsx
import Link from "next/link";
import { ProductThumb } from "@/components/products/ProductThumb";
import { StockChip } from "@/components/products/StockChip";
import { ProductData } from "@/lib/products";
import { fmtMoney } from "@/utils/money";

const th = "px-6 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-on-surface-variant";
const bar = "animate-pulse rounded bg-surface-container";

export function ProductsTable({
  products,
  symbol,
  isLoading = false,
}: {
  products: ProductData[];
  symbol: string;
  isLoading?: boolean;
}) {
  if (isLoading) {
    return (
      <ul className="divide-y divide-outline-variant">
        {Array.from({ length: 5 }).map((_, i) => (
          <li key={i} className="flex items-center gap-4 px-6 py-5">
            <div className={`${bar} h-12 w-12 rounded-xl`} />
            <div className="flex-1 space-y-2">
              <div className={`${bar} h-4 w-1/3`} />
              <div className={`${bar} h-3 w-1/5`} />
            </div>
            <div className={`${bar} h-6 w-20 rounded-full`} />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[720px] text-left text-body-md">
          <thead className="bg-surface-container-low">
            <tr>
              <th className={th}>Product</th>
              <th className={`${th} text-right`}>Price</th>
              <th className={`${th} text-right`}>On hand</th>
              <th className={`${th} text-right`}>Available</th>
              <th className={th}>Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant">
            {products.map((p) => (
              <tr key={p.id} className="hover:bg-surface-container-low/60">
                <td className="px-6 py-4">
                  <Link href={`/products/${p.id}`} className="flex items-center gap-4">
                    <ProductThumb imageUrl={p.imageUrl} name={p.name} />
                    <span className="min-w-0">
                      <span className="block truncate font-bold text-primary hover:underline">{p.name}</span>
                      <span className="block text-xs text-on-surface-variant">SKU: {p.sku || "—"}</span>
                    </span>
                  </Link>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right font-bold text-primary">{fmtMoney(p.unitPrice, symbol, 2)}</td>
                <td className="px-6 py-4 text-right text-on-surface">{p.quantityOnHand}</td>
                <td className="px-6 py-4 text-right text-on-surface">{p.availableToSell}</td>
                <td className="px-6 py-4">
                  <StockChip product={p} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="space-y-3 p-4 md:hidden">
        {products.map((p) => (
          <li key={p.id}>
            <Link href={`/products/${p.id}`} className="flex gap-3 rounded-xl border border-outline-variant bg-white p-3 shadow-card">
              <ProductThumb imageUrl={p.imageUrl} name={p.name} size={64} />
              <span className="min-w-0 flex-1">
                <span className="flex items-start justify-between gap-2">
                  <span className="truncate font-bold text-primary">{p.name}</span>
                  <span className="shrink-0 font-extrabold text-primary">{fmtMoney(p.unitPrice, symbol, 2)}</span>
                </span>
                <span className="block text-xs text-on-surface-variant">SKU: {p.sku || "—"}</span>
                <span className="mt-2 flex items-center justify-between gap-2">
                  <span className="text-xs text-on-surface-variant">{p.quantityOnHand} on hand</span>
                  <StockChip product={p} />
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}