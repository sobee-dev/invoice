// app/(owner)/products/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/layout/Icon";
import { ProductsTable } from "@/components/products/ProductsTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadMoreFooter } from "@/components/ui/LoadMoreFooter";
import { PageHeader } from "@/components/ui/PageHeader";
import { btnAmber, btnNavy } from "@/components/ui/buttonStyles";
import { useBusiness } from "@/context/BusinessContext";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useProductCounts } from "@/hooks/useProductCounts";
import { useProductList } from "@/hooks/useProductList";
import { ProductStockFilter } from "@/services/products";
import { resolveCurrency } from "@/utils/currencySymbol";

type Filter = "all" | ProductStockFilter;

// "active" is the mobile only tab, so the web filters leave it out.
const FILTERS: { key: Exclude<Filter, "active">; label: string }[] = [
  { key: "all", label: "All" },
  { key: "ok", label: "In stock" },
  { key: "low", label: "Low stock" },
  { key: "out", label: "Out of stock" },
  { key: "inactive", label: "Inactive" },
];

export default function ProductsPage() {
  const { business } = useBusiness();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  // The badge numbers come from their own small cached query, not from the loaded rows.
  const { counts } = useProductCounts();

  // Search and the stock filter run on the server, so they cover every product
  // and not only the loaded ones.
  const debouncedSearch = useDebouncedValue(search.trim());

  const { items, count, hasMore, isLoading, isLoadingMore, error, loadMoreError, loadMore, reload } = useProductList({
    search: debouncedSearch,
    stock: filter === "all" ? undefined : filter,
  });

  const symbol = business?.currency ? resolveCurrency(business.currency).symbol : "";
  const hasFilters = debouncedSearch.length > 0 || filter !== "all";
  const noProductsAtAll = !hasFilters && !isLoading && !error && items.length === 0;

  const addButton = (
    <Link href="/products/new" className={btnAmber}>
      <Icon name="add" size={18} /> Add product
    </Link>
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Products" subtitle="Your catalogue and stock levels." actions={addButton} />

      <div className="space-y-4 rounded-xl border border-outline-variant/50 bg-white p-5 shadow-card">
        <div className="relative">
          <Icon name="search" size={20} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by product name or SKU..."
            autoComplete="off"
            className="h-12 w-full rounded-3xl border border-outline-variant/20 bg-surface-container-low pl-11 pr-4 text-body-md text-on-surface placeholder:text-outline focus:border-primary-container focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Stock filter">
          {FILTERS.map((f) => {
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                type="button"
                aria-pressed={active}
                onClick={() => setFilter(f.key)}
                className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                  active
                    ? "border-secondary-container bg-secondary-container font-bold text-on-secondary-container"
                    : "border-outline-variant/40 bg-surface-container-low font-medium text-on-surface hover:bg-surface-container-low"
                }`}
              >
                {f.label}
                {counts && <span className="ml-2 opacity-70">{counts[f.key]}</span>}
              </button>
            );
          })}
        </div>
      </div>

      <section className="rounded-xl border border-outline-variant/50 bg-white shadow-card">
        {error && items.length === 0 ? (
          <EmptyState
            icon="cloud_off"
            title="We could not load your products"
            description="Please check your connection and try again."
            action={
              <button type="button" onClick={reload} className={btnNavy}>
                Try again
              </button>
            }
          />
        ) : noProductsAtAll ? (
          <EmptyState
            icon="inventory_2"
            title="No products yet"
            description="Add what you sell and BillBuzz will track stock as you invoice."
            action={addButton}
          />
        ) : !isLoading && items.length === 0 ? (
          <EmptyState
            icon="find_in_page"
            title="No products match"
            description="Try a different search or filter."
            action={
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setFilter("all");
                }}
                className="h-10 rounded-lg border border-primary-container px-4 text-sm font-semibold text-primary hover:bg-surface-container-low"
              >
                Clear filters
              </button>
            }
          />
        ) : (
          <>
            <ProductsTable products={items} symbol={symbol} isLoading={isLoading} />

            {!isLoading && (
              <LoadMoreFooter
                shown={items.length}
                total={count}
                noun="products"
                hasMore={hasMore}
                isLoadingMore={isLoadingMore}
                loadMoreError={loadMoreError}
                onLoadMore={loadMore}
              />
            )}
          </>
        )}
      </section>
    </div>
  );
}