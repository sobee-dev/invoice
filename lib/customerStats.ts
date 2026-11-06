// lib/customerStats.ts
import type { DocumentType } from "@/lib/documents";
import type { Document } from "@/services/documents";
import { resolveCurrency } from "@/utils/currencySymbol";

export interface TimelinePoint {
  key: string;
  label: string;
  value: number;
}

const monthKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}`;

// documentDate is a plain date such as "2026-10-16". Parse it as local time so it never slips a day.
function documentDay(doc: Document): Date {
  const raw = doc.documentDate || doc.createdAt;
  const d = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? new Date(`${raw}T00:00:00`) : new Date(raw);
  return Number.isNaN(d.getTime()) ? new Date(doc.createdAt) : d;
}

// Paid sales invoices summed per month, oldest first, ending with this month.
// Invoices in another currency are left out and counted, so they are never added as if they matched.
export function paidMonthlyTotals(docs: Document[], currencyCode: string, months: number) {
  const now = new Date();
  const points: TimelinePoint[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    points.push({ key: monthKey(d), label: d.toLocaleDateString("en-US", { month: "short" }), value: 0 });
  }
  const indexByKey = new Map(points.map((p, i) => [p.key, i]));

  let excluded = 0;
  for (const doc of docs) {
    if (doc.documentType !== "sales_invoice" || doc.status !== "paid") continue;
    if (doc.currency && resolveCurrency(doc.currency).code !== currencyCode) {
      excluded += 1;
      continue;
    }
    const index = indexByKey.get(monthKey(documentDay(doc)));
    if (index !== undefined) points[index].value += Number(doc.grandTotal) || 0;
  }
  return { points, excluded };
}

export type ActivityKind = "created" | "paid" | "delivered";

export interface ActivityEvent {
  id: string;
  kind: ActivityKind;
  at: string;
  documentId: string;
  documentNumber: string;
  documentType: DocumentType;
}

// Paid and delivered events appear only when the documents list returns paidAt and deliveredAt.
export function buildActivity(docs: Document[]): ActivityEvent[] {
  const events: ActivityEvent[] = [];
  for (const doc of docs) {
    if (doc.status === "deleted") continue;
    const base = {
      documentId: doc.id,
      documentNumber: doc.documentNumber,
      documentType: doc.documentType as DocumentType,
    };
    events.push({ ...base, id: `${doc.id}:created`, kind: "created", at: doc.createdAt });
    if (doc.paidAt) events.push({ ...base, id: `${doc.id}:paid`, kind: "paid", at: doc.paidAt });
    if (doc.deliveredAt) events.push({ ...base, id: `${doc.id}:delivered`, kind: "delivered", at: doc.deliveredAt });
  }
  return events.sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
}

export function timeAgo(iso: string): string {
  const ms = Date.now() - Date.parse(iso);
  if (!Number.isFinite(ms)) return "";
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}