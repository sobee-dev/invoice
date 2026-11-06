// components/settings/ui.tsx
"use client";

import { ReactNode, useEffect } from "react";
import { Icon } from "@/components/layout/Icon";

export const inputCls =
  "h-11 w-full rounded-lg border border-outline-variant bg-white px-3 text-body-md text-on-surface outline-none placeholder:text-outline focus:border-primary-container disabled:bg-surface-container-low disabled:text-on-surface-variant";

export function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-outline-variant bg-white shadow-card">
      <header className="border-b border-outline-variant px-5 py-4">
        <h2 className="text-base font-bold text-primary">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-on-surface-variant">{description}</p>}
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}

export function Field({
  label,
  hint,
  children,
  className = "",
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-sm font-semibold text-on-surface">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-on-surface-variant">{hint}</span>}
    </label>
  );
}

export function Toggle({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
        checked ? "bg-primary-container" : "bg-outline-variant"
      }`}
    >
      <span
        className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-5" : ""
        }`}
      />
    </button>
  );
}

export function Banner({ kind, children }: { kind: "success" | "error"; children: ReactNode }) {
  const styles =
    kind === "success"
      ? "border-status-paid-fg/30 bg-status-paid-bg text-status-paid-fg"
      : "border-error/30 bg-error-container text-on-error-container";
  return (
    <div role={kind === "error" ? "alert" : "status"} className={`flex items-start gap-2 rounded-lg border px-4 py-3 text-sm ${styles}`}>
      <Icon name={kind === "success" ? "check_circle" : "error"} size={18} filled />
      <div>{children}</div>
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-xl border border-outline-variant bg-white p-6 shadow-card"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-on-surface">{title}</h3>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-1 text-on-surface-variant hover:bg-surface-container-low">
            <Icon name="close" size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/** Pulls a readable message out of a DRF / axios error (keys are already camelCased). */
export function errMsg(err: unknown, fallback: string): string {
  const data = (err as { response?: { data?: unknown } })?.response?.data;
  if (typeof data === "string" && data.length < 300) return data;
  if (data && typeof data === "object") {
    const d = data as Record<string, unknown>;
    for (const key of ["error", "detail", "message"]) {
      if (typeof d[key] === "string") return d[key] as string;
    }
    for (const v of Object.values(d)) {
      if (Array.isArray(v) && typeof v[0] === "string") return v[0];
      if (typeof v === "string") return v;
    }
  }
  return fallback;
}