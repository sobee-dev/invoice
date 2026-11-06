// lib/inventory.ts
import type { InventoryTransaction, TransactionType } from "@/services/inventory";

export const TX_META: Record<TransactionType, { title: string; icon: string; tile: string }> = {
  sales_confirmed: { title: "Sale confirmed", icon: "shopping_cart", tile: "bg-secondary-fixed text-secondary" },
  purchase_received: { title: "Purchase received", icon: "add_shopping_cart", tile: "bg-primary-fixed text-primary-container" },
  adjustment: { title: "Stock adjustment", icon: "tune", tile: "bg-tertiary-fixed text-on-tertiary-fixed-variant" },
};

export const HISTORY_TABS: { key: TransactionType | "all"; label: string }[] = [
  { key: "all", label: "All history" },
  { key: "sales_confirmed", label: "Sales" },
  { key: "purchase_received", label: "Purchases" },
  { key: "adjustment", label: "Adjustments" },
];

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export function dateGroupLabel(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  const shortDate = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  if (sameDay(date, now)) return `Today, ${shortDate}`;
  if (sameDay(date, yesterday)) return `Yesterday, ${shortDate}`;
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

export function timeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export function groupByDate(txs: InventoryTransaction[]): { label: string; items: InventoryTransaction[] }[] {
  const map = new Map<string, InventoryTransaction[]>();
  for (const t of txs) {
    const label = dateGroupLabel(t.createdAt);
    if (!map.has(label)) map.set(label, []);
    map.get(label)!.push(t);
  }
  return Array.from(map.entries()).map(([label, items]) => ({ label, items }));
}

// The history API uses cursor paging. "next" is a full URL, and only its cursor is needed.
export function cursorFromUrl(next: string | null): string | null {
  if (!next) return null;
  try {
    return new URL(next, window.location.origin).searchParams.get("cursor");
  } catch {
    return null;
  }
}