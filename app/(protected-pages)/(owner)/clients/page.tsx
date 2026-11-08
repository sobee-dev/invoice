// app/(owner)/clients/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/layout/Icon";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadMoreFooter } from "@/components/ui/LoadMoreFooter";
import { PageHeader } from "@/components/ui/PageHeader";
import { btnAmber, btnNavy } from "@/components/ui/buttonStyles";
import { useBusiness } from "@/context/BusinessContext";
import { useClientList } from "@/hooks/useClientList";
import { useCustomerCounts } from "@/hooks/useCustomerCounts";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { Customer, CustomerSort } from "@/services/customers";
import { resolveCurrency } from "@/utils/currencySymbol";
import { fmtMoney } from "@/utils/money";

type Status = "all" | "active" | "inactive";

const SORTS: { key: CustomerSort; label: string }[] = [
  { key: "recent", label: "Most recent" },
  { key: "az", label: "Name A to Z" },
  { key: "za", label: "Name Z to A" },
];

function ClientCard({ customer, symbol }: { customer: Customer; symbol: string }) {
  const owing = Number(customer.outstandingBalance) || 0;

  return (
    <Link
      href={`/clients/${customer.id}`}
      className="flex items-center gap-4 rounded-xl border border-outline-variant/50 bg-white p-4 shadow-card transition-colors hover:bg-surface-container-low/60"
    >
      <Avatar name={customer.fullName} size={52} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-bold text-primary">{customer.fullName}</p>
        {customer.email && <p className="truncate text-xs text-on-surface-variant">{customer.email}</p>}
        {customer.phone && <p className="truncate text-xs text-on-surface-variant">{customer.phone}</p>}
        {owing > 0 && <p className="mt-1 text-xs font-semibold text-status-warn-fg">Owes {fmtMoney(owing, symbol, 2)}</p>}
      </div>
      <Badge tone={customer.status === "active" ? "green" : "neutral"}>
        {customer.status === "active" ? "Active" : "Inactive"}
      </Badge>
    </Link>
  );
}

export default function ClientsPage() {
  const { business } = useBusiness();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<Status>("all");
  const [sort, setSort] = useState<CustomerSort>("recent");

  // The header cards come from their own small cached query, not from the loaded rows.
  const { counts } = useCustomerCounts();

  // Search runs on the server, so it covers every client and not only the loaded ones.
  const debouncedSearch = useDebouncedValue(search.trim());

  const { items, count, hasMore, isLoading, isLoadingMore, error, loadMoreError, loadMore, reload } = useClientList({
    search: debouncedSearch,
    status,
    sort,
  });

  const symbol = business?.currency ? resolveCurrency(business.currency).symbol : "";
  const hasFilters = debouncedSearch.length > 0 || status !== "all";
  const noClientsAtAll = !hasFilters && !isLoading && !error && items.length === 0;

  const addButton = (
    <Link href="/clients/new" className={btnAmber}>
      <Icon name="person_add" size={18} /> Add client
    </Link>
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Clients" subtitle="The people and businesses you invoice." actions={addButton} />

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl bg-primary-container p-5 text-white shadow-card">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/70">Total clients</p>
          <p className="mt-2 text-4xl font-extrabold">{counts ? counts.total : "..."}</p>
        </div>
        <div className="rounded-xl bg-secondary-container p-5 text-on-secondary-container shadow-card">
          <p className="text-xs font-semibold uppercase tracking-wider opacity-70">New this month</p>
          <p className="mt-2 text-4xl font-extrabold">{counts ? `+${counts.newThisMonth}` : "..."}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-outline-variant/50 bg-white p-5 shadow-card">
        <div className="relative min-w-[220px] flex-1">
          <Icon name="search" size={20} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email or phone..."
            autoComplete="off"
            className="h-12 w-full rounded-3xl border border-outline-variant/20 bg-surface-container-low pl-11 pr-4 text-body-md text-on-surface placeholder:text-outline focus:border-primary-container focus:outline-none"
          />
        </div>

        <div className="flex gap-2" role="group" aria-label="Client status">
          {(["all", "active", "inactive"] as const).map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={status === s}
              onClick={() => setStatus(s)}
              className={`rounded-full border px-4 py-2 text-sm capitalize transition-colors ${
                status === s
                  ? "border-primary-container bg-primary-container font-bold text-white"
                  : "border-outline-variant/40 bg-white font-medium text-on-surface hover:bg-surface-container-low"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <select
          aria-label="Sort clients"
          value={sort}
          onChange={(e) => setSort(e.target.value as CustomerSort)}
          className="h-12 rounded-xl border border-outline-variant/50 bg-white px-4 text-sm font-medium text-on-surface focus:border-primary-container focus:outline-none"
        >
          {SORTS.map((s) => (
            <option key={s.key} value={s.key}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {error && items.length === 0 ? (
        <div className="rounded-xl border border-outline-variant/50 bg-white shadow-card">
          <EmptyState
            icon="cloud_off"
            title="We could not load your clients"
            description="Please check your connection and try again."
            action={
              <button type="button" onClick={reload} className={btnNavy}>
                Try again
              </button>
            }
          />
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl border border-outline-variant/50 bg-surface-container-low" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-outline-variant/50 bg-white shadow-card">
          <EmptyState
            icon="person_search"
            title={noClientsAtAll ? "No clients yet" : "No clients match"}
            description={
              noClientsAtAll
                ? "Add a client and you can pick them when you create an invoice."
                : "Try a different search or filter."
            }
            action={noClientsAtAll ? addButton : undefined}
          />
        </div>
      ) : (
        <section className="rounded-xl border border-outline-variant bg-white shadow-card">
          <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 xl:grid-cols-3">
            {items.map((c) => (
              <ClientCard key={c.id} customer={c} symbol={symbol} />
            ))}
          </div>

          <LoadMoreFooter
            shown={items.length}
            total={count}
            noun="clients"
            hasMore={hasMore}
            isLoadingMore={isLoadingMore}
            loadMoreError={loadMoreError}
            onLoadMore={loadMore}
          />
        </section>
      )}
    </div>
  );
}