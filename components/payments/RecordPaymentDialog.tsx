// components/payments/RecordPaymentDialog.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/layout/Icon";
import { btnNavy, btnOutline, inputClasses, labelClasses } from "@/components/ui/buttonStyles";
import {
  makeIdempotencyKey,
  paymentService,
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABEL,
  type PaymentMethod,
} from "@/services/payments";
import { getApiErrorMessage } from "@/utils/getErrorMessage";
import { fmtMoney } from "@/utils/money";

interface RecordPaymentDialogProps {
  open: boolean;
  onClose: () => void;
  onRecorded: () => void;
  customerId: string;
  customerName: string;
  symbol: string;
  /** The most that can be paid: the customer's outstanding, or the one invoice's balance. */
  maxAmount: number;
  /** Set to apply the payment to one invoice. Leave out to clear the oldest invoices first. */
  invoice?: { id: string; documentNumber: string; balanceDue: number } | null;
}

export function RecordPaymentDialog({
  open,
  onClose,
  onRecorded,
  customerId,
  customerName,
  symbol,
  maxAmount,
  invoice,
}: RecordPaymentDialogProps) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [reference, setReference] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // One key per attempt. A retry after a dropped connection reuses it, so the
  // server recognises it and never records the same payment twice.
  const keyRef = useRef(makeIdempotencyKey());

  useEffect(() => {
    if (!open) return;
    keyRef.current = makeIdempotencyKey();
    setAmount(invoice ? invoice.balanceDue.toFixed(2) : "");
    setMethod("cash");
    setReference("");
    setError("");
    setSaving(false);
  }, [open, invoice?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, saving, onClose]);

  if (!open) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = amount.trim();
    const parsed = Number(trimmed);
    if (!/^\d+(\.\d{1,2})?$/.test(trimmed) || parsed <= 0) {
      setError("Enter an amount greater than zero with at most two decimals.");
      return;
    }
    if (parsed > maxAmount + 0.001) {
      setError(`That is more than the ${fmtMoney(maxAmount, symbol, 2)} outstanding.`);
      return;
    }
    setSaving(true);
    setError("");
    try {
      await paymentService.recordPayment(customerId, {
        amount: trimmed,
        method,
        reference: reference.trim(),
        documentId: invoice?.id ?? null,
        idempotencyKey: keyRef.current,
      });
      onRecorded();
      onClose();
    } catch (err: any) {
      setError(getApiErrorMessage(err, "Could not record this payment. Please try again."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="record-payment-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !saving) onClose();
      }}
    >
      <form onSubmit={submit} className="w-full max-w-md rounded-xl bg-white p-6 shadow-modal max-sm:max-h-[92vh] max-sm:overflow-y-auto max-sm:p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="record-payment-title" className="text-xl font-bold text-primary max-sm:text-lg">
              Record payment
            </h2>
            <p className="mt-0.5 text-sm text-on-surface-variant max-sm:text-xs">{customerName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-surface-container"
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        <div className="mt-4 rounded-lg border border-outline-variant bg-surface-container-low p-3 max-sm:mt-3 max-sm:p-2.5">
          <p className="text-xs text-on-surface-variant">
            {invoice ? `Applied to ${invoice.documentNumber}` : "Applied to the oldest unpaid invoices first"}
          </p>
          <p className="mt-0.5 text-sm font-extrabold text-on-surface max-sm:text-xs">
            {fmtMoney(maxAmount, symbol, 2)} outstanding
          </p>
        </div>

        <div className="mt-4 space-y-4 max-sm:mt-3 max-sm:space-y-3">
          <div>
            <label htmlFor="pay-amount" className={labelClasses}>
              Amount ({symbol})
            </label>
            <input
              id="pay-amount"
              inputMode="decimal"
              autoFocus
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
              placeholder="0.00"
              className={`${inputClasses} h-11 max-sm:h-10`}
            />
          </div>

          <div>
            <span className={labelClasses}>Method</span>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Payment method">
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m}
                  type="button"
                  aria-pressed={method === m}
                  onClick={() => setMethod(m)}
                  className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors max-sm:px-3 max-sm:py-1 max-sm:text-xs ${
                    method === m
                      ? "border-primary-container bg-primary-container font-bold text-white"
                      : "border-outline-variant bg-white font-medium text-on-surface hover:bg-surface-container-low"
                  }`}
                >
                  {PAYMENT_METHOD_LABEL[m]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="pay-ref" className={labelClasses}>
              Reference (optional)
            </label>
            <input
              id="pay-ref"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              maxLength={100}
              placeholder="Transfer ref, receipt no."
              className={`${inputClasses} h-11 max-sm:h-10`}
            />
          </div>
        </div>

        {error && (
          <p role="alert" className="mt-4 rounded-lg border border-error/30 bg-error-container px-3 py-2 text-sm text-error max-sm:mt-3 max-sm:text-xs">
            {error}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-3 max-sm:mt-4 max-sm:gap-2">
          <button type="button" onClick={onClose} disabled={saving} className={btnOutline}>
            Cancel
          </button>
          <button type="submit" disabled={saving} className={btnNavy}>
            <Icon name="payments" size={18} /> {saving ? "Saving..." : "Save payment"}
          </button>
        </div>
      </form>
    </div>
  );
}