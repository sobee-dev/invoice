// components/payments/StockBadge.tsx
import { Icon } from "@/components/layout/Icon";
import type { StockStatus } from "@/services/documents";

const STYLES: Record<Exclude<StockStatus, "not_applicable">, { cls: string; icon: string; label: string }> = {
  deducted: { cls: "bg-status-paid-bg text-status-paid-fg", icon: "check_circle", label: "Stock deducted" },
  partial: { cls: "bg-status-warn-bg text-status-warn-fg", icon: "inventory_2", label: "Part deducted" },
  pending: { cls: "bg-status-draft-bg text-status-draft-fg", icon: "inventory_2", label: "Not deducted" },
};

/** Shows whether a document's items have been taken out of stock.
 *  Renders nothing for documents that do not track stock. */
export function StockBadge({ status, compact = false }: { status?: StockStatus | null; compact?: boolean }) {
  if (!status || status === "not_applicable") return null;
  const s = STYLES[status];
  return (
    <span
      title={s.label}
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.cls}`}
    >
      <Icon name={s.icon} size={14} />
      {!compact && s.label}
    </span>
  );
}