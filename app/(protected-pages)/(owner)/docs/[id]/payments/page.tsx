// app/(owner)/docs/[id]/payments/page.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Icon } from "@/components/layout/Icon";
import { RecordPaymentDialog } from "@/components/payments/RecordPaymentDialog";
import { StockBadge } from "@/components/payments/StockBadge";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { Toast, ToastState } from "@/components/ui/Toast";
import { btnAmber, btnNavy, btnOutline, inputClasses, labelClasses } from "@/components/ui/buttonStyles";
import { useBusiness } from "@/context/BusinessContext";
import { clientPaymentsRoute, ROUTES } from "@/lib/routes";
import {
  InvoiceHistory,
  InvoiceHistoryItem,
  paymentService,
  PAYMENT_METHOD_LABEL,
} from "@/services/payments";
import { resolveCurrency } from "@/utils/currencySymbol";
import { fmtShortDate } from "@/utils/formatDate";
import { getApiErrorMessage } from "@/utils/getErrorMessage";
import { fmtMoney } from "@/utils/money";
import { formatQty, toNumber } from "@/utils/paymentFormat";

type LoadState = "loading" | "ready" | "missing" | "error";

function Row({ label, value, strong = false, tone }: { label: string; value: string; strong?: boolean; tone?: string }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <dt className={strong ? "text-base font-bold text-on-surface" : "text-sm text-on-surface-variant"}>{label}</dt>
      <dd className={`${strong ? "text-xl font-extrabold" : "text-sm font-semibold"} ${tone ?? "text-on-surface"}`}>{value}</dd>
    </div>
  );
}

interface ReturnDialogProps {
  item: InvoiceHistoryItem | null;
  symbol: string;
  onClose: () => void;
  onSubmit: (item: InvoiceHistoryItem, quantity: string, reason: string) => Promise<void>;
}

