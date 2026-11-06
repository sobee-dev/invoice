// components/docs/NewDocumentMenu.tsx
"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/layout/Icon";
import { useSubscriptionContext } from "@/context/SubscriptionContext";
import { useDismiss } from "@/hooks/useDismiss";
import { ROUTES } from "@/lib/routes";
import type { Customer } from "@/services/customers";

const OWNER_OPTIONS = [
  {
    href: ROUTES.newSalesInvoice,
    icon: "receipt_long",
    tile: "bg-secondary-container text-on-secondary-container",
    title: "Sales Invoice",
    description: "Invoice with inline items, tax & discount",
    countsTowardLimit: true,
  },
  {
    href: ROUTES.newDocument,
    icon: "description",
    tile: "bg-primary-fixed text-primary-container",
    title: "Proforma / Supplier Order",
    description: "Quote, proforma invoice, or purchase order",
    countsTowardLimit: false,
  },
] as const;

// Staff can only create sales and proforma invoices, never supplier orders.
const STAFF_OPTIONS = [
  {
    href: ROUTES.staffNewSalesInvoice,
    icon: "receipt_long",
    tile: "bg-secondary-container text-on-secondary-container",
    title: "Sales Invoice",
    description: "Invoice with inline items, tax & discount",
    countsTowardLimit: true,
  },
  {
    href: ROUTES.staffNewDocument,
    icon: "description",
    tile: "bg-primary-fixed text-primary-container",
    title: "Proforma Invoice",
    description: "Quote or proforma invoice",
    countsTowardLimit: false,
  },
] as const;

interface NewDocumentMenuProps {
  customer?: Pick<Customer, "id" | "fullName" | "phone" | "email">; // pre-fills the new document
  compact?: boolean; // a round plus button for card headers
  variant?: "owner" | "staff";
}

function withCustomer(href: string, customer: NewDocumentMenuProps["customer"]): string {
  if (!customer) return href;
  const params = new URLSearchParams({ customerId: customer.id, customerName: customer.fullName });
  if (customer.phone) params.set("customerPhone", customer.phone);
  if (customer.email) params.set("customerEmail", customer.email);
  return `${href}?${params.toString()}`;
}

export function NewDocumentMenu({ customer, compact = false, variant = "owner" }: NewDocumentMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useDismiss(ref, open, () => setOpen(false));

  const { subscription, canCreate, showPlanLimit } = useSubscriptionContext();
  const invoicesLocked = !canCreate("invoices");
  const options = variant === "staff" ? STAFF_OPTIONS : OWNER_OPTIONS;

  const openLimit = () => {
    setOpen(false);
    showPlanLimit({
      resource: "invoices",
      limit: subscription?.limits.invoices,
      current: subscription?.usage.invoices,
    });
  };

  return (
    <div ref={ref} className="relative">
      {compact ? (
        <button
          type="button"
          aria-label={customer ? `New document for ${customer.fullName}` : "New document"}
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="flex h-9 w-9 items-center justify-center rounded-full text-primary hover:bg-surface-container-low"
        >
          <Icon name="add" size={22} />
        </button>
      ) : (
        <button
          type="button"
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="flex h-10 items-center gap-2 rounded-lg bg-secondary px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          <Icon name="add" size={18} /> New Document <Icon name="expand_more" size={18} />
        </button>
      )}

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-2 w-80 overflow-hidden rounded-xl border border-outline-variant bg-white p-2 shadow-lg"
        >
          {options.map((option) => {
            const locked = option.countsTowardLimit && invoicesLocked;
            const body = (
              <>
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${option.tile}`}>
                  <Icon name={option.icon} size={22} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-on-surface">{option.title}</span>
                  <span className="block text-xs text-on-surface-variant">
                    {locked ? "Monthly invoice limit reached" : option.description}
                  </span>
                </span>
                <Icon name={locked ? "lock" : "chevron_right"} size={20} className="text-on-surface-variant" />
              </>
            );

            return locked ? (
              <button
                key={option.href}
                type="button"
                role="menuitem"
                onClick={openLimit}
                className="flex w-full items-center gap-3 rounded-lg p-3 text-left opacity-60 hover:bg-surface-container-low"
              >
                {body}
              </button>
            ) : (
              <Link
                key={option.href}
                href={withCustomer(option.href, customer)}
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-lg p-3 hover:bg-surface-container-low"
              >
                {body}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}