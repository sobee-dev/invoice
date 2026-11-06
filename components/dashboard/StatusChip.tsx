import { RecentDocument } from '@/services/business';

type Kind = 'paid' | 'pending' | 'issued' | 'overdue' | 'draft' | 'delivered' | 'deleted';

const STYLE: Record<Kind, { label: string; cls: string }> = {
  paid: { label: 'PAID', cls: 'bg-[#dcf2e1] text-status-paid-fg' },
  pending: { label: 'PENDING', cls: 'bg-[#fdf0c4] text-[#8a6100]' },
  issued: { label: 'ISSUED', cls: 'bg-[#e0eaff] text-[#1a4fc4]' },
  overdue: { label: 'OVERDUE', cls: 'bg-[#fde3e1] text-[#c5221f]' }, // needs a dueDate from the API
  draft: { label: 'DRAFT', cls: 'bg-status-draft-bg text-status-draft-fg' },
  delivered: { label: 'DELIVERED', cls: 'bg-[#dcf2e1] text-status-paid-fg' },
  deleted: { label: 'DELETED', cls: 'bg-error-container text-error' },
};

export function resolveKind(doc: Pick<RecentDocument, 'status' | 'documentType'>): Kind {
  if (doc.status === 'unpaid') return doc.documentType === 'purchase_invoice' ? 'issued' : 'pending';
  return doc.status as Kind;
}

export function StatusChip({ doc }: { doc: Pick<RecentDocument, 'status' | 'documentType'> }) {
  const s = STYLE[resolveKind(doc)] ?? STYLE.draft;
  return (
    <span className={`inline-block rounded-full px-2.5 py-[5px] text-[10px] font-bold uppercase leading-[10px] tracking-wide ${s.cls}`}>
      {s.label}
    </span>
  );
}
