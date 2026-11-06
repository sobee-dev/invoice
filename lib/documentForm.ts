// lib/documentForm.ts
import type { Document } from "@/services/documents";

export type DocumentKind = "sales_invoice" | "proforma_invoice" | "purchase_invoice";

export interface FormLineItem {
  id: string;
  productId?: string; // set only when the name was matched to a real product
  name: string;
  qtyStr: string;
  priceStr: string;
  qtyOnHand?: number; // known when a product was picked, used for the stock hint
}

const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `row-${Date.now()}-${Math.random().toString(16).slice(2)}`;

export function parseDecimal(value: string): number {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

export function roundMoney(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

// Digits and at most one dot, so a pasted "1,200.50abc" becomes "1200.50".
export function sanitizeDecimal(value: string): string {
  const cleaned = value.replace(/[^0-9.]/g, "");
  const [whole, ...rest] = cleaned.split(".");
  return rest.length ? `${whole}.${rest.join("")}` : whole;
}

// The local calendar date as YYYY-MM-DD. toISOString() is UTC, which is a day behind near midnight in Lagos.
export function todayIso(): string {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}

export function newItem(): FormLineItem {
  return { id: newId(), name: "", qtyStr: "1", priceStr: "" };
}

// A row nobody has touched. It is skipped on save instead of being treated as an error.
export function isBlankItem(item: FormLineItem): boolean {
  return !item.name.trim() && parseDecimal(item.priceStr) === 0;
}

export function itemsFromDocument(doc?: Document): FormLineItem[] {
  if (!doc?.items?.length) return [newItem()];
  return doc.items.map((li) => ({
    id: newId(),
    productId: li.product ?? undefined,
    name: li.description,
    qtyStr: String(li.quantity),
    priceStr: String(li.unitPrice),
  }));
}

export function editBlockedReason(doc: Document): string | null {
  if (doc.status === "deleted") return "Deleted documents can't be edited.";
  if (doc.documentType === "purchase_invoice" && doc.status === "delivered") return "Delivered supplier orders can't be edited.";
  if (doc.documentType === "sales_invoice" && doc.status !== "draft") return "Only draft sales invoices can be edited.";
  return null;
}