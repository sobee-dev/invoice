// components/settings/ChangePasswordModal.tsx
"use client";

import { useState } from "react";
import { authService } from "@/services/auth";
import { Banner, errMsg, Field, inputCls, Modal } from "./ui";

export function ChangePasswordModal({ open, onClose, onDone }: { open: boolean; onClose: () => void; onDone: () => void }) {
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    setOldPw("");
    setNewPw("");
    setConfirm("");
    setError(null);
    onClose();
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!oldPw) return setError("Enter your current password.");
    if (newPw.length < 6) return setError("New password must be at least 6 characters.");
    if (newPw !== confirm) return setError("New passwords do not match.");
    if (newPw === oldPw) return setError("New password must be different from the current one.");

    setBusy(true);
    try {
      await authService.changePassword(oldPw, newPw);
      close();
      onDone();
    } catch (err) {
      setError(errMsg(err, "Could not change your password. Please try again."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={close} title="Change password">
      <form onSubmit={submit} className="space-y-4">
        {error && <Banner kind="error">{error}</Banner>}
        <Field label="Current password">
          <input type="password" autoComplete="current-password" value={oldPw} onChange={(e) => setOldPw(e.target.value)} className={inputCls} />
        </Field>
        <Field label="New password" hint="At least 6 characters.">
          <input type="password" autoComplete="new-password" value={newPw} onChange={(e) => setNewPw(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Confirm new password">
          <input type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputCls} />
        </Field>
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={close} className="h-10 rounded-lg border border-outline-variant px-4 text-sm font-semibold text-on-surface hover:bg-surface-container-low">
            Cancel
          </button>
          <button type="submit" disabled={busy} className="h-10 rounded-lg bg-primary-container px-5 text-sm font-semibold text-white hover:bg-primary disabled:opacity-60">
            {busy ? "Saving..." : "Change password"}
          </button>
        </div>
      </form>
    </Modal>
  );
}