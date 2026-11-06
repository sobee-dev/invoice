// app/(owner)/docs/page.tsx
"use client";

import { useEffect, useState } from "react";
import { AdBanner } from "@/components/ads/AdBanner";
import { Icon } from "@/components/layout/Icon";
import { DocumentFilters } from "@/components/docs/DocumentFilters";
import { DocumentsTable } from "@/components/docs/DocumentsTable";
import { NewDocumentMenu } from "@/components/docs/NewDocumentMenu";
import { EmptyState } from "@/components/ui/EmptyState";
import { useBusiness } from "@/context/BusinessContext";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useDeductStock } from "@/hooks/useDeductStock";
import { useDocuments } from "@/hooks/useDocuments";
import { DocumentStatus, DocumentType, isDocumentStatus, isDocumentType } from "@/lib/documents";
import { customerService } from "@/services/customers";
import { exportDocumentsCsv } from "@/utils/exportCsv";

export default function DocsPage() {
  const { business } = useBusiness();
  const { actionsFor, overlay } = useDeductStock();
  const [search, setSearch] = useState("");
  const [type, setType] = useState<DocumentType | "all">("all");
  const [status, setStatus] = useState<DocumentStatus | "all">("all");
  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [ready, setReady] = useState(false);

  // Read the starting filters from the URL once, before the first fetch.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const s = params.get("search");
    const t = params.get("type");
    const st = params.get("status");
    const c = params.get("customer");
    if (s) setSearch(s);
    if (t && isDocumentType(t)) setType(t);
    if (st && isDocumentStatus(st)) setStatus(st);
    if (c) setCustomerId(c);
    setReady(true);
  }, []);

  // Show whose documents these are when the page was opened from a client.
  useEffect(() => {
    if (!customerId) {
      setCustomerName("");
      return;
    }
    let cancelled = false;
    customerService
      .get(customerId)
      .then((c) => {
        if (!cancelled) setCustomerName(c.fullName);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [customerId]);

  // Search runs on the server, so it covers every document and not only the loaded ones.
  const debouncedSearch = useDebouncedValue(search.trim());

  const { rows, count, hasMore, isLoading, isLoadingMore, error, loadMore, reload } = useDocuments({
    type,
    status,
    search: debouncedSearch,
    customer: customerId || undefined,
    enabled: ready,
  });

  const hasFilters = search.trim().length > 0 || type !== "all" || status !== "all" || customerId !== "";
  const clearAll = () => {
    setSearch("");
    setType("all");
    setStatus("all");
    setCustomerId("");
  };

  const showError = error && rows.length === 0 && !isLoading;

  const emptyState = hasFilters ? (
    <EmptyState
      icon="find_in_page"
      title="No documents match your filters"
      description="Try a different search, or clear the filters to see everything."
      action={
        <button
          type="button"
          onClick={clearAll}
          className="h-10 rounded-lg border border-primary-container px-4 text-sm font-semibold text-primary hover:bg-surface-container-low"
        >
          Clear filters
        </button>
      }
    />
  ) : (
    <EmptyState
      icon="description"
      title="No documents yet"
      description="Create your first invoice and it will show up here."
      action={<NewDocumentMenu />}
    />
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-headline-lg font-bold text-primary">Documents</h1>
          <p className="mt-1 text-body-lg text-on-surface-variant">Invoices, proformas and supplier orders.</p>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            aria-label="Refresh documents"
            onClick={reload}
            disabled={isLoading}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-primary-container bg-white text-primary transition-colors hover:bg-surface-container-low disabled:opacity-50"
          >
            <Icon name="refresh" size={18} className={isLoading ? "animate-spin" : ""} />
          </button>
          <button
            type="button"
            onClick={() => exportDocumentsCsv(rows)}
            disabled={rows.length === 0}
            className="flex h-10 items-center gap-2 rounded-lg border border-primary-container bg-white px-4 text-sm font-medium text-primary transition-colors hover:bg-surface-container-low disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Icon name="download" size={16} /> Export
          </button>
          <NewDocumentMenu />
        </div>
      </div>

      {customerId && (
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary-fixed py-1.5 pl-4 pr-2 text-sm font-semibold text-primary-container">
            Client: {customerName || "Loading..."}
            <button
              type="button"
              aria-label="Show documents for all clients"
              onClick={() => setCustomerId("")}
              className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-white/60"
            >
              <Icon name="close" size={16} />
            </button>
          </span>
        </div>
      )}

      <DocumentFilters
        search={search}
        onSearch={setSearch}
        type={type}
        onType={setType}
        status={status}
        onStatus={setStatus}
        hasFilters={hasFilters}
        onClear={clearAll}
      />

      <section className="rounded-xl border border-outline-variant/50 bg-white shadow-card">
        {showError ? (
          <EmptyState
            icon="cloud_off"
            title="We could not load your documents"
            description="Please check your connection and try again."
            action={
              <button
                type="button"
                onClick={reload}
                className="h-10 rounded-lg bg-primary-container px-5 text-sm font-semibold text-white hover:bg-primary"
              >
                Try again
              </button>
            }
          />
        ) : (
          <DocumentsTable
            rows={rows}
            fallbackCurrency={business?.currency ?? "USD"}
            isLoading={isLoading}
            rowActions={actionsFor}
            empty={emptyState}
          />
        )}

        {!isLoading && rows.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant px-6 py-4">
            <p className="text-body-md text-on-surface-variant">
              Showing {rows.length} of {count ?? rows.length} documents.
            </p>

            <div className="flex items-center gap-3">
              {error && <p className="text-body-md text-error">Could not load more documents.</p>}
              {hasMore && (
                <button
                  type="button"
                  onClick={loadMore}
                  disabled={isLoadingMore}
                  className="h-10 rounded-lg border border-primary-container bg-white px-4 text-sm font-semibold text-primary transition-colors hover:bg-surface-container-low disabled:opacity-50"
                >
                  {isLoadingMore ? "Loading..." : "Load more"}
                </button>
              )}
            </div>
          </div>
        )}
      </section>

      <AdBanner placement="docs-list" />

      {overlay}
    </div>
  );
}