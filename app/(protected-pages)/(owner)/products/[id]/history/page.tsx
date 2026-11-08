// app/(owner)/products/[id]/history/page.tsx
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Icon } from "@/components/layout/Icon";
import { AdjustStockModal } from "@/components/products/AdjustStockModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { btnAmber, btnNavy, btnOutline } from "@/components/ui/buttonStyles";
import { useBusiness } from "@/context/BusinessContext";
import { useDetailQuery } from "@/hooks/useDetailQuery";
import { useProductHistory } from "@/hooks/useProductHistory";
import { groupByDate, HISTORY_TABS, timeLabel, TX_META } from "@/lib/inventory";
import { normalizeProduct, ProductData } from "@/lib/products";
import { TransactionType } from "@/services/inventory";
import { productService } from "@/services/products";
import { resolveCurrency } from "@/utils/currencySymbol";
import { fmtMoney } from "@/utils/money";

export default function InventoryHistoryPage() {
  const { id } = useParams<{ id: string }>();
  const { business } = useBusiness();
  const symbol = business?.currency ? resolveCurrency(business.currency).symbol : "";

  const { data: product, state: productState, reload: reloadProduct } = useDetailQuery<ProductData>(
    ["products", "detail", id],
    async () => normalizeProduct(await productService.get(id)),
  );
  const history = useProductHistory(id);
  const txs = history.items;

  const [tab, setTab] = useState<TransactionType | "all">("all");
  const [adjustOpen, setAdjustOpen] = useState(false);

  const groups = useMemo(
    () => groupByDate(tab === "all" ? txs : txs.filter((t) => t.transactionType === tab)),
    [txs, tab],
  );

  if (productState === "loading" || history.isLoading) {
    return <div className="h-64 animate-pulse rounded-xl border border-outline-variant bg-surface-container-low" />;
  }

  if (productState !== "ready" || !product || (history.error && txs.length === 0)) {
    return (
      <div className="rounded-xl border border-outline-variant bg-white shadow-card">
        <EmptyState
          icon="cloud_off"
          title="We could not load this history"
          description="Please check your connection and try again."
          action={
            <button
              type="button"
              onClick={() => {
                reloadProduct();
                history.reload();
              }}
              className={btnNavy}
            >
              Try again
            </button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={product.name}
        subtitle="Every sale, purchase and adjustment for this product."
        backHref={`/products/${id}`}
        backLabel="Product"
        actions={
          <button type="button" onClick={() => setAdjustOpen(true)} className={btnAmber}>
            <Icon name="tune" size={16} /> Adjust stock
          </button>
        }
      />

      <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-outline-variant bg-white shadow-card">
        <div className="border-r border-outline-variant p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Current stock</p>
          <p className="mt-2 text-2xl font-extrabold text-on-surface">{product.quantityOnHand} units</p>
        </div>
        <div className="p-5 text-right">
          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Value</p>
          <p className="mt-2 text-2xl font-extrabold text-primary-container">
            {fmtMoney(product.unitPrice * product.quantityOnHand, symbol, 2)}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Transaction type">
        {HISTORY_TABS.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              aria-pressed={active}
              onClick={() => setTab(t.key)}
              className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                active
                  ? "border-primary-container bg-primary-container font-bold text-white"
                  : "border-outline-variant bg-white font-medium text-on-surface hover:bg-surface-container-low"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {groups.length === 0 ? (
        <div className="rounded-xl border border-outline-variant bg-white shadow-card">
          <EmptyState icon="inventory" title="No transactions found" description="Sales, purchases and adjustments will appear here." />
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <section key={group.label}>
              <h2 className="mb-3 inline-block rounded-lg bg-surface-container px-3 py-1 text-xs font-semibold text-on-surface-variant">
                {group.label}
              </h2>
              <ul className="space-y-3">
                {group.items.map((tx) => {
                  const meta = TX_META[tx.transactionType];
                  const positive = tx.quantityChange > 0;
                  return (
                    <li key={tx.id} className="rounded-xl border border-outline-variant bg-white p-4 shadow-card">
                      <div className="flex items-center gap-4">
                        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${meta.tile}`}>
                          <Icon name={meta.icon} size={22} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-on-surface">{meta.title}</p>
                          {tx.referenceDocumentId ? (
                            <Link
                              href={`/docs/${tx.referenceDocumentId}`}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-primary-container hover:underline"
                            >
                              View related document <Icon name="open_in_new" size={13} />
                            </Link>
                          ) : (
                            <p className="text-xs text-on-surface-variant">No linked document</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className={`text-xl font-extrabold ${positive ? "text-on-secondary-container" : "text-error"}`}>
                            {positive ? `+${tx.quantityChange}` : tx.quantityChange}
                          </p>
                          <p className="text-xs text-on-surface-variant">{timeLabel(tx.createdAt)}</p>
                        </div>
                      </div>
                      {tx.reason && (
                        <p className="mt-3 border-l-4 border-primary-container/40 pl-3 text-body-md italic text-on-surface-variant">
                          Reason: {tx.reason}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}

      {(history.hasMore || history.loadMoreError) && (
        <div className="flex items-center justify-center gap-4">
          {history.loadMoreError && <p className="text-body-md text-error">Could not load more transactions.</p>}
          {history.hasMore && (
            <button type="button" onClick={history.loadMore} disabled={history.isLoadingMore} className={btnOutline}>
              {history.isLoadingMore ? "Loading..." : "Load more"}
            </button>
          )}
        </div>
      )}

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