// components/docs/DeductStockModal.tsx
"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/layout/Icon";
import { Modal } from "@/components/ui/Modal";
import { btnNavy } from "@/components/ui/buttonStyles";
import { documentService } from "@/services/documents";
import { getApiErrorMessage } from "@/utils/getErrorMessage";

export interface DeductItem {
  itemId: string;       // DocumentItem.id, the id the API needs
  productId: string;
  name: string;
  sku: string;
  invoicedQty: number;
  currentStock: number;
}

export interface AppliedDeduction {
  itemId: string;
  name: string;
  deductQty: number;
}

// Most that can be taken off: the invoiced amount, but never more than is in stock.
const maxFor = (item: DeductItem) => Math.max(0, Math.min(item.invoicedQty, item.currentStock));

function ItemRow({
  item,
  qty,
  onChange,
  disabled,
}: {
  item: DeductItem;
  qty: number;
  onChange: (next: number) => void;
  disabled: boolean;
}) {
  const max = maxFor(item);
  const insufficient = item.currentStock < item.invoicedQty;
  const partial = !insufficient && qty < item.invoicedQty;

  return (
    <li className="py-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-bold text-on-surface">{item.name}</p>
          <p className="text-xs text-on-surface-variant">SKU: {item.sku}</p>
        </div>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
            insufficient ? "bg-error-container text-error" : "bg-secondary-container text-on-secondary-container"
          }`}
        >
          {item.currentStock > 0 ? `${item.currentStock} in stock` : "Out of stock"}
        </span>
      </div>

      <div className="mt-4 flex items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Deduct quantity</p>
          <div
            className={`inline-flex items-center overflow-hidden rounded-xl border-2 ${
              insufficient ? "border-error" : "border-outline-variant"
            }`}
          >
            <button
              type="button"
              aria-label={`Deduct fewer ${item.name}`}
              onClick={() => onChange(Math.max(qty - 1, 0))}
              disabled={disabled || qty <= 0}
              className="flex h-11 w-11 items-center justify-center bg-surface-container-low hover:bg-surface-container disabled:opacity-40"
            >
              <Icon name="remove" size={18} />
            </button>
            <span className={`w-16 text-center text-xl font-extrabold ${insufficient ? "text-error" : "text-on-surface"}`}>
              {qty}
            </span>
            <button
              type="button"
              aria-label={`Deduct more ${item.name}`}
              onClick={() => onChange(Math.min(qty + 1, max))}
              disabled={disabled || qty >= max}
              className="flex h-11 w-11 items-center justify-center bg-surface-container-low hover:bg-surface-container disabled:opacity-40"
            >
              <Icon name="add" size={18} />
            </button>
          </div>
        </div>

        <div className="text-right">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Invoiced</p>
          <p className={`text-lg font-extrabold ${insufficient ? "text-error" : "text-primary-container"}`}>
            {item.invoicedQty} units
          </p>
        </div>
      </div>

      {insufficient ? (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-error">
          <Icon name="warning" size={14} /> Not enough stock to cover the full invoice.
        </p>
      ) : partial ? (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-on-surface-variant">
          <Icon name="info" size={14} /> Deducting less than the full invoiced quantity.
        </p>
      ) : null}
    </li>
  );
}

interface DeductStockModalProps {
  open: boolean;
  documentId: string;
  documentNumber: string;
  items: DeductItem[];
  onClose: () => void;
  onApplied: (deductions: AppliedDeduction[]) => void;
}

export function DeductStockModal({ open, documentId, documentNumber, items, onClose, onApplied }: DeductStockModalProps) {
  const [qtys, setQtys] = useState<Record<string, number>>({});
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState("");

  // Start at the most that can be deducted, the same default as mobile.
  useEffect(() => {
    if (!open) return;
    const initial: Record<string, number> = {};
    items.forEach((i) => {
      initial[i.itemId] = maxFor(i);
    });
    setQtys(initial);
    setApplying(false);
    setError("");
  }, [open, items]);

  const subtractAll = items.length > 0 && items.every((i) => (qtys[i.itemId] ?? 0) === maxFor(i));
  const total = Object.values(qtys).reduce((sum, q) => sum + q, 0);

  const setAll = (on: boolean) => {
    const next: Record<string, number> = {};
    items.forEach((i) => {
      next[i.itemId] = on ? maxFor(i) : 0;
    });
    setQtys(next);
  };

  const handleApply = async () => {
    const chosen = items.filter((i) => (qtys[i.itemId] ?? 0) > 0);
    if (chosen.length === 0 || applying) return;

    setApplying(true);
    setError("");
    try {
      // All or nothing on the backend: if this throws, no stock moved.
      await documentService.deductInventory(
        documentId,
        chosen.map((i) => ({ itemId: i.itemId, qty: qtys[i.itemId] })),
      );
      onApplied(chosen.map((i) => ({ itemId: i.itemId, name: i.name, deductQty: qtys[i.itemId] })));
    } catch (err: any) {
      setError(getApiErrorMessage(err, "Could not deduct stock. Please try again."));
      setApplying(false);
    }
  };

  return (
    <Modal
      open={open}
      title="Deduct stock"
      subtitle={`Invoice ${documentNumber}`}
      onClose={onClose}
      busy={applying}
      footer={
        <div>
          <div className="mb-4 flex items-center justify-between">
            <span className="text-body-md font-medium text-on-surface">Total to deduct</span>
            <span className="text-lg font-extrabold text-primary-container">{total} units</span>
          </div>
          <button type="button" onClick={handleApply} disabled={applying || total === 0} className={`${btnNavy} h-12 w-full text-base`}>
            <Icon name="inventory_2" size={20} />
            {applying ? "Deducting..." : "Apply deduction"}
          </button>
          {total === 0 && !applying && (
            <p className="mt-2 text-center text-xs text-on-surface-variant">Choose at least one unit to deduct.</p>
          )}
        </div>
      }
    >
      <label className="mb-5 flex cursor-pointer items-center gap-4 rounded-xl border border-outline-variant bg-surface p-4">
        <span className="flex-1">
          <span className="block font-bold text-on-surface">Subtract all</span>
          <span className="block text-xs text-on-surface-variant">Match every quantity to the invoice</span>
        </span>
        <input
          type="checkbox"
          role="switch"
          checked={subtractAll}
          disabled={applying}
          onChange={(e) => setAll(e.target.checked)}
          className="h-5 w-5 accent-primary-container"
        />
      </label>

      {error && (
        <div role="alert" className="mb-4 rounded-lg border border-[#f9b4ae] bg-error-container p-3 text-body-md text-error">
          {error}
        </div>
      )}

      <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Invoice items</p>
      <ul className="mt-1 divide-y divide-outline-variant rounded-xl border border-outline-variant px-4">
        {items.map((item) => (
          <ItemRow
            key={item.itemId}
            item={item}
            qty={qtys[item.itemId] ?? 0}
            onChange={(next) => setQtys((prev) => ({ ...prev, [item.itemId]: next }))}
            disabled={applying}
          />
        ))}
      </ul>
    </Modal>
  );
}