// components/ui/Modal.tsx
"use client";

import { ReactNode, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/components/layout/Icon";

interface ModalProps {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  busy?: boolean; // blocks closing while a request is running
  children: ReactNode;
  footer?: ReactNode;
}

export function Modal({ open, title, subtitle, onClose, busy = false, children, footer }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  // Focus the panel on open, lock page scroll, and hand focus back on close.
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    return () => {
      document.body.style.overflow = "";
      previous?.focus?.();
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) closeRef.current();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, busy]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 sm:items-center sm:p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl outline-none sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-4 px-6 pb-4 pt-6">
          <div>
            <h2 className="text-xl font-extrabold text-primary-container">{title}</h2>
            {subtitle && <p className="mt-0.5 text-body-md text-on-surface-variant">{subtitle}</p>}
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            disabled={busy}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-container text-on-surface hover:bg-surface-container-high disabled:opacity-50"
          >
            <Icon name="close" size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 pb-4">{children}</div>
        {footer && <div className="border-t border-outline-variant px-6 py-4">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}