// components/dashboard/RecentDocuments.tsx
"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Icon } from "@/components/layout/Icon";
import { DocumentsTable } from "@/components/docs/DocumentsTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionCard } from "@/components/ui/SectionCard";

import { useDeductStock } from "@/hooks/useDeductStock";
import { fromRecentDocument } from "@/lib/documents";
import { ROUTES } from "@/lib/routes";
import type { RecentDocument } from "@/services/business";

interface RecentDocumentsProps {
  docs: RecentDocument[];
  fallbackCurrency: string;
  isLoading?: boolean;
  failed?: boolean;
  onRetry?: () => void;
}

export function RecentDocuments({ docs, fallbackCurrency, isLoading = false, failed = false, onRetry }: RecentDocumentsProps) {
  
  const { actionsFor, overlay } = useDeductStock();
  const rows = useMemo(() => docs.map(fromRecentDocument), [docs]);

  return (
    <SectionCard
      title="Recent Documents"
      divided
      bodyClassName="p-0"
      action={
        <Link href={ROUTES.docs} className="text-sm font-semibold text-primary hover:underline">
          View All
        </Link>
      }
    >
      {failed ? (
        <EmptyState
          icon="cloud_off"
          title="We could not load your recent documents"
          action={
            onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="h-10 rounded-lg bg-primary-container px-5 text-sm font-semibold text-white hover:bg-primary"
              >
                Try again
              </button>
            )
          }
        />
      ) : (
        <DocumentsTable
          rows={rows}
          fallbackCurrency={fallbackCurrency}
          isLoading={isLoading}
          skeletonRows={4}
          rowActions={actionsFor}
          empty={
            <EmptyState
              icon="description"
              title="No documents yet"
              description="Your latest invoices will appear here."
              action={
                <Link
                  href={ROUTES.newSalesInvoice}
                  className="inline-flex h-10 items-center gap-2 rounded-lg bg-secondary px-4 text-sm font-semibold text-white"
                >
                  <Icon name="add" size={18} /> Create Invoice
                </Link>
              }
            />
          }
        />
      )}
      {overlay}
    </SectionCard>
  );
}