// app/(owner)/clients/[id]/payments/page.tsx
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
import { btnAmber, btnDanger, btnNavy, btnOutline, inputClasses, labelClasses } from "@/components/ui/buttonStyles";
import { useAuth } from "@/context/AuthContext";
import { useBusiness } from "@/context/BusinessContext";
import { invoicePaymentsRoute } from "@/lib/routes";
import { Customer, customerService } from "@/services/customers";
import { OutstandingInvoice, Payment, paymentService, PAYMENT_METHOD_LABEL } from "@/services/payments";
import { resolveCurrency } from "@/utils/currencySymbol";
import { fmtShortDate } from "@/utils/formatDate";
import { getApiErrorMessage } from "@/utils/getErrorMessage";
import { fmtMoney } from "@/utils/money";
import { toNumber } from "@/utils/paymentFormat";

type LoadState = "loading" | "ready" | "missing" | "error";
const PAGE_SIZE = 20;

export default function ClientPaymentsPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { business } = useBusiness();
  const symbol = business?.currency ? resolveCurrency(business.currency).symbol : "";
  const money = (v: string | number) => fmtMoney(toNumber(v), symbol, 2);
  const isOwner = user?.role === "owner";

  const [client, setClient] = useState<Customer | null>(null);
  const [outstanding, setOutstanding] = useState(0);
  const [invoices, setInvoices] = useState<OutstandingInvoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [state, setState] = useState<LoadState>("loading");
  const [payOpen, setPayOpen] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const dismissToast = useCallback(() => setToast(null), []);

  const [voidTarget, setVoidTarget] = useState<Payment | null>(null);
  const [voidReason, setVoidReason] = useState("");
  const [voiding, setVoiding] = useState(false);
  const [voidError, setVoidError] = useState("");

  const load = useCallback(async () => {
    try {
      const [c, page, open] = await Promise.all([
        customerService.get(id),
        paymentService.customerPayments(id, { limit: PAGE_SIZE, offset: 0 }),
        paymentService.outstanding({ customer: id, limit: 100 }),
      ]);
      setClient(c);
      setPayments(page.results);
      setHasMore(!!page.next);
      setOutstanding(toNumber(page.summary.outstandingBalance));
      setInvoices(open.results);
      setState("ready");
    } catch (err: any) {
      setState(err?.response?.status === 404 ? "missing" : "error");
    }
  }, [id]);

  useEffect(() => {
    setState("loading");
    load();
  }, [load]);

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const page = await paymentService.customerPayments(id, { limit: PAGE_SIZE, offset: payments.length });
      setPayments((prev) => [...prev, ...page.results]);
      setHasMore(!!page.next);
    } catch (err: any) {
      setToast({ tone: "error", text: getApiErrorMessage(err, "Could not load more payments.") });
    } finally {
      setLoadingMore(false);
    }
  };

  const submitVoid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voidTarget) return;
    if (!voidReason.trim()) {
      setVoidError("Say why this payment is being voided.");
      return;
    }
    setVoiding(true);
    setVoidError("");
    try {
      await paymentService.voidPayment(voidTarget.id, voidReason.trim());
      setVoidTarget(null);
      setVoidReason("");
      setToast({ tone: "success", text: "Payment voided. The amount is owed again." });
      await load();
    } catch (err: any) {
      setVoidError(getApiErrorMessage(err, "Could not void this payment. Please try again."));
    } finally {
      setVoiding(false);
    }
  };

  if (state === "loading") {
    return <div className="h-96 animate-pulse rounded-xl border border-outline-variant bg-surface-container-low" />;
  }

  if (state !== "ready" || !client) {
    return (
      <div className="rounded-xl border border-outline-variant bg-white shadow-card">
        <EmptyState
          icon={state === "missing" ? "person_search" : "cloud_off"}
          title={state === "missing" ? "Client not found" : "We could not load this client's payments"}
          description={state === "missing" ? "They may have been removed." : "Please check your connection and try again."}
          action={
            <Link href="/clients" className={btnNavy}>
              Back to clients
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payment history"
        subtitle={client.fullName}
        backHref={`/clients/${client.id}`}
        backLabel={client.fullName}
        actions={
          <button type="button" onClick={() => setPayOpen(true)} disabled={outstanding <= 0} className={btnAmber}>
            <Icon name="add_card" size={18} /> Record payment
          </button>
        }
      />

      <div className={`rounded-xl p-6 text-white shadow-card ${outstanding > 0 ? "bg-primary-container" : "bg-status-paid-fg"}`}>
        <p className="text-xs font-semibold uppercase tracking-wider text-white/70">Outstanding</p>
        <p className="mt-1 text-4xl font-extrabold">{money(outstanding)}</p>
        <p className="mt-1 text-sm text-white/80">
          {invoices.length === 0
            ? "Nothing owed right now."
            : `Across ${invoices.length} unpaid invoice${invoices.length === 1 ? "" : "s"}.`}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SectionCard title="Unpaid invoices" bodyClassName="p-0">
          {invoices.length === 0 ? (
            <EmptyState icon="task_alt" title="No unpaid invoices" />
          ) : (
            <ul className="divide-y divide-outline-variant/60">
              {invoices.map((inv) => (
                <li key={inv.id}>
                  <Link
                    href={invoicePaymentsRoute(inv.id)}
                    className="flex items-center gap-3 px-5 py-4 transition-colors hover:bg-surface-container-low/60"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-on-surface">{inv.documentNumber}</p>
                      <p className="text-xs text-on-surface-variant">
                        {fmtShortDate(inv.documentDate)} · {inv.daysOutstanding} day{inv.daysOutstanding === 1 ? "" : "s"}
                      </p>
                    </div>
                    <StockBadge status={inv.stockStatus} compact />
                    <p className="text-sm font-extrabold text-error">{money(inv.balanceDue)}</p>
                    <Icon name="chevron_right" size={18} className="text-on-surface-variant" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Payments" bodyClassName="p-0">
          {payments.length === 0 ? (
            <EmptyState icon="payments" title="No payments yet" description="Recorded payments show up here with the invoices they cleared." />
          ) : (
            <ul className="divide-y divide-outline-variant/60">
              {payments.map((p) => (
                <li key={p.id} className={`px-5 py-4 ${p.voidedAt ? "opacity-55" : ""}`}>
                  <div className="flex items-center gap-3">
                    <p className={`flex-1 text-base font-extrabold text-on-surface ${p.voidedAt ? "line-through" : ""}`}>
                      {money(p.amount)}
                    </p>
                    {p.voidedAt ? (
                      <Badge tone="red">Voided</Badge>
                    ) : isOwner ? (
                      <button
                        type="button"
                        onClick={() => {
                          setVoidTarget(p);
                          setVoidReason("");
                          setVoidError("");
                        }}
                        className="text-xs font-bold text-error hover:underline"
                      >
                        Void
                      </button>
                    ) : null}
                  </div>
                  <p className="mt-0.5 text-xs text-on-surface-variant">
                    {PAYMENT_METHOD_LABEL[p.method] ?? p.method} · {fmtShortDate(p.createdAt)}
                    {p.reference ? ` · ${p.reference}` : ""}
                    {p.recordedByName ? ` · ${p.recordedByName}` : ""}
                  </p>
                  {p.allocations.map((a) => (
                    <Link
                      key={a.id}
                      href={invoicePaymentsRoute(a.document)}
                      className="mt-1.5 flex justify-between text-xs"
                    >
                      <span className="font-semibold text-primary-container hover:underline">{a.documentNumber}</span>
                      <span className="text-on-surface-variant">{money(a.amount)}</span>
                    </Link>
                  ))}
                  {p.voidedAt && p.voidReason && (
                    <p className="mt-1.5 text-xs italic text-on-surface-variant">Voided: {p.voidReason}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
          {hasMore && (
            <div className="border-t border-outline-variant p-4 text-center">
              <button type="button" onClick={loadMore} disabled={loadingMore} className={btnOutline}>
                {loadingMore ? "Loading..." : "Load more"}
              </button>
            </div>
          )}
        </SectionCard>
      </div>

      <RecordPaymentDialog
        open={payOpen}
        onClose={() => setPayOpen(false)}
        onRecorded={() => {
          load();
          setToast({ tone: "success", text: "Payment recorded." });
        }}
        customerId={client.id}
        customerName={client.fullName}
        symbol={symbol}
        maxAmount={outstanding}
        invoice={null}
      />

      {voidTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="void-title"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !voiding) setVoidTarget(null);
          }}
        >
          <form onSubmit={submitVoid} className="w-full max-w-md rounded-xl bg-white p-6 shadow-modal">
            <h2 id="void-title" className="text-xl font-bold text-error">
              Void payment
            </h2>
            <p className="mt-1 text-sm text-on-surface-variant">
              {money(voidTarget.amount)} will be added back to what this client owes. The record stays in the history.
            </p>
            <div className="mt-4">
              <label htmlFor="void-reason" className={labelClasses}>
                Reason
              </label>
              <input
                id="void-reason"
                autoFocus
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                maxLength={255}
                className={`${inputClasses} h-11`}
              />
            </div>
            {voidError && (
              <p role="alert" className="mt-4 rounded-lg border border-error/30 bg-error-container px-3 py-2 text-sm text-error">
                {voidError}
              </p>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setVoidTarget(null)} disabled={voiding} className={btnOutline}>
                Cancel
              </button>
              <button type="submit" disabled={voiding} className={btnDanger}>
                {voiding ? "Voiding..." : "Void payment"}
              </button>
            </div>
          </form>
        </div>
      )}

      <Toast toast={toast} onDismiss={dismissToast} />
    </div>
  );
}