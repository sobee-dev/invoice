// app/(owner)/reports/stock/page.tsx
"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/layout/Icon";
import { ProductThumb } from "@/components/products/ProductThumb";
import { StockChip } from "@/components/products/StockChip";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { btnNavy } from "@/components/ui/buttonStyles";
import { useBusiness } from "@/context/BusinessContext";
import { useProducts } from "@/hooks/useProducts";
import { ProductData, StockState, stockState } from "@/lib/products";
import { ROUTES } from "@/lib/routes";
import { resolveCurrency } from "@/utils/currencySymbol";
import { fmtMoney } from "@/utils/money";

type Filter = "all" | "critical" | "ok";

const SORT_ORDER: Record<StockState, number> = { out: 0, low: 1, ok: 2 };
const BAR_COLOR: Record<StockState, string> = { out: "bg-error", low: "bg-status-warn-fg", ok: "bg-status-paid-fg" };

function Pill({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="rounded-xl border border-outline-variant bg-white p-5 text-center shadow-card">
      <p className={`text-3xl font-extrabold ${accent}`}>{value}</p>
      <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{label}</p>
    </div>
  );
}

function StockRow({ product }: { product: ProductData }) {
  const state = stockState(product);
  const reorder = product.reorderLevel;
  const maxStock = Math.max((reorder ?? 0) * 4, product.quantityOnHand, 1);
  const fill = Math.min(100, Math.round((product.quantityOnHand / maxStock) * 100));

  return (
    <li className="px-6 py-5">
      <div className="flex items-center gap-4">
        <ProductThumb imageUrl={product.imageUrl} name={product.name} size={44} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-on-surface">{product.name}</p>
          <p className="text-xs text-on-surface-variant">{product.sku || "—"}</p>
        </div>
        <StockChip product={product} />
      </div>

      <div
        className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-surface-container-high"
        role="img"
        aria-label={`${product.quantityOnHand} on hand`}
      >
        <div className={`h-full rounded-full ${BAR_COLOR[state]}`} style={{ width: `${fill}%` }} />
      </div>

      <dl className="mt-3 grid grid-cols-3 gap-4 text-body-md">
        <div>
          <dt className="text-xs text-on-surface-variant">Available</dt>
          <dd className="font-bold text-on-surface">{product.availableToSell}</dd>
        </div>
        <div>
          <dt className="text-xs text-on-surface-variant">Sold</dt>
          <dd className="font-bold text-on-surface">{product.totalSold}</dd>
        </div>
        <div>
          <dt className="text-xs text-on-surface-variant">Reorder at</dt>
          <dd className="font-bold text-on-surface">{reorder ?? "—"}</dd>
        </div>
      </dl>
    </li>
  );
}

export default function StockReportPage() {
  const { business } = useBusiness();
  const { products, isLoading, error, reload } = useProducts();
  const [filter, setFilter] = useState<Filter>("all");

  const symbol = business?.currency ? resolveCurrency(business.currency).symbol : "";

  const outCount = products.filter((p) => stockState(p) === "out").length;
  const lowCount = products.filter((p) => stockState(p) === "low").length;
  const totalValue = products.reduce((sum, p) => sum + p.unitPrice * p.quantityOnHand, 0);

  const rows = useMemo(() => {
    const sorted = [...products].sort((a, b) => SORT_ORDER[stockState(a)] - SORT_ORDER[stockState(b)]);
    if (filter === "critical") return sorted.filter((p) => stockState(p) !== "ok");
    if (filter === "ok") return sorted.filter((p) => stockState(p) === "ok");
    return sorted;
  }, [products, filter]);

  return (
    <div className="space-y-6">
      <PageHeader title="Stock report" subtitle="Current inventory levels." backHref={ROUTES.reports} backLabel="Reports" />

      {error ? (
        <div className="rounded-xl border border-outline-variant bg-white shadow-card">
          <EmptyState
            icon="cloud_off"
            title="We could not load your stock report"
            description="Please check your connection and try again."
            action={
              <button type="button" onClick={reload} className={btnNavy}>
                Try again
              </button>
            }
          />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4">
            <Pill label="Total products" value={products.length} accent="text-primary-container" />
            <Pill label="Low stock" value={lowCount} accent={lowCount > 0 ? "text-status-warn-fg" : "text-status-paid-fg"} />
            <Pill label="Out of stock" value={outCount} accent={outCount > 0 ? "text-error" : "text-status-paid-fg"} />
          </div>

          <div className="flex items-center justify-between rounded-xl bg-primary-container p-6 text-white shadow-card">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-white/60">Total inventory value</p>
              <p className="mt-1 text-3xl font-extrabold">{isLoading ? "..." : fmtMoney(totalValue, symbol, 2)}</p>
            </div>
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
              <Icon name="inventory" size={28} />
            </span>
          </div>

          <div className="flex flex-wrap gap-2" role="group" aria-label="Stock filter">
            {([
              ["all", "All"],
              ["critical", "Critical"],
              ["ok", "In stock"],
            ] as const).map(([key, label]) => (
              <button
                key={key}
                type="button"
                aria-pressed={filter === key}
                onClick={() => setFilter(key)}
                className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                  filter === key
                    ? "border-primary-container bg-primary-container font-bold text-white"
                    : "border-outline-variant bg-white font-medium text-on-surface hover:bg-surface-container-low"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <section className="rounded-xl border border-outline-variant bg-white shadow-card">
            {isLoading ? (
              <div className="h-48 animate-pulse rounded-xl bg-surface-container-low" />
            ) : rows.length === 0 ? (
              <EmptyState icon="check_circle" title="No products match this filter" />
            ) : (
              <ul className="divide-y divide-outline-variant">
                {rows.map((p) => (
                  <StockRow key={p.id} product={p} />
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}