// components/docs/DocumentSummary.tsx
import type { ReactNode } from "react";
import { SectionCard } from "@/components/ui/SectionCard";
import type { Document } from "@/services/documents";
import { fmtShortDate } from "@/utils/formatDate";
import { fmtMoney } from "@/utils/money";

function Row({ label, children, strong = false, tone = "" }: { label: string; children: ReactNode; strong?: boolean; tone?: string }) {
  return (
    <div className={`flex justify-between gap-4 py-1.5 text-body-md ${tone}`}>
      <dt className={strong ? "font-bold text-on-surface" : "text-on-surface-variant"}>{label}</dt>
      <dd className={`text-right ${strong ? "text-lg font-extrabold text-primary" : "font-semibold text-on-surface"}`}>{children}</dd>
    </div>
  );
}

interface DocumentSummaryProps {
  doc: Document;
  symbol: string;
  creatorName: string | null;
}

export function DocumentSummary({ doc, symbol, creatorName }: DocumentSummaryProps) {
  const money = (n: number | string) => fmtMoney(Number(n) || 0, symbol, 2);
  const party = doc.customerName || doc.supplierName;
  const partyLabel = doc.documentType === "purchase_invoice" ? "Supplier" : "Billed to";
  const paid = Number(doc.amountPaid) || 0;
  const showBalance = doc.status !== "paid" && doc.status !== "deleted" && paid > 0;
  const taxRate = (Number(doc.taxRate) || 0) * 100;

  return (
    <SectionCard title="Summary">
      {party && (
        <div className="mb-4 border-b border-outline-variant pb-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{partyLabel}</p>
          <p className="mt-1 font-bold text-on-surface">{party}</p>
          {doc.customerPhone && <p className="text-xs text-on-surface-variant">{doc.customerPhone}</p>}
          {doc.customerEmail && <p className="text-xs text-on-surface-variant">{doc.customerEmail}</p>}
        </div>
      )}

      <dl>
        <Row label="Subtotal">{money(doc.subtotal)}</Row>
        {Number(doc.taxAmount) > 0 && <Row label={`Tax (${taxRate.toFixed(taxRate % 1 === 0 ? 0 : 1)}%)`}>{money(doc.taxAmount)}</Row>}
        {Number(doc.discount) > 0 && <Row label="Discount" tone="text-error">-{money(doc.discount)}</Row>}
        <div className="my-2 border-t border-outline-variant" />
        <Row label="Total" strong>{money(doc.grandTotal)}</Row>
        {showBalance && (
          <>
            <Row label="Paid so far">{money(paid)}</Row>
            <Row label="Balance due" tone="text-status-warn-fg">{money(Number(doc.grandTotal) - paid)}</Row>
          </>
        )}
      </dl>

      <dl className="mt-4 border-t border-outline-variant pt-4">
        <Row label="Created">
          {fmtShortDate(doc.createdAt)}
          {creatorName ? ` by ${creatorName}` : ""}
        </Row>
        {doc.paidAt && <Row label="Paid">{fmtShortDate(doc.paidAt)}</Row>}
        {doc.deliveredAt && <Row label="Delivered">{fmtShortDate(doc.deliveredAt)}</Row>}
      </dl>
    </SectionCard>
  );
}