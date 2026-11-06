// components/clients/ClientRecentDocuments.tsx
"use client";

import Link from "next/link";
import { Icon } from "@/components/layout/Icon";
import { NewDocumentMenu } from "@/components/docs/NewDocumentMenu";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusChip } from "@/components/ui/StatusChip";

import { DocumentType, TYPE_LABEL } from "@/lib/documents";
import { ROUTES } from "@/lib/routes";
import type { Customer } from "@/services/customers";
import type { Document } from "@/services/documents";
import { resolveCurrency } from "@/utils/currencySymbol";
import { fmtShortDate } from "@/utils/formatDate";
import { fmtMoney } from "@/utils/money";

const TYPE_ICON: Record<DocumentType, string> = {
  sales_invoice: "receipt_long",
  proforma_invoice: "description",
  purchase_invoice: "inventory",
};

interface ClientRecentDocumentsProps {
  client: Customer;
  docs: Document[]; // newest first, deleted ones already removed
  fallbackCurrency: string;
  isLoading: boolean;
  failed: boolean;
  onRetry: () => void;
}

export function ClientRecentDocuments({ client, docs, fallbackCurrency, isLoading, failed, onRetry }: ClientRecentDocumentsProps) {
  
  const recent = docs.slice(0, 5);

  return (
    <SectionCard title="Recent documents" action={<NewDocumentMenu customer={client} compact />} bodyClassName="p-0">
      {isLoading ? (
        <ul className="divide-y divide-outline-variant">
          {Array.from({ length: 3 }).map((_, i) => (
            <li key={i} className="flex items-center gap-3 px-6 py-4">
              <div className="h-10 w-10 animate-pulse rounded-lg bg-surface-container" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-1/2 animate-pulse rounded bg-surface-container" />
                <div className="h-3 w-1/3 animate-pulse rounded bg-surface-container" />
              </div>
            </li>
          ))}
        </ul>
      ) : failed ? (
        <EmptyState
          icon="cloud_off"
          title="We could not load documents"
          action={
            <button type="button" onClick={onRetry} className="h-10 rounded-lg bg-primary-container px-5 text-sm font-semibold text-white hover:bg-primary">
              Try again
            </button>
          }
        />
      ) : recent.length === 0 ? (
        <EmptyState icon="description" title="No documents yet" description={`Create an invoice for ${client.fullName} with the plus button.`} />
      ) : (
        <ul className="divide-y divide-outline-variant">
          {recent.map((doc) => {
            const symbol = resolveCurrency(doc.currency || fallbackCurrency).symbol;
            return (
              <li key={doc.id}>
                <Link
                  href={`${ROUTES.docs}/${doc.id}`}
                  className="flex items-center gap-3 px-6 py-4 hover:bg-surface-container-low/60"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-container-low text-on-surface-variant">
                    <Icon name={TYPE_ICON[doc.documentType as DocumentType] ?? "description"} size={20} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-bold text-primary">{doc.documentNumber}</span>
                    <span className="block text-xs text-on-surface-variant">
                      {fmtShortDate(doc.createdAt)} · {TYPE_LABEL[doc.documentType as DocumentType] ?? doc.documentType}
                    </span>
                  </span>
                  <span className="flex flex-col items-end gap-1">
                    <span className="text-sm font-bold text-on-surface">{fmtMoney(Number(doc.grandTotal) || 0, symbol, 2)}</span>
                    <StatusChip status={doc.status} />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <div className="border-t border-outline-variant px-6 py-4 text-center">
        <Link
          href={`${ROUTES.docs}?customer=${client.id}`}
          className="text-sm font-semibold text-primary hover:underline"
        >
          View all documents
        </Link>
      </div>
    </SectionCard>
  );
}