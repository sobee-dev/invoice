// app/(owner)/products/[id]/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Icon } from "@/components/layout/Icon";
import { AdjustStockModal } from "@/components/products/AdjustStockModal";
import { ProductThumb } from "@/components/products/ProductThumb";
import { StockChip } from "@/components/products/StockChip";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { btnAmber, btnNavy, btnOutline } from "@/components/ui/buttonStyles";
import { useBusiness } from "@/context/BusinessContext";
import { useDetailQuery } from "@/hooks/useDetailQuery";
import { normalizeProduct, ProductData } from "@/lib/products";
import { productService } from "@/services/products";
import { resolveCurrency } from "@/utils/currencySymbol";
import { fmtMoney } from "@/utils/money";

function Metric({ label, value, highlight = false }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className={`rounded-xl p-5 text-center ${highlight ? "bg-primary-container text-white" : "border border-outline-variant bg-white"}`}>
      <p className={`text-xs font-semibold ${highlight ? "text-white/70" : "text-on-surface-variant"}`}>{label}</p>
      <p className={`mt-1 text-3xl font-extrabold ${highlight ? "text-white" : "text-on-surface"}`}>{value}</p>
    </div>
  );
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { business } = useBusiness();
  const symbol = business?.currency ? resolveCurrency(business.currency).symbol : "";

  // Same key as the history page, so moving between the two costs no request.
  const { data: product, state } = useDetailQuery<ProductData>(["products", "detail", id], async () =>
    normalizeProduct(await productService.get(id)),
  );
  const [adjustOpen, setAdjustOpen] = useState(false);

  if (state === "loading") {
    return <div className="h-64 animate-pulse rounded-xl border border-outline-variant bg-surface-container-low" />;
  }

  if (state !== "ready" || !product) {
    return (
      <div className="rounded-xl border border-outline-variant bg-white shadow-card">
        <EmptyState
          icon={state === "missing" ? "search_off" : "cloud_off"}
          title={state === "missing" ? "Product not found" : "We could not load this product"}
          description={state === "missing" ? "It may have been removed." : "Please check your connection and try again."}
          action={
            <Link href="/products" className={btnNavy}>
              Back to products
            </Link>
          }
        />
      </div>
    );
  }

  const specs: { label: string; value: string }[] = [
    { label: "SKU", value: product.sku || "—" },
    { label: "Description", value: product.description?.trim() || "—" },
    { label: "Reorder level", value: product.reorderLevel != null ? String(product.reorderLevel) : "Not set" },
    { label: "Total sold", value: String(product.totalSold) },
    { label: "Stock value", value: fmtMoney(product.unitPrice * product.quantityOnHand, symbol, 2) },
    { label: "Status", value: product.isActive ? "Active" : "Inactive" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={product.name}
        subtitle={`SKU: ${product.sku || "—"} · ${fmtMoney(product.unitPrice, symbol, 2)} per unit`}
        backHref="/products"
        backLabel="Products"
        actions={
          <>
            <Link href={`/products/${product.id}/edit`} className={btnOutline}>
              <Icon name="edit" size={16} /> Edit
            </Link>
            <button type="button" onClick={() => setAdjustOpen(true)} className={btnAmber}>
              <Icon name="tune" size={16} /> Adjust stock
            </button>
          </>
        }
      />

      {product.isLowStock && (
        <div role="alert" className="flex items-center gap-3 rounded-xl bg-error-container p-4 text-body-md font-semibold text-error">
          <Icon name="warning" size={20} /> Stock is below the reorder level. Restock soon.
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div>
          <div className="flex items-center justify-center rounded-xl border border-outline-variant bg-white p-6 shadow-card">
            <ProductThumb imageUrl={product.imageUrl} name={product.name} size={240} />
          </div>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <SectionCard title="Inventory overview" action={<StockChip product={product} />}>
            <div className="grid grid-cols-3 gap-3">
              <Metric label="On hand" value={product.quantityOnHand} />
              <Metric label="Sold" value={product.totalSold} />
              <Metric label="Available" value={product.availableToSell} highlight />
            </div>
            <Link
              href={`/products/${product.id}/history`}
              className="mt-4 flex items-center gap-3 rounded-xl border border-primary-container/20 bg-primary-container/5 px-4 py-4 font-semibold text-primary-container hover:bg-primary-container/10"
            >
              <Icon name="history" size={22} />
              <span className="flex-1">View inventory history</span>
              <Icon name="chevron_right" size={22} />
            </Link>
          </SectionCard>

          <SectionCard title="Details">
            <dl className="divide-y divide-outline-variant">
              {specs.map((s) => (
                <div key={s.label} className="flex justify-between gap-6 py-3 text-body-md">
                  <dt className="text-on-surface-variant">{s.label}</dt>
                  <dd className="max-w-[70%] text-right font-semibold text-on-surface">{s.value}</dd>
                </div>
              ))}
            </dl>
          </SectionCard>
        </div>
      </div>

      {/* The stock adjustment is a write, so the cache refreshes itself afterwards. */}
      <AdjustStockModal
        open={adjustOpen}
        productId={product.id}
        productName={product.name}
        currentStock={product.quantityOnHand}
        onClose={() => setAdjustOpen(false)}
        onSaved={() => undefined}
      />
    </div>
  );
}