// components/docs/AddToInventoryModal.tsx
"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/layout/Icon";
import { Modal } from "@/components/ui/Modal";
import { btnNavy, btnOutline } from "@/components/ui/buttonStyles";
import { DocumentItem, documentService } from "@/services/documents";
import { getApiErrorMessage } from "@/utils/getErrorMessage";

interface AddToInventoryModalProps {
  open: boolean;
  documentId: string;
  items: DocumentItem[];
  onClose: () => void;
  onApplied: () => void;
}

export function AddToInventoryModal({ open, documentId, items, onClose, onApplied }: AddToInventoryModalProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const tracked = items.filter((i) => i.product);

  useEffect(() => {
    if (!open) return;
    setSaving(false);
    setError("");
  }, [open]);

  const handleConfirm = async () => {
    if (saving || tracked.length === 0) return;
    setSaving(true);
    setError("");
    try {
      await documentService.addToInventory(documentId);
      onApplied();
    } catch (err: any) {
      setError(getApiErrorMessage(err, "Could not add these items to inventory. Please try again."));
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      title="Add to inventory"
      subtitle="These items will be added into stock at the quantities on this order."
      onClose={onClose}
      busy={saving}
      footer={
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} disabled={saving} className={btnOutline}>
            Not now
          </button>
          <button type="button" onClick={handleConfirm} disabled={saving || tracked.length === 0} className={btnNavy}>
            <Icon name="inventory" size={18} /> {saving ? "Adding..." : "Add to inventory"}
          </button>
        </div>
      }
    >
      {error && (
        <div role="alert" className="mb-4 rounded-lg border border-[#f9b4ae] bg-error-container p-3 text-body-md text-error">
          {error}
        </div>
      )}

      {tracked.length === 0 ? (
        <p className="text-body-md text-on-surface-variant">No product-linked line items on this order.</p>
      ) : (
        <ul className="divide-y divide-outline-variant rounded-xl border border-outline-variant px-4">
          {tracked.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-4 py-3">
              <span className="min-w-0 flex-1 truncate text-body-md text-on-surface">{item.description}</span>
              <span className="font-bold text-primary-container">+{Math.round(item.quantity)}</span>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}