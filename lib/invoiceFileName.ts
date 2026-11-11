// lib/invoiceFileName.ts
import type { DocumentType } from "@/services/documents";

const TYPE_SLUG: Record<DocumentType, string> = {
  sales_invoice: "Invoice",
  proforma_invoice: "Proforma-Invoice",
  purchase_invoice: "Supplier-Order",
};

const slug = (text: string) =>
  text
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents
    .replace(/[^A-Za-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/** File name without the extension, for example "Acme-Foods_Invoice_INV-0042". */
export function invoiceFileBase(
  doc: { documentType: DocumentType; documentNumber: string },
  businessName?: string,
): string {
  const business = businessName ? slug(businessName).slice(0, 30).replace(/-+$/g, "") : "";
  const parts = [business, TYPE_SLUG[doc.documentType], slug(doc.documentNumber) || "document"].filter(Boolean);
  return parts.join("_");
}