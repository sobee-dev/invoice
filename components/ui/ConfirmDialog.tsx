// components/ui/ConfirmDialog.tsx
"use client";

import { ReactNode, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { btnDanger, btnNavy, btnOutline } from "@/components/ui/buttonStyles";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  tone?: "danger" | "default";
  // The parent closes the dialog once this settles.
  onConfirm: () => Promise<void> | void;
  onClose: () => void;
}

export function ConfirmDialog({ open, title, description, confirmLabel, tone = "default", onConfirm, onClose }: ConfirmDialogProps) {
  const [busy, setBusy] = useState(false);

  const handleConfirm = async () => {
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      title={title}
      onClose={onClose}
      busy={busy}
      footer={
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} disabled={busy} className={btnOutline}>
            Cancel
          </button>
          <button type="button" onClick={handleConfirm} disabled={busy} className={tone === "danger" ? btnDanger : btnNavy}>
            {busy ? "Working..." : confirmLabel}
          </button>
        </div>
      }
    >
      <p className="text-body-md text-on-surface-variant">{description}</p>
    </Modal>
  );
}