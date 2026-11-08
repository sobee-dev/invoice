// components/docs/form/SavedDialog.tsx
"use client";

import { Icon } from "@/components/layout/Icon";
import { Modal } from "@/components/ui/Modal";
import { btnNavy, btnOutline } from "@/components/ui/buttonStyles";
import { DocumentKind } from "@/lib/documentForm";
import { TYPE_LABEL } from "@/lib/documents";

interface SavedDialogProps {
  open: boolean;
  documentNumber: string;
  kind: DocumentKind;
  mode: "created" | "updated";
  paidFailed: boolean;
  onView: () => void;
  onBack: () => void;
  onCreateAnother?: () => void;
  onDeduct?: () => void;
  deductBusy?: boolean;
}

export function SavedDialog(p: SavedDialogProps) {
  return (
    <Modal
      open={p.open}
      title={p.mode === "created" ? "Saved" : "Changes saved"}
      onClose={p.onBack}
      footer={
        <div className="flex flex-wrap justify-end gap-3 max-sm:gap-2">
          {p.onDeduct && (
            <button type="button" onClick={p.onDeduct} disabled={p.deductBusy} className={btnOutline}>
              <Icon name="inventory_2" size={18} /> {p.deductBusy ? "Loading stock..." : "Deduct stock"}
            </button>
          )}
          {p.onCreateAnother && (
            <button type="button" onClick={p.onCreateAnother} className={btnOutline}>
              Create another
            </button>
          )}
          <button type="button" onClick={p.onView} className={btnNavy}>
            View {TYPE_LABEL[p.kind].toLowerCase()}
          </button>
        </div>
      }
    >
      <div className="flex flex-col items-center gap-3 py-2 text-center max-sm:gap-2">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-status-paid-bg text-status-paid-fg max-sm:h-12 max-sm:w-12">
          <Icon name="check_circle" size={32} mobileSize={26} filled />
        </span>
        <p className="text-body-lg text-on-surface max-sm:text-base">
          <span className="font-bold">{p.documentNumber}</span> has been saved.
        </p>
        {p.paidFailed && (
          <p role="alert" className="rounded-lg bg-status-warn-bg p-3 text-body-md text-status-warn-fg max-sm:p-2.5 max-sm:text-sm">
            It was saved, but it could not be marked as paid. Open it to try again.
          </p>
        )}
      </div>
    </Modal>
  );
}