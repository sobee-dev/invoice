// components/ui/StatusChip.tsx
import type { DocumentStatus } from "@/lib/documents";

const STYLES: Record<DocumentStatus, { label: string; classes: string }> = {
  draft: { label: "Draft", classes: "bg-status-draft-bg text-status-draft-fg" },
  unpaid: { label: "Unpaid", classes: "bg-status-unpaid-bg text-status-unpaid-fg" },
  paid: { label: "Paid", classes: "bg-status-paid-bg text-status-paid-fg" },
  delivered: { label: "Delivered", classes: "bg-status-info-bg text-status-info-fg" },
  deleted: { label: "Deleted", classes: "bg-status-deleted-bg text-status-deleted-fg" },
};

export function StatusChip({ status }: { status: DocumentStatus }) {
  const style = STYLES[status] ?? STYLES.draft;
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${style.classes}`}
    >
      {style.label}
    </span>
  );
}