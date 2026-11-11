// components/ui/Toast.tsx
"use client";

import { useEffect } from "react";
import { Icon } from "@/components/layout/Icon";

export interface ToastState {
  tone: "success" | "error";
  text: string;
}

// onDismiss must keep the same identity between renders, or the timer restarts.
export function Toast({ toast, onDismiss, raised = false, }: { toast: ToastState | null; onDismiss: () => void; raised?: boolean; }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onDismiss, 6000);
    return () => clearTimeout(t);
  }, [toast, onDismiss]);

  if (!toast) return null;
  const ok = toast.tone === "success";

  return (
    <div
      role="status"
      className={`fixed right-6 z-60 flex max-w-sm items-start gap-3 rounded-xl border p-4 shadow-lg ${
        raised ? "bottom-24 lg:bottom-6" : "bottom-6"
      } ${ok ? "border-status-paid-fg/30 bg-status-paid-bg text-status-paid-fg" : "border-error/30 bg-error-container text-error"}`}
    >
      <Icon name={ok ? "check_circle" : "error"} size={20} filled className="mt-0.5" />
      <p className="whitespace-pre-line text-body-md">{toast.text}</p>
      <button type="button" aria-label="Dismiss" onClick={onDismiss} className="ml-1 opacity-70 hover:opacity-100">
        <Icon name="close" size={18} />
      </button>
    </div>
  );
}