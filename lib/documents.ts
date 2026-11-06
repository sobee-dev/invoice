// lib/documents.ts
import type { Document, StockStatus } from "@/services/documents";
import { documentService } from "@/services/documents";
import type { RecentDocument } from "@/services/business";

export type DocumentType = "sales_invoice" | "proforma_invoice" | "purchase_invoice";
export type DocumentStatus = "draft" | "unpaid" | "paid" | "delivered" | "deleted";

// One shape for every document screen, whether it came from the dashboard
// summary or the full document list.
export interface DocumentRowData {
  id: string;
  documentNumber: string;
  documentType: DocumentType;
  status: DocumentStatus;
  counterparty: string; // customer, or supplier for supplier orders
  amount: number;
  currency: string;
  createdAt: string;
  createdBy: { id: string; displayName: string } | null;
  stockStatus?: StockStatus;
  stockDeductedAt?: string | null;
}

// The app calls a purchase invoice a Supplier Order.
export const TYPE_LABEL: Record<DocumentType, string> = {
  sales_invoice: "Sales invoice",
  proforma_invoice: "Proforma",
  purchase_invoice: "Supplier order",
};

export const TYPE_FILTERS: { key: DocumentType | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "sales_invoice", label: "Sales Invoice" },
  { key: "proforma_invoice", label: "Proforma Invoice" },
  { key: "purchase_invoice", label: "Supplier Order" },
];

export const STATUS_FILTERS: { key: DocumentStatus; label: string; dot: string }[] = [
  { key: "draft", label: "Draft", dot: "bg-on-surface-variant" },
  { key: "unpaid", label: "Unpaid", dot: "bg-status-unpaid-fg" },
  { key: "paid", label: "Paid", dot: "bg-status-paid-fg" },
  { key: "delivered", label: "Delivered", dot: "bg-primary-container" },
  { key: "deleted", label: "Deleted", dot: "bg-error" },
];

export function isDocumentType(value: string): value is DocumentType {
  return value === "sales_invoice" || value === "proforma_invoice" || value === "purchase_invoice";
}

export function isDocumentStatus(value: string): value is DocumentStatus {
  return STATUS_FILTERS.some((s) => s.key === value);
}

export function canDeductStock(row: Pick<DocumentRowData, "documentType" | "status" | "stockStatus" | "stockDeductedAt">): boolean {
  return (
    row.documentType === "sales_invoice" &&
    row.status !== "draft" &&
    row.status !== "deleted" &&
    row.stockStatus === "pending" &&
    !row.stockDeductedAt
  );
}

export function fromDocument(doc: Document): DocumentRowData {
  return {
    id: doc.id,
    documentNumber: doc.documentNumber,
    documentType: doc.documentType as DocumentType,
    status: doc.status as DocumentStatus,
    counterparty: doc.customerName || doc.supplierName || "",
    amount: Number(doc.grandTotal) || 0,
    currency: doc.currency || "",
    createdAt: doc.createdAt,
    createdBy: doc.createdBy ? { id: doc.createdBy.id, displayName: doc.createdBy.displayName } : null,
    stockStatus: doc.stockStatus,
    stockDeductedAt: doc.stockDeductedAt ?? null,
  };
}

export function fromRecentDocument(doc: RecentDocument): DocumentRowData {
  return {
    id: doc.id,
    documentNumber: doc.documentNumber,
    documentType: doc.documentType,
    status: doc.status,
    counterparty: doc.clientName,
    amount: doc.totalAmount,
    currency: doc.currency,
    createdAt: doc.createdAt,
    createdBy: doc.createdBy ? { id: doc.createdBy.id, displayName: doc.createdBy.displayName } : null,
  };
}

export interface DocumentPage {
  rows: DocumentRowData[];
  count: number | null; // total across all pages, when the backend reports it
  hasMore: boolean;
}

// Newest first, filtered by type and status on the server. Search is done on
// the loaded rows, because only those filters are known to be supported.
export async function fetchDocumentPage(params: {
  page: number;
  type?: DocumentType | "all";
  status?: DocumentStatus | "all";
  search?: string;
  customer?: string; // limit to one client's documents
}): Promise<DocumentPage> {
  const query: Record<string, unknown> = { ordering: "-document_date", page: params.page };
  if (params.type && params.type !== "all") query.documentType = params.type;
  if (params.status && params.status !== "all") query.status = params.status;
  if (params.search && params.search.trim()) query.search = params.search.trim();
  if (params.customer) query.customer = params.customer;
  const data: any = await documentService.list(query as any);
  const results: Document[] = Array.isArray(data) ? data : data?.results ?? [];

  return {
    rows: results.map(fromDocument),
    count: Array.isArray(data) ? results.length : typeof data?.count === "number" ? data.count : null,
    hasMore: !Array.isArray(data) && Boolean(data?.next),
  };
}