function ReturnDialog({ item, symbol, onClose, onSubmit }: ReturnDialogProps) {
  const [qty, setQty] = useState("1");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (item) {
      setQty("1");
      setReason("");
      setError("");
      setSaving(false);
    }
  }, [item?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!item) return null;
  const max = toNumber(item.returnable);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = Number(qty);
    if (!/^\d+(\.\d{1,3})?$/.test(qty.trim()) || parsed <= 0 || parsed > max) {
      setError(`Enter a quantity between 0.001 and ${formatQty(max)}.`);
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSubmit(item, qty.trim(), reason.trim());
    } catch (err: any) {
      setError(getApiErrorMessage(err, "Could not return this item. Please try again."));
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="return-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !saving) onClose();
      }}
    >
      <form onSubmit={submit} className="w-full max-w-md rounded-xl bg-white p-6 shadow-modal">
        <h2 id="return-title" className="text-xl font-bold text-primary">
          Return item
        </h2>
        <p className="mt-1 text-sm text-on-surface-variant">
          {item.description}. The units go back into stock and the balance on this invoice goes down.
        </p>

        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor="return-qty" className={labelClasses}>
              Quantity (up to {formatQty(max)})
            </label>
            <input
              id="return-qty"
              inputMode="decimal"
              autoFocus
              value={qty}
              onChange={(e) => setQty(e.target.value.replace(/[^0-9.]/g, ""))}
              className={`${inputClasses} h-11`}
            />
            <p className="mt-1 text-xs text-on-surface-variant">
              Unit price {fmtMoney(toNumber(item.unitPrice), symbol, 2)}. The exact credit, including any tax and discount share, is worked out when you save.
            </p>
          </div>
          <div>
            <label htmlFor="return-reason" className={labelClasses}>
              Reason (optional)
            </label>
            <input
              id="return-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={200}
              placeholder="e.g. damaged on delivery"
              className={`${inputClasses} h-11`}
            />
          </div>
        </div>

        {error && (
          <p role="alert" className="mt-4 rounded-lg border border-error/30 bg-error-container px-3 py-2 text-sm text-error">
            {error}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} disabled={saving} className={btnOutline}>
            Cancel
          </button>
          <button type="submit" disabled={saving} className={btnNavy}>
            <Icon name="assignment_return" size={18} /> {saving ? "Saving..." : "Mark returned"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function InvoicePaymentsPage() {
  const { id } = useParams<{ id: string }>();
  const { business } = useBusiness();

  const [history, setHistory] = useState<InvoiceHistory | null>(null);
  const [state, setState] = useState<LoadState>("loading");
  const [payOpen, setPayOpen] = useState(false);
  const [returnItem, setReturnItem] = useState<InvoiceHistoryItem | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const dismissToast = useCallback(() => setToast(null), []);

  const load = useCallback(async () => {
    try {
      setHistory(await paymentService.invoiceHistory(id));
      setState("ready");
    } catch (err: any) {
      setState(err?.response?.status === 404 ? "missing" : "error");
    }
  }, [id]);

  useEffect(() => {
    setState("loading");
    load();
  }, [load]);

  if (state === "loading") {
    return <div className="h-96 animate-pulse rounded-xl border border-outline-variant bg-surface-container-low" />;
  }

  if (state !== "ready" || !history) {
    return (
      <div className="rounded-xl border border-outline-variant bg-white shadow-card">
        <EmptyState
          icon={state === "missing" ? "find_in_page" : "cloud_off"}
          title={state === "missing" ? "Invoice not found" : "We could not load the payment history"}
          description={state === "missing" ? "It may have been removed." : "Please check your connection and try again."}
          action={
            <Link href={ROUTES.docs} className={btnNavy}>
              Back to documents
            </Link>
          }
        />
      </div>
    );
  }

  const { invoice, items, payments, returns } = history;
  const symbol = resolveCurrency(invoice.currency || business?.currency || "").symbol;
  const balance = toNumber(invoice.balanceDue);
  const isUnpaid = invoice.status === "unpaid";
  const canPay = isUnpaid && balance > 0 && !!invoice.customer;
  const money = (v: string | number) => fmtMoney(toNumber(v), symbol, 2);

  const handleReturn = async (item: InvoiceHistoryItem, quantity: string, reason: string) => {
    const next = await paymentService.returnItems(id, { items: [{ itemId: item.id, quantity }], reason });
    setHistory(next);
    setReturnItem(null);
    setToast({ tone: "success", text: "Item returned to stock. The balance has been updated." });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payment history"
        subtitle={`${invoice.documentNumber} · Issued ${fmtShortDate(invoice.documentDate)}`}
        backHref={`${ROUTES.docs}/${invoice.id}`}
        backLabel={invoice.documentNumber}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <StockBadge status={invoice.stockStatus} />
            {canPay && (
              <button type="button" onClick={() => setPayOpen(true)} className={btnAmber}>
                <Icon name="payments" size={18} /> Record payment
              </button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-6">
          <SectionCard title="Items on this invoice" bodyClassName="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="bg-surface-container-low text-xs uppercase tracking-wider text-on-surface-variant">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Item</th>
                    <th className="px-3 py-3 text-right font-semibold">Qty</th>
                    <th className="px-3 py-3 text-right font-semibold">Deducted</th>
                    <th className="px-3 py-3 text-right font-semibold">Returned</th>
                    <th className="px-5 py-3 text-right font-semibold">Total</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/60">
                  {items.map((item) => {
                    const returnable = toNumber(item.returnable);
                    return (
                      <tr key={item.id}>
                        <td className="px-5 py-3 font-medium text-on-surface">
                          {item.description}
                          <span className="block text-xs font-normal text-on-surface-variant">{money(item.unitPrice)} each</span>
                        </td>
                        <td className="px-3 py-3 text-right">{formatQty(item.quantity)}</td>
                        <td className="px-3 py-3 text-right">{formatQty(item.quantityDeducted)}</td>
                        <td className={`px-3 py-3 text-right ${toNumber(item.quantityReturned) > 0 ? "font-semibold text-error" : ""}`}>
                          {formatQty(item.quantityReturned)}
                        </td>
                        <td className="px-5 py-3 text-right font-semibold">{money(item.total)}</td>
                        <td className="px-5 py-3 text-right">
                          {isUnpaid && returnable > 0 && (
                            <button
                              type="button"
                              onClick={() => setReturnItem(item)}
                              className="rounded-full border border-primary-container px-3 py-1 text-xs font-bold text-primary-container hover:bg-surface-container-low"
                            >
                              Return
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </SectionCard>

          <SectionCard title="Payments" bodyClassName="p-0">
            {payments.length === 0 ? (
              <EmptyState icon="payments" title="No payments yet" description="Payments recorded against this invoice show up here." />
            ) : (
              <ul className="divide-y divide-outline-variant/60">
                {payments.map((p) => (
                  <li key={p.id} className={`flex items-center gap-4 px-5 py-4 ${p.voidedAt ? "opacity-55" : ""}`}>
                    <div className="min-w-0 flex-1">
                      <p className={`font-bold text-on-surface ${p.voidedAt ? "line-through" : ""}`}>{money(p.amount)}</p>
                      <p className="text-xs text-on-surface-variant">
                        {PAYMENT_METHOD_LABEL[p.method] ?? p.method} · {fmtShortDate(p.createdAt)}
                        {p.reference ? ` · ${p.reference}` : ""}
                        {p.recordedByName ? ` · ${p.recordedByName}` : ""}
                      </p>
                    </div>
                    {p.voidedAt && <Badge tone="red">Voided</Badge>}
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          {returns.length > 0 && (
            <SectionCard title="Returned items" bodyClassName="p-0">
              <ul className="divide-y divide-outline-variant/60">
                {returns.map((r) => (
                  <li key={r.id} className="flex items-center gap-4 px-5 py-4">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-on-surface">
                        {r.description} x {formatQty(r.quantity)}
                      </p>
                      <p className="text-xs text-on-surface-variant">
                        {fmtShortDate(r.createdAt)}
                        {r.reason ? ` · ${r.reason}` : ""}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-error">-{money(r.creditAmount)}</p>
                  </li>
                ))}
              </ul>
            </SectionCard>
          )}
        </div>

        <aside className="space-y-6 xl:sticky xl:top-[94px] xl:self-start">
          <SectionCard title="Summary">
            {invoice.customer ? (
              <Link
                href={clientPaymentsRoute(invoice.customer)}
                className="mb-3 flex items-center justify-between text-base font-bold text-primary hover:underline"
              >
                {invoice.customerName}
                <Icon name="chevron_right" size={18} />
              </Link>
            ) : (
              <p className="mb-3 text-base font-bold text-on-surface">{invoice.customerName || "No customer"}</p>
            )}
            <dl>
              <Row label="Invoice total" value={money(invoice.grandTotal)} />
              <Row label="Returned items" value={`-${money(invoice.returnedCredit)}`} />
              <Row label="Paid so far" value={`-${money(invoice.amountPaid)}`} />
              <div className="my-2 h-px bg-outline-variant" />
              <Row
                label="Balance due"
                value={money(balance)}
                strong
                tone={balance > 0 ? "text-error" : "text-status-paid-fg"}
              />
            </dl>
          </SectionCard>
        </aside>
      </div>

      {invoice.customer && (
        <RecordPaymentDialog
          open={payOpen}
          onClose={() => setPayOpen(false)}
          onRecorded={() => {
            load();
            setToast({ tone: "success", text: "Payment recorded." });
          }}
          customerId={invoice.customer}
          customerName={invoice.customerName}
          symbol={symbol}
          maxAmount={balance}
          invoice={{ id: invoice.id, documentNumber: invoice.documentNumber, balanceDue: balance }}
        />
      )}

      <ReturnDialog item={returnItem} symbol={symbol} onClose={() => setReturnItem(null)} onSubmit={handleReturn} />
      <Toast toast={toast} onDismiss={dismissToast} />
    </div>
  );
}