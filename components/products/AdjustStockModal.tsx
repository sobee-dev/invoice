// components/products/AdjustStockModal.tsx
"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/layout/Icon";
import { Modal } from "@/components/ui/Modal";
import { btnNavy, inputClasses, labelClasses } from "@/components/ui/buttonStyles";
import { productService } from "@/services/products";
import { getApiErrorMessage } from "@/utils/getErrorMessage";

interface AdjustStockModalProps {
  open: boolean;
  productId: string;
  productName: string;
  currentStock: number;
  onClose: () => void;
  onSaved: () => void; // refresh the screen behind the modal
}

export function AdjustStockModal({ open, productId, productName, currentStock, onClose, onSaved }: AdjustStockModalProps) {
  const [direction, setDirection] = useState<"add" | "remove">("add");
  const [qty, setQty] = useState("1");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setDirection("add");
    setQty("1");
    setReason("");
    setSaving(false);
    setError("");
  }, [open]);

  const amount = /^\d+$/.test(qty.trim()) ? Number.parseInt(qty, 10) : NaN;
  const tooMany = direction === "remove" && Number.isFinite(amount) && amount > currentStock;
  const valid = Number.isFinite(amount) && amount > 0 && !tooMany && reason.trim().length > 0;

  const handleSave = async () => {
    if (!valid || saving) return;
    setSaving(true);
    setError("");
    try {
      await productService.adjustStock(productId, {
        quantityChange: direction === "add" ? amount : -amount,
        reason: reason.trim(),
      });
      onSaved();
      onClose();
    } catch (err: any) {
      setError(getApiErrorMessage(err, "Could not log this adjustment. Please try again."));
      setSaving(false);
    }
  };

  const optionClasses = (active: boolean, tone: "add" | "remove") =>
    `flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border-2 text-sm font-bold transition-colors ${
      active
        ? tone === "add"
          ? "border-status-paid-fg bg-status-paid-bg text-status-paid-fg"
          : "border-error bg-error-container text-error"
        : "border-outline-variant bg-white text-on-surface-variant hover:bg-surface-container-low"
    }`;

  return (
    <Modal
      open={open}
      title="Log adjustment"
      subtitle={`${productName} · ${currentStock} on hand`}
      onClose={onClose}
      busy={saving}
      footer={
        <button type="button" onClick={handleSave} disabled={!valid || saving} className={`${btnNavy} h-12 w-full text-base`}>
          <Icon name="save" size={20} />
          {saving ? "Saving..." : "Log adjustment"}
        </button>
      }
    >
      {error && (
        <div role="alert" className="mb-4 rounded-lg border border-[#f9b4ae] bg-error-container p-3 text-body-md text-error">
          {error}
        </div>
      )}

      <p className={labelClasses}>Adjustment type</p>
      <div className="mb-5 flex gap-3">
        <button type="button" aria-pressed={direction === "add"} onClick={() => setDirection("add")} className={optionClasses(direction === "add", "add")}>
          <Icon name="add_circle" size={18} /> Add stock
        </button>
        <button type="button" aria-pressed={direction === "remove"} onClick={() => setDirection("remove")} className={optionClasses(direction === "remove", "remove")}>
          <Icon name="remove_circle" size={18} /> Remove stock
        </button>
      </div>

      <label className={labelClasses} htmlFor="adjust-qty">Quantity</label>
      <input
        id="adjust-qty"
        inputMode="numeric"
        value={qty}
        onChange={(e) => setQty(e.target.value.replace(/\D/g, ""))}
        className={`${inputClasses} h-12 text-lg font-bold`}
        disabled={saving}
      />
      {tooMany && <p className="mt-1.5 text-xs text-error">You only have {currentStock} on hand, so you cannot remove more than that.</p>}

      <label className={`${labelClasses} mt-5`} htmlFor="adjust-reason">
        Reason <span className="text-error">*</span>
      </label>
      <textarea
        id="adjust-reason"
        rows={3}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="For example: damaged in transit, or stock count correction"
        disabled={saving}
        className={`${inputClasses} py-3`}
      />
    </Modal>
  );
}