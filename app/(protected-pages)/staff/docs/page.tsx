// app/(staff)/staff/docs/page.tsx
"use client";

import { useState } from "react";
import { AdBanner } from "@/components/ads/AdBanner";
import { DocumentFilters } from "@/components/docs/DocumentFilters";
import { DocumentsTable } from "@/components/docs/DocumentsTable";
import { NewDocumentMenu } from "@/components/docs/NewDocumentMenu";
import { Icon } from "@/components/layout/Icon";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadMoreFooter } from "@/components/ui/LoadMoreFooter";
import { useBusiness } from "@/context/BusinessContext";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useDocuments } from "@/hooks/useDocuments";
import { DocumentStatus, DocumentType, TYPE_FILTERS } from "@/lib/documents";
import { staffDocRoute } from "@/lib/routes";

// Staff do not create supplier orders, so the chip is left out.
const STAFF_TYPE_FILTERS = TYPE_FILTERS.filter((f) => f.key !== "purchase_invoice");

export default function StaffDocsPage() {
  const { business } = useBusiness();
  const [search, setSearch] = useState("");
  const [type, setType] = useState<DocumentType | "all">("all");
  const [status, setStatus] = useState<DocumentStatus | "all">("all");

  // Search runs on the server, so it covers every document and not only the loaded ones.
  const debouncedSearch = useDebouncedValue(search.trim());

  const { rows, count, hasMore, isLoading, isLoadingMore, error, loadMore, reload } = useDocuments({
    type,
    status,
    search: debouncedSearch,
  });

  const hasFilters = search.trim().length > 0 || type !== "all" || status !== "all";
  const clearAll = () => {
    setSearch("");
    setType("all");
    setStatus("all");
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
      action={<NewDocumentMenu variant="staff" mobileAlign="center" />}
    />
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-headline-lg font-bold text-primary">Documents</h1>
          <p className="mt-1 text-body-lg text-on-surface-variant">The invoices and proformas you have created.</p>
        </div>

        {/* On mobile this group wraps onto its own line at the left edge, so the
            New Document button goes first there and its menu opens rightwards. */}
        <div className="flex gap-3 max-sm:flex-row-reverse">
          <button
            type="button"
            aria-label="Refresh documents"
            onClick={reload}
            disabled={isLoading}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-primary-container bg-white text-primary transition-colors hover:bg-surface-container-low disabled:opacity-50"
          >
            <Icon name="refresh" size={18} className={isLoading ? "animate-spin" : ""} />
          </button>
          <NewDocumentMenu variant="staff" mobileAlign="left" />
        </div>
      </div>

      <DocumentFilters
        search={search}
        onSearch={setSearch}
        type={type}
        onType={setType}
        status={status}
        onStatus={setStatus}
        hasFilters={hasFilters}
        onClear={clearAll}
        types={STAFF_TYPE_FILTERS}
      />

      <section className="rounded-xl border border-outline-variant bg-white shadow-card">
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
            hrefFor={(row) => staffDocRoute(row.id)}
            empty={emptyState}
          />
        )}

        {!isLoading && (
          <LoadMoreFooter
            shown={rows.length}
            total={count}
            noun="documents"
            hasMore={hasMore}
            isLoadingMore={isLoadingMore}
            loadMoreError={Boolean(error) && rows.length > 0}
            onLoadMore={loadMore}
          />
        )}
      </section>

      <AdBanner placement="docs-list" />
    </div>
  );
